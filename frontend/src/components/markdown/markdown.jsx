import { MarkdownRoot } from './styles';

// ----------------------------------------------------------------------

export function Markdown({ content, firstLetter = false, ...other }) {
  return (
    <MarkdownRoot
      firstLetter={firstLetter}
      dangerouslySetInnerHTML={{ __html: content }}
      {...other}
    />
  );
}
