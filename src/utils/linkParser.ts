
export interface ParsedLink {
  text: string;
  target: string;
  start: number;
  end: number;
}

export const parseLinks = (content: string): ParsedLink[] => {
  const linkRegex = /\[\[([^\]]+)\]\]/g;
  const links: ParsedLink[] = [];
  let match;

  while ((match = linkRegex.exec(content)) !== null) {
    links.push({
      text: match[0],
      target: match[1],
      start: match.index,
      end: match.index + match[0].length
    });
  }

  return links;
};

export const replaceLinksWithComponents = (content: string): string => {
  return content.replace(/\[\[([^\]]+)\]\]/g, '🔗$1');
};

export const findBacklinks = (files: any[], targetFileName: string): any[] => {
  return files.filter(file => {
    if (!file.content || file.name === targetFileName) return false;
    const links = parseLinks(file.content);
    return links.some(link => link.target === targetFileName);
  });
};
