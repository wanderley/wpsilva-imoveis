import Markdown from "react-markdown";

type Props = React.ComponentPropsWithoutRef<typeof Markdown>;

export default function StyledMarkdown({
  components,
  children,
  ...rest
}: Props) {
  return (
    <Markdown
      components={{
        h1: ({ children }) => (
          <h1 className="pt-4 pb-2 text-xl font-semibold">{children}</h1>
        ),
        h2: ({ children }) => (
          <h2 className="pt-4 pb-2 text-lg font-semibold">{children}</h2>
        ),
        h3: ({ children }) => (
          <h3 className="pt-4 pb-2 text-base font-semibold">{children}</h3>
        ),
        ul: ({ children }) => <ul className="list-disc pl-4">{children}</ul>,
        ol: ({ children }) => <ol className="list-decimal pl-4">{children}</ol>,
        li: ({ children }) => <li className="p-1">{children}</li>,
        p: ({ children }) => <p className="p-1">{children}</p>,
        ...components,
      }}
      {...rest}
    >
      {children}
    </Markdown>
  );
}
