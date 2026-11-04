# سرویس پرداخت haramapp
بدون وابستگی (فقط Node ۲۰+). راهنمای مبتدی (فارسی، فقط محلی): `docs/PAYMENT_GUIDE.md` در کپی محلی پروژه.
اجرا: `cp .env.example .env` (روی سرور، پر کنید) سپس `node --env-file=.env index.mjs`
یا Docker: `docker build -t haram-pay . && docker run -d --restart=always --env-file .env -p 8787:8787 haram-pay`
تست: از ریشهٔ پروژه `npm test` (فایل `tests/payment-service.test.ts`).
