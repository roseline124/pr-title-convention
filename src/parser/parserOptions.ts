import { ParserOptions } from './types';

export function getPaserOptions(config?: ParserOptions): ParserOptions {
  const defaultConfig = getDefaultConfig(config);
  return {
    headerPattern: /^(\w*)(?:\((.*)\))?!?:(.*)$/,
    breakingHeaderPattern: /^(\w*)(?:\((.*)\))?!: (.*)$/,
    headerCorrespondence: ['type', 'scope', 'subject'],
    noteKeywords: ['BREAKING CHANGE'],
    revertPattern: /^(?:Revert|revert:)\s"?([\s\S]+?)"?\s*This reverts commit (\w*)\./i,
    revertCorrespondence: ['header', 'hash'],
    issuePrefixes: defaultConfig.issuePrefixes,
  };
}

function getDefaultConfig(config?: ParserOptions) {
  const defaultConfig = config ?? { issuePrefixes: ['#'] };
  defaultConfig.issuePrefixes = defaultConfig.issuePrefixes || ['#'];
  return defaultConfig;
}
