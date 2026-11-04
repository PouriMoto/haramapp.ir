/**
 * haramapp — Google Apps Script backend (مسیر B)
 *
 * Script Properties (Project Settings → Script properties) — هرگز در کد/ریپو نگذارید:
 *   SHEET_ID               (اختیاری؛ پیش‌فرض: اسپردشیت متصل به اسکریپت)
 *   AUTO_APPROVE           'true' → پیام‌ها بدون تأیید دستی نمایش داده شوند (پیش‌فرض false)
 *   ADMIN_TOKEN            برای addCause
 *   PAYMENTS_ENABLED       'true' = پرداخت آنلاین روشن (پیش‌فرض خاموش). کلید روشن/خاموش کل پرداخت.
 *   PAYMENT_ENDPOINT       آدرس /start سرویس پرداخت (سرور با IP ایران)
 *   PAYMENT_SHARED_SECRET  راز مشترک با سرویس پرداخت (SHARED_SECRET آن)
 *   MIN_TOMAN / MAX_TOMAN  حدود مبلغ (پیش‌فرض ۱۰٬۰۰۰ تا ۵۰۰٬۰۰۰٬۰۰۰)
 *
 * GET  ?action=messages|stats|causes|cause|myPayments|helpTotal|config
 * POST (text/plain, JSON): postMessage|addSalavat|addCause|startPayment|confirmPayment
 * پاسخ: {ok:true,data} | {ok:false,code,error}
 */

var LIMITS = {
  messageMin: 3, messageMax: 1000, nameMax: 60, titleMax: 80, descMax: 300,
  pageMax: 50, pageDefault: 20, minToman: 10000, maxToman: 500000000, accountsMax: 8, salavatBatchMax: 100
};
var RATE = { // {max, windowSec}
  postMessage: { max: 3, windowSec: 600 },
  addSalavat: { max: 60, windowSec: 60 },
  startPayment: { max: 5, windowSec: 600 }
};
var SHEETS = {
  Messages: ['id', 'createdAt', 'name', 'phone', 'message', 'approved', 'clientId'],
  Causes: ['id', 'title', 'description', 'accounts', 'bank', 'online'],
  Payments: ['id', 'createdAt', 'clientId', 'causeId', 'accountId', 'amount', 'status', 'authority', 'refId']
};

function ApiErr_(code, message) {
  var e = new Error(message);
  e.apiCode = code;
  return e;
}

/* ---------- utilities ---------- */

function out_(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}

function prop_(k, def) {
  var v = PropertiesService.getScriptProperties().getProperty(k);
  return v === null || v === undefined || v === '' ? def : v;
}

function normDigits_(s) {
  return String(s).replace(/[۰-۹]/g, function (d) { return '۰۱۲۳۴۵۶۷۸۹'.indexOf(d); })
    .replace(/[٠-٩]/g, function (d) { return '٠١٢٣٤٥٦٧٨٩'.indexOf(d); });
}

function clean_(s, max) {
  // حذف کاراکترهای کنترلی (به‌جز خط جدید)، trim
  var t = String(s === undefined || s === null ? '' : s).replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, '').trim();
  return t.length > max ? t.substring(0, max) : t;
}

/** دفاع در برابر formula injection در Google Sheets */
function safeCell_(v) {
  var s = String(v);
  return /^[=+\-@\t\r]/.test(s) ? "'" + s : s;
}
function readCell_(v) {
  var s = String(v);
  return /^'[=+\-@\t\r]/.test(s) ? s.substring(1) : s;
}

function validClientId_(id) {
  if (!/^[A-Za-z0-9\-]{8,64}$/.test(String(id || ''))) throw ApiErr_('validation', 'clientId نامعتبر');
  return String(id);
}

function rateLimit_(action, clientId) {
  var r = RATE[action];
  if (!r) return;
  var cache = CacheService.getScriptCache();
  var key = 'rl:' + action + ':' + clientId;
  var n = Number(cache.get(key) || 0);
  if (n >= r.max) throw ApiErr_('rate_limited', 'درخواست‌ها زیاد است؛ کمی بعد تلاش کنید');
  cache.put(key, String(n + 1), r.windowSec);
}

