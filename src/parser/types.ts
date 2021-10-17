export type ParserOptions = {
  headerPattern: RegExp;
  headerCorrespondence: string | string[];
  referenceActions: string | string[];
  issuePrefixes: string | string[];
  noteKeywords: string | string[];
  fieldPattern: RegExp;
  revertPattern: RegExp;
  revertCorrespondence: string | string[];
  warn?: () => void;
  mergePattern?: RegExp | null;
  mergeCorrespondence?: string[];
  breakingHeaderPattern?: RegExp;
  commentChar?: string;
};
