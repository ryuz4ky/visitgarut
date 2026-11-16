/** English section: mark the document as English before it renders (the shared root layout ships lang="id"). */
export default function EnglishLayout({ children }: { children: React.ReactNode }) {
  return <><script dangerouslySetInnerHTML={{ __html: "document.documentElement.lang='en'" }}/><div lang="en" style={{ display: 'contents' }}>{children}</div></>
}