function withLock_(fn) {
  var lock = LockService.getScriptLock();
  if (!lock.tryLock(10000)) throw ApiErr_('server', 'سرور مشغول است');
  try { return fn(); } finally { lock.releaseLock(); }
}

function ss_() {
  var id = prop_('SHEET_ID', '');
  return id ? SpreadsheetApp.openById(id) : SpreadsheetApp.getActive();
}

function sheet_(name) {
  var ss = ss_();
  var sh = ss.getSheetByName(name);
  if (!sh) {
    sh = ss.insertSheet(name);
    var cols = SHEETS[name];
    sh.getRange(1, 1, 1, cols.length).setValues([cols]);
    // ستون‌ها متن ساده تا هیچ سلولی فرمول نشود
    sh.getRange(2, 1, sh.getMaxRows() - 1, cols.length).setNumberFormat('@');
    sh.setFrozenRows(1);
  }
  return sh;
}

function rows_(name) {
  var sh = sheet_(name);
  var last = sh.getLastRow();
  if (last < 2) return [];
  return sh.getRange(2, 1, last - 1, SHEETS[name].length).getValues();
}

function uid_() { return Utilities.getUuid().replace(/-/g, '').substring(0, 16); }

/* ---------- validation ---------- */

function validateMessage_(b) {
  var message = clean_(b.message, LIMITS.messageMax + 1);
  if (message.length < LIMITS.messageMin) throw ApiErr_('validation', 'متن خیلی کوتاه است');
  if (message.length > LIMITS.messageMax) throw ApiErr_('validation', 'متن خیلی بلند است');
  var name = clean_(b.name, LIMITS.nameMax);
  var phone = normDigits_(clean_(b.phone, 20));
  if (phone && !/^09\d{9}$/.test(phone)) throw ApiErr_('validation', 'شماره موبایل معتبر نیست');
  return { message: message, name: name, phone: phone };
}

function validateAmount_(raw) {
  var n = Number(raw);
  var min = Number(prop_('MIN_TOMAN', LIMITS.minToman));
  var max = Number(prop_('MAX_TOMAN', LIMITS.maxToman));
  if (!isFinite(n) || Math.floor(n) !== n) throw ApiErr_('validation', 'مبلغ نامعتبر است');
  if (n < min) throw ApiErr_('validation', 'مبلغ کمتر از حداقل است');
  if (n > max) throw ApiErr_('validation', 'مبلغ بیشتر از سقف مجاز است');
  return n;
}

/* ---------- messages / stats ---------- */

function approvedMessages_() {
  var list = rows_('Messages').filter(function (r) { return String(r[5]).toLowerCase() === 'true'; });
  list.reverse(); // جدیدترین اول
  return list;
}

function listMessages_(p) {
  var limit = Math.max(1, Math.min(LIMITS.pageMax, parseInt(p.limit, 10) || LIMITS.pageDefault));
  var start = p.cursor ? Number(p.cursor) : 0;
  if (!isFinite(start) || start < 0 || Math.floor(start) !== start) throw ApiErr_('validation', 'cursor نامعتبر');
  var all = approvedMessages_();
  var items = all.slice(start, start + limit).map(function (r) {
    // phone و clientId عمداً برنمی‌گردند
    return { id: String(r[0]), createdAt: String(r[1]), name: readCell_(r[2]), message: readCell_(r[4]) };
  });
  var next = start + limit;
  return { items: items, nextCursor: next < all.length ? String(next) : null };
}

function postMessage_(b) {
  if (b.website) return null; // honeypot: بی‌صدا موفق
  var clientId = validClientId_(b.clientId);
  var v = validateMessage_(b);
  rateLimit_('postMessage', clientId);
  var approved = prop_('AUTO_APPROVE', 'false') === 'true';
  withLock_(function () {
    sheet_('Messages').appendRow([
      uid_(), new Date().toISOString(), safeCell_(v.name), safeCell_(v.phone),
      safeCell_(v.message), approved ? 'true' : 'false', clientId
    ]);
  });
  return null;
}

function getStats_() {
  return {
    salavat: Number(PropertiesService.getScriptProperties().getProperty('SALAVAT') || 0),
    messages: approvedMessages_().length
  };
}

