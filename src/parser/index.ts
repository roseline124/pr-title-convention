// Copyright © [conventional-changelog team](https://github.com/conventional-changelog)

import _ from 'lodash';
import { parser } from './parser';
import { regex } from './regex';
import { ParserOptions } from './types';

export function sync(commit: string, options: ParserOptions) {
  options = assignOpts(options);
  const reg = regex(options);

  return parser(commit, options, reg);
}

/**
 * default options
 */
function assignOpts(options: ParserOptions) {
  options = _.extend(
    {
      headerPattern: /^(\w*)(?:\(([\w$.\-*/ ]*)\))?:\s?(.*)$/,
      headerCorrespondence: ['type', 'scope', 'subject'],
      referenceActions: [
        'close',
        'closes',
        'closed',
        'fix',
        'fixes',
        'fixed',
        'resolve',
        'resolves',
        'resolved',
      ],
      issuePrefixes: ['#'],
      noteKeywords: ['BREAKING CHANGE'],
      fieldPattern: /^-(.*?)-$/,
      revertPattern: /^Revert\s"([\s\S]*)"\s*This reverts commit (\w*)\./,
      revertCorrespondence: ['header', 'hash'],
      warn: function () {},
      mergePattern: null,
      mergeCorrespondence: null,
    },
    options
  );

  if (typeof options.headerPattern === 'string') {
    options.headerPattern = new RegExp(options.headerPattern);
  }

  if (typeof options.headerCorrespondence === 'string') {
    options.headerCorrespondence = options.headerCorrespondence.split(',');
  }

  if (typeof options.referenceActions === 'string') {
    options.referenceActions = options.referenceActions.split(',');
  }

  if (typeof options.issuePrefixes === 'string') {
    options.issuePrefixes = options.issuePrefixes.split(',');
  }

  if (typeof options.noteKeywords === 'string') {
    options.noteKeywords = options.noteKeywords.split(',');
  }

  if (typeof options.fieldPattern === 'string') {
    options.fieldPattern = new RegExp(options.fieldPattern);
  }

  if (typeof options.revertPattern === 'string') {
    options.revertPattern = new RegExp(options.revertPattern);
  }

  if (typeof options.revertCorrespondence === 'string') {
    options.revertCorrespondence = options.revertCorrespondence.split(',');
  }

  if (typeof options.mergePattern === 'string') {
    options.mergePattern = new RegExp(options.mergePattern);
  }

  if (typeof options.mergePattern === 'undefined') {
    options.mergePattern = null;
  }

  return options;
}
