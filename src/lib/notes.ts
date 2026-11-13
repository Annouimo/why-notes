export interface NoteMetadata {
  title: string;
  description: string;
  date: string;
  draft: boolean;
  topic: string;
}
export interface NoteModule {
  frontmatter: NoteMetadata;
  Content: any;
  getHeadings: () => { depth: number; slug: string; text: string }[];
}
const modules = import.meta.glob<NoteModule>('../content/notes/*/index.mdx', { eager: true });
export const isPreview = process.env.WHY_NOTES_PREVIEW === '1';
export const notes = Object.entries(modules).map(([path, module]) => ({
  slug: path.split('/').at(-2)!, ...module,
})).filter(note => isPreview || !note.frontmatter.draft)
  .sort((a, b) => b.frontmatter.date.localeCompare(a.frontmatter.date));