function addSalavat_(b) {
  var clientId = validClientId_(b.clientId);
  rateLimit_('addSalavat', clientId);
  var count = b.count === undefined ? 1 : Number(b.count);
  if (!isFinite(count) || Math.floor(count) !== count || count < 1 || count > LIMITS.salavatBatchMax) throw ApiErr_('validation', 'تعداد نامعتبر');
  withLock_(function () {
    var props = PropertiesService.getScriptProperties();
    props.setProperty('SALAVAT', String(Number(props.getProperty('SALAVAT') || 0) + count));
  });
  return getStats_();
}

/* ---------- help (همیاری) ---------- */

function paidSums_() {
  var byCause = {}, byAccount = {}, total = 0;
  rows_('Payments').forEach(function (r) {
    if (String(r[6]) !== 'paid') return;
    var amt = Number(r[5]) || 0;
    byCause[r[3]] = (byCause[r[3]] || 0) + amt;
    if (r[4]) byAccount[r[3] + '/' + r[4]] = (byAccount[r[3] + '/' + r[4]] || 0) + amt;
    total += amt;
  });
  return { byCause: byCause, byAccount: byAccount, total: total };
}

/** اطلاعات واریز مستقیم: عمومی است. خالی → null؛ نامعتبر → خطا */
function validateBank_(b) {
  if (!b || typeof b !== 'object') return null;
  var card = normDigits_(clean_(b.cardNumber, 30)).replace(/[\s\-]/g, '');
  var iban = normDigits_(clean_(b.iban, 40)).replace(/[\s\-]/g, '').toUpperCase();
  if (!card && !iban) return null;
  if (card && !/^\d{16}$/.test(card)) throw ApiErr_('validation', 'شماره کارت باید ۱۶ رقم باشد');
  if (iban && !/^IR\d{24}$/.test(iban)) throw ApiErr_('validation', 'شماره شبا نامعتبر است');
  return { bankName: clean_(b.bankName, 60), ownerName: clean_(b.ownerName, 80), cardNumber: card, iban: iban };
}

function parseJson_(s, def) {
  try { return s ? JSON.parse(s) : def; } catch (e) { return def; }
}

function causeView_(r, sums) {
  var accounts = parseJson_(r[3], []);
  var bank = parseJson_(r[4], null);
  return {
    id: String(r[0]),
    title: readCell_(r[1]),
    description: readCell_(r[2]) || undefined,
    totalToman: sums.byCause[r[0]] || 0,
    bank: bank || undefined,
    online: String(r[5]) === 'true',
    accounts: accounts.map(function (a) {
      return { id: a.id, title: a.title, bank: a.bank || undefined, online: a.online === true, totalToman: sums.byAccount[r[0] + '/' + a.id] || 0 };
    })
  };
}

function norm_(s) {
  return normDigits_(String(s)).replace(/ي/g, 'ی').replace(/ك/g, 'ک').replace(/[‌‏‎]/g, ' ')
    .replace(/\s+/g, ' ').trim().toLowerCase();
}

function listCauses_(p) {
  var sums = paidSums_();
  var needle = norm_(p.q || '');
  return rows_('Causes').map(function (r) { return causeView_(r, sums); }).filter(function (c) {
    if (!needle) return true;
    var hay = norm_(c.title + ' ' + (c.description || '') + ' ' + c.accounts.map(function (a) { return a.title; }).join(' '));
    return hay.indexOf(needle) !== -1;
  });
}

function getCause_(id) {
  var sums = paidSums_();
  var rs = rows_('Causes');
  for (var i = 0; i < rs.length; i++) if (String(rs[i][0]) === String(id)) return causeView_(rs[i], sums);
  throw ApiErr_('not_found', 'مقصد پیدا نشد');
}

