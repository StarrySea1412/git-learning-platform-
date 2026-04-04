import { codeToHtml } from 'shiki';

export async function renderHighlightedCode(
  code: string,
  language = 'bash'
): Promise<string> {
  return codeToHtml(code, {
    lang: language,
    theme: 'github-dark',
  });
}
