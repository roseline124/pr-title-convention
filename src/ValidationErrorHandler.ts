import core from '@actions/core';
import { GitHub } from '@actions/github/lib/utils';
import is from '@sindresorhus/is';
import { filter, map, pipe, split, trim } from 'ramda';
import { ErrorType, ValidationError } from './errors';
import { getSuggestedWord } from './suggestWord';
import { ErrorHandlerAction } from './types';

export class ValidationErrorHandler {
  constructor(
    private gitClient: InstanceType<typeof GitHub>,
    /** @refer webhookpayload https://docs.github.com/en/developers/webhooks-and-events/webhooks/webhook-events-and-payloads#pull_request */
    private contextPullRequest: Record<string, any>
  ) {}

  async handleValidationError(action: ErrorHandlerAction, errors: ValidationError[]) {
    if (action === 'autofix') {
      return await this.autofix(errors);
    }

    return await this.comment(errors);
  }

  /** @refer restapi https://docs.github.com/en/rest/reference/issues#create-an-issue-comment */
  private async comment(errors: ValidationError[]) {
    core.debug(
      JSON.stringify({
        owner: this.owner,
        repo: this.repo,
        issue_number: this.prNumber,
        body: `💩 [PR Title Error Message] \n${errors.map((error) => error.message).join('\n')}`,
      })
    );

    return await this.gitClient.request(
      'POST /repos/{owner}/{repo}/issues/{issue_number}/comments',
      {
        owner: this.owner,
        repo: this.repo,
        issue_number: this.prNumber,
        body: `💩 [PR Title Error Message] \n${errors.map((error) => error.message).join('\n')}`,
      }
    );
  }

  /** @refer https://docs.github.com/en/rest/reference/pulls#update-a-pull-request */
  private async autofix(errors: ValidationError[]) {
    let prTitle = this.prTitle;

    if (
      errors.some((error) =>
        [
          ErrorType.SUBJECT_ERROR,
          ErrorType.SUBJECT_NOT_FOUND_ERROR,
          ErrorType.UNKNOWN_ERROR,
        ].includes(error.type)
      )
    ) {
      return await this.comment(errors);
    }

    for (const error of errors) {
      const { errorWord, availableWords } = error?.info || {};
      if (!is.nullOrUndefined(errorWord) && !is.nullOrUndefined(availableWords)) {
        const suggestedPrTitle = this.#fixTitleWithSuggestedWord(errorWord, availableWords);
        if (!is.nullOrUndefined(suggestedPrTitle)) {
          prTitle = suggestedPrTitle;
        }
      }
    }

    return await this.gitClient.request('PATCH /repos/{owner}/{repo}/pulls/{pull_number}', {
      owner: this.owner,
      repo: this.repo,
      pull_number: this.prNumber,
      title: prTitle,
    });
  }

  #fixTitleWithSuggestedWord(input: string, list: string[]) {
    const givenInputs = pipe(
      split(','),
      filter((item) => !is.emptyStringOrWhitespace(item)),
      map(trim)
    )(input);

    let prTitle = this.prTitle;
    givenInputs.forEach((item) => {
      const suggestedWords = getSuggestedWord(item, list);
      if (suggestedWords == null) return;

      const suggestedWord = Array.isArray(suggestedWords) ? suggestedWords[0] : suggestedWords;
      prTitle = this.prTitle.replace(input, suggestedWord);
    });
    return prTitle;
  }

  private get owner() {
    return this.contextPullRequest.base.user.login;
  }

  private get repo() {
    return this.contextPullRequest.base.repo.name;
  }

  private get prNumber() {
    return this.contextPullRequest.number;
  }

  private get prTitle() {
    return this.contextPullRequest.title;
  }
}