function addCause_(b) {
  var token = prop_('ADMIN_TOKEN', '');
  if (!token || b.adminToken !== token) throw ApiErr_('server', 'مجاز نیست');
  var title = clean_(b.title, LIMITS.titleMax);
  if (!title) throw ApiErr_('validation', 'عنوان لازم است');
  var desc = clean_(b.description, LIMITS.descMax);
  var raw = (b.accounts || []).map(function (a) {
    // هم رشته (قدیمی) هم {id?, title, bank?, online?} پذیرفته می‌شود
    if (typeof a === 'string') return { title: clean_(a, LIMITS.titleMax) };
    return { id: a && a.id, title: clean_(a && a.title, LIMITS.titleMax), bank: a && a.bank, online: !!(a && a.online) };
  }).filter(function (a) { return a.title; });
  if (raw.length > LIMITS.accountsMax) throw ApiErr_('validation', 'حداکثر ۸ حساب');
  var accounts = raw.map(function (a, i) {
    var aid = a.id ? String(a.id) : 'a' + (i + 1);
    if (!/^[a-z0-9_-]{1,64}$/.test(aid)) throw ApiErr_('validation', 'شناسه حساب نامعتبر');
    var acc = { id: aid, title: a.title, online: a.online === true };
    var bk = validateBank_(a.bank);
    if (bk) acc.bank = bk;
    return acc;
  });
  var bank = validateBank_(b.bank);
  var id = b.id ? String(b.id) : uid_();
  if (!/^[a-z0-9_-]{1,64}$/.test(id) && !/^[0-9a-f]{16}$/.test(id)) throw ApiErr_('validation', 'شناسه نامعتبر');
  var row = [id, safeCell_(title), safeCell_(desc), JSON.stringify(accounts), bank ? JSON.stringify(bank) : '', b.online === true ? 'true' : 'false'];
  withLock_(function () {
    var sh = sheet_('Causes');
    var rs = rows_('Causes');
    for (var i = 0; i < rs.length; i++) {
      if (String(rs[i][0]) === id) { // upsert: کارت با همین شناسه به‌روزرسانی می‌شود
        sh.getRange(i + 2, 1, 1, row.length).setValues([row]);
        return;
      }
    }
    sh.appendRow(row);
  });
  return getCause_(id);
}

function paymentsEnabled_() { return prop_('PAYMENTS_ENABLED', 'false') === 'true'; }

function startPayment_(b) {
  var clientId = validClientId_(b.clientId);
  var amount = validateAmount_(b.amountToman);
  var cause = getCause_(b.causeId);
  var account = null;
  if (cause.accounts.length > 0) {
    account = cause.accounts.filter(function (a) { return a.id === b.accountId; })[0];
    if (!account) throw ApiErr_('validation', 'حساب انتخاب نشده');
  }
  if (!paymentsEnabled_()) throw ApiErr_('server', 'پرداخت آنلاین فعلاً غیرفعال است');
  if (!(account ? account.online : cause.online)) throw ApiErr_('server', 'پرداخت آنلاین برای این مقصد فعال نیست');
  rateLimit_('startPayment', clientId);
  var endpoint = prop_('PAYMENT_ENDPOINT', '');
  var shared = prop_('PAYMENT_SHARED_SECRET', '');
  if (!endpoint || !shared) throw ApiErr_('server', 'درگاه پرداخت هنوز تنظیم نشده');

  var id = uid_();
  withLock_(function () {
    sheet_('Payments').appendRow([id, new Date().toISOString(), clientId, cause.id, account ? account.id : '', amount, 'pending', '', '']);
  });
  var res = UrlFetchApp.fetch(endpoint, {
    method: 'post', contentType: 'application/json', muteHttpExceptions: true, headers: { 'X-Auth': shared },
    payload: JSON.stringify({ paymentId: id, amountToman: amount, causeId: cause.id, accountId: account ? account.id : '' })
  });
  var data;
  try { data = JSON.parse(res.getContentText()); } catch (e) { data = null; }
  if (res.getResponseCode() !== 200 || !data || !data.payUrl) {
    setPayment_(id, { status: 'failed' });
    throw ApiErr_('server', 'ساخت تراکنش ناموفق بود');
  }
  setPayment_(id, { authority: String(data.authority || '') });
  return { payUrl: String(data.payUrl) };
}

