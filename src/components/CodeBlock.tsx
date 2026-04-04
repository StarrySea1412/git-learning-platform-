'use client';

import CopyCodeButton from './CopyCodeButton';

interface CodeBlockProps {
  code: string;
  language?: string;
  highlightedHtml?: string;
}

export default function CodeBlock({
  code,
  highlightedHtml,
}: CodeBlockProps) {
  return (
    <div className="relative group">
      <div className="absolute right-2 top-2 z-10">
        <CopyCodeButton code={code} />
      </div>
      {highlightedHtml ? (
        <div
          className="rounded-lg overflow-x-auto text-sm [&_pre]:p-4 [&_pre]:m-0"
          dangerouslySetInnerHTML={{ __html: highlightedHtml }}
        />
      ) : (
        <pre className="bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto text-sm">
          <code>{code}</code>
        </pre>
      )}
    </div>
  );
}
