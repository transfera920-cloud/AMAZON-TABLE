import React from 'react';
import { ExternalLink } from 'lucide-react';

// 比對 http(s):// 或 www. 開頭的網址
const URL_REGEX = /((?:https?:\/\/|www\.)[^\s<>"'，。；、）)]+)/gi;

export const containsUrl = (text: unknown): boolean => {
  if (text === undefined || text === null) return false;
  URL_REGEX.lastIndex = 0;
  return URL_REGEX.test(String(text));
};

/**
 * 把文字中所有網址轉成可點擊的超連結（新分頁開啟），其餘文字原樣保留。
 */
export const Linkify: React.FC<{ text: unknown; className?: string }> = ({ text, className }) => {
  const str = text === undefined || text === null ? '' : String(text);
  const parts = str.split(URL_REGEX);
  if (parts.length === 1) return <>{str}</>;

  return (
    <>
      {parts.map((part, i) => {
        // split 帶 capture group：奇數索引為網址
        if (i % 2 === 1) {
          const href = /^https?:\/\//i.test(part) ? part : `https://${part}`;
          return (
            <a
              key={i}
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              title={`點擊前往：${href}`}
              className={
                className ||
                'inline-flex items-center gap-1 text-sky-400 hover:text-sky-300 underline font-medium break-all transition'
              }
            >
              <span>{part}</span>
              <ExternalLink className="w-3 h-3 shrink-0 opacity-70" />
            </a>
          );
        }
        return <React.Fragment key={i}>{part}</React.Fragment>;
      })}
    </>
  );
};
