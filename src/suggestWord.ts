import is from '@sindresorhus/is';
import didYouMean from 'didyoumean';

export function suggestWord(input: string | string[], list?: string[]) {
  if (list == null || list.length === 0) return '';

  let suggestedType;
  if (Array.isArray(input)) {
    suggestedType = input
      .map((item) => getSuggestedWord(item, list))
      .filter((item) => !is.nullOrUndefined(item))
      .join(', ');
  } else {
    suggestedType = getSuggestedWord(input, list);
  }

  return is.nonEmptyString(suggestedType) ? `Did you mean "${suggestedType}"? ` : '';
}

export function getSuggestedWord(input: string, list: string[]) {
  const suggestedWord = didYouMean(input, list);
  if (
    is.nullOrUndefined(suggestedWord) ||
    is.emptyString(suggestedWord) ||
    is.emptyArray(suggestWord)
  ) {
    return;
  }

  return Array.isArray(suggestedWord) ? suggestedWord.join(', ') : suggestedWord;
}