function setPayment_(id, patch) {
  withLock_(function () {
    var sh = sheet_('Payments');
    var rs = rows_('Payments');
    for (var i = 0; i < rs.length; i++) {
      if (String(rs[i][0]) !== String(id)) continue;
      var row = i + 2;
      if (patch.status !== undefined) sh.getRange(row, 7).setValue(patch.status);
      if (patch.authority !== undefined) sh.getRange(row, 8).setValue(patch.authority);
      if (patch.refId !== undefined) sh.getRange(row, 9).setValue(patch.refId);
      return;
    }
  });
}

/** فراخوانی از سرویس پرداخت پس از verify. authority باید همان باشد که هنگام start ذخیره شد
 *  (جلوگیری از «یک پرداخت واقعی، چند تأیید»). فقط pending→paid/failed؛ تکرار بی‌اثر است. */
function confirmPayment_(b) {
  var secret = prop_('PAYMENT_SHARED_SECRET', '');
  if (!secret || b.secret !== secret) throw ApiErr_('server', 'مجاز نیست');
  var status = b.status === 'paid' ? 'paid' : 'failed';
  var rs = rows_('Payments'), row = null;
  for (var i = 0; i < rs.length; i++) if (String(rs[i][0]) === String(b.paymentId)) { row = rs[i]; break; }
  if (!row) throw ApiErr_('not_found', 'پرداخت پیدا نشد');
  var current = String(row[6]);
  if (current === status) return null; // تکراری
  if (current !== 'pending') throw ApiErr_('validation', 'وضعیت قابل تغییر نیست');
  if (status === 'paid' && (!b.authority || String(b.authority) !== String(row[7]))) throw ApiErr_('validation', 'authority مطابقت ندارد');
  setPayment_(b.paymentId, { status: status, refId: String(b.refId || '') });
  return null;
}

function myPayments_(clientId) {
  validClientId_(clientId);
  var titles = {};
  listCauses_({}).forEach(function (c) {
    titles[c.id] = { title: c.title, accounts: {} };
    c.accounts.forEach(function (a) { titles[c.id].accounts[a.id] = a.title; });
  });
  return rows_('Payments').filter(function (r) { return String(r[2]) === clientId; }).reverse().map(function (r) {
    var t = titles[r[3]] || { title: '', accounts: {} };
    return {
      id: String(r[0]), causeId: String(r[3]), causeTitle: t.title,
      accountId: r[4] ? String(r[4]) : undefined, accountTitle: r[4] ? t.accounts[r[4]] : undefined,
      amountToman: Number(r[5]) || 0, status: String(r[6]), createdAt: String(r[1]),
      refId: r[8] ? String(r[8]) : undefined
    };
  });
}

/* ---------- entry points ---------- */

function handle_(fn) {
  try {
    return out_({ ok: true, data: fn() });
  } catch (e) {
    var code = e && e.apiCode ? e.apiCode : 'server';
    if (!e || !e.apiCode) console.error(e && e.stack ? e.stack : e); // جزئیات داخلی به کاربر نمی‌رسد
    return out_({ ok: false, code: code, error: e && e.apiCode ? e.message : 'خطای سرور' });
  }
}

function doGet(e) {
  var p = (e && e.parameter) || {};
  return handle_(function () {
    switch (p.action) {
      case 'messages': return listMessages_(p);
      case 'stats': return getStats_();
      case 'causes': return listCauses_(p);
      case 'cause': return getCause_(p.id);
      case 'myPayments': return myPayments_(p.clientId);
      case 'helpTotal': return { totalToman: paidSums_().total };
      case 'config': return { paymentsEnabled: paymentsEnabled_() };
      default: throw ApiErr_('validation', 'action نامعتبر');
    }
  });
}

function doPost(e) {
  return handle_(function () {
    var b;
    try { b = JSON.parse((e && e.postData && e.postData.contents) || ''); } catch (err) { b = null; }
    if (!b || typeof b !== 'object') throw ApiErr_('validation', 'بدنه نامعتبر');
    switch (b.action) {
      case 'postMessage': return postMessage_(b);
      case 'addSalavat': return addSalavat_(b);
      case 'addCause': return addCause_(b);
      case 'startPayment': return startPayment_(b);
      case 'confirmPayment': return confirmPayment_(b);
      default: throw ApiErr_('validation', 'action نامعتبر');
    }
  });
}
