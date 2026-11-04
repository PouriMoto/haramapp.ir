import Markdown from 'react-markdown'
import { stripLeadingTitle } from '../../lib/markdown'

/**
 * رندر امن متن دعا: HTML خام نادیده گرفته می‌شود (skipHtml)، تصویر و لینک حذف می‌شوند
 * (متن لینک می‌ماند)، و react-markdown خودش URLهای خطرناک را پاک می‌کند.
 * بلوک نقل‌قول (>) = متن عربی؛ پاراگراف‌ها = ترجمه/توضیح.
 */
export function MarkdownView({ text }: { text: string }) {
  return (
    <Markdown
      skipHtml
      disallowedElements={['img', 'a', 'iframe', 'script', 'style']}
      unwrapDisallowed
      components={{
        blockquote: ({ children }) => <blockquote lang="ar" dir="rtl">{children}</blockquote>,
      }}
    >
      {stripLeadingTitle(text)}
    </Markdown>
  )
}
