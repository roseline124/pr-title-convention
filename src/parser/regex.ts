// Copyright © [conventional-changelog team](https://github.com/conventional-changelog)

const reNomatch = /(?!.*)/;

function join(array: any, joiner: any) {
  return array
    .map(function (val: string) {
      return val.trim();
    })
    .filter(function (val: any) {
      return val.length;
    })
    .join(joiner);
}

function getNotesRegex(noteKeywords: any, notesPattern: any) {
  if (!noteKeywords) {
    return reNomatch;
  }

  const noteKeywordsSelection = join(noteKeywords, '|');

  if (!notesPattern) {
    return new RegExp('^[\\s|*]*(' + noteKeywordsSelection + ')[:\\s]+(.*)', 'i');
  }

  return notesPattern(noteKeywordsSelection);
}

function getReferencePartsRegex(issuePrefixes: any, issuePrefixesCaseSensitive: any) {
  if (!issuePrefixes) {
    return reNomatch;
  }

  const flags = issuePrefixesCaseSensitive ? 'g' : 'gi';
  return new RegExp(
    '(?:.*?)??\\s*([\\w-\\.\\/]*?)??(' + join(issuePrefixes, '|') + ')([\\w-]*\\d+)',
    flags
  );
}

function getReferencesRegex(referenceActions: any) {
  if (!referenceActions) {
    // matches everything
    return /()(.+)/gi;
  }

  const joinedKeywords = join(referenceActions, '|');
  return new RegExp('(' + joinedKeywords + ')(?:\\s+(.*?))(?=(?:' + joinedKeywords + ')|$)', 'gi');
}

export function regex(options: any) {
  options = options || {};
  const reNotes = getNotesRegex(options.noteKeywords, options.notesPattern);
  const reReferenceParts = getReferencePartsRegex(
    options.issuePrefixes,
    options.issuePrefixesCaseSensitive
  );
  const reReferences = getReferencesRegex(options.referenceActions);

  return {
    notes: reNotes,
    referenceParts: reReferenceParts,
    references: reReferences,
    mentions: /@([\w-]+)/g,
  };
}
