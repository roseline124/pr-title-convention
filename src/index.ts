import core from '@actions/core';
import github from '@actions/github';
import { ErrorType, ValidationError } from './errors';
import { ValidationErrorHandler } from './ValidationErrorHandler';
import { parseConfig } from './parseConfig';
import { validatePrTitle } from './validatePrTitle';

export async function run() {
  try {
    const githubToken = process.env.GITHUB_TOKEN;
    if (!githubToken) {
      throw new Error('Github Token cannot found');
    }

    const client = github.getOctokit(githubToken);
    const {
      types,
      scopes,
      wip,
      subjectPattern,
      subjectPatternError,
      validateSingleCommit,
      action,
      includeBranchNameToSubject,
    } = parseConfig();

    const contextPullRequest = github.context.payload.pull_request;
    if (!contextPullRequest) {
      throw new Error(
        "This action can only be invoked in `pull_request_target` or `pull_request` events. Otherwise the pull request can't be inferred."
      );
    }

    const owner = contextPullRequest.base.user.login;
    const repo = contextPullRequest.base.repo.name;

    // The pull request info on the context isn't up to date. When
    // the user updates the title and re-runs the workflow, it would
    // be outdated. Therefore fetch the pull request via the REST API
    // to ensure we use the current title.
    const { data: pullRequest } = await client.pulls.get({
      owner,
      repo,
      pull_number: contextPullRequest.number,
    });

    // Pull requests that start with "[WIP] " are excluded from the check.
    const isWip = wip && /^\[WIP\]\s/.test(pullRequest.title);

    let validationErrors: ValidationError[] = [];
    if (!isWip) {
      try {
        const errors = await validatePrTitle(pullRequest.title, {
          types,
          scopes,
          subjectPattern,
          subjectPatternError,
          action,
        });
        validationErrors = errors;

        if (validateSingleCommit) {
          const { data: commits } = await client.pulls.listCommits({
            owner,
            repo,
            pull_number: contextPullRequest.number,
            per_page: 2,
          });

          if (commits.length === 1) {
            try {
              await validatePrTitle(commits[0].commit.message, {
                types,
                scopes,
                subjectPattern,
                subjectPatternError,
                action,
              });
            } catch (error: any) {
              throw new ValidationError(
                `Pull request has only one commit and it's not semantic; this may lead to a non-semantic commit in the base branch (see https://github.community/t/how-to-change-the-default-squash-merge-commit-message/1155). Amend the commit message to match the pull request title, or add another commit.`,
                ErrorType.SINGLE_COMMIT_ERROR,
                error.info
              );
            }
          }
        }
      } catch (error: any) {
        validationErrors.push(error);
      }
    }

    if (wip) {
      const newStatus = isWip || validationErrors.length > 0 ? 'pending' : 'success';

      // When setting the status to "pending", the checks don't
      // complete. This can be used for WIP PRs in repositories
      // which don't support draft pull requests.
      // https://developer.github.com/v3/repos/statuses/#create-a-status
      await client.request('POST /repos/:owner/:repo/statuses/:sha', {
        owner,
        repo,
        sha: pullRequest.head.sha,
        state: newStatus,
        target_url: 'https://github.com/roseline124/pr-title-convention',
        description: isWip
          ? 'This PR is marked with "[WIP]".'
          : validationErrors.length > 0
          ? 'PR title validation failed'
          : 'Ready for review & merge.',
        context: 'pr-title-convention',
      });
    }

    if (!isWip && validationErrors.length > 0) {
      const validationErrorHandler = new ValidationErrorHandler(client, contextPullRequest);
      await validationErrorHandler.handleValidationError(action, validationErrors);
    }
  } catch (error: any) {
    core.setFailed(error.message);
  }
}
