import { ErrorType, ValidationError } from '../errors';
import { ValidationErrorHandler } from '../ValidationErrorHandler';

const mockClient = {
  async request(path: string, options?: Record<string, any>) {
    return options;
  },
};

const defaultPrContext = {
  base: { user: { login: 'tester' }, repo: { name: 'repo' }, number: 1 },
};

describe('ValidationErrorHandler', () => {
  const typeError = new ValidationError('type error', ErrorType.TYPE_ERROR, {
    errorWord: 'feet',
    availableWords: ['feat', 'fix'],
  });
  const scopeError = new ValidationError('scope error', ErrorType.SCOPE_ERROR, {
    errorWord: 'dug',
    availableWords: ['cat', 'dog'],
  });
  const subjectError = new ValidationError('subject error', ErrorType.SUBJECT_ERROR, {
    subject: ' Update the README with new information.',
    subjectPattern: '^(?!\\s?[A-Z]).+$',
  });

  describe("action is 'autofix'", () => {
    test('type이 틀리면 type을 수정한다.', async () => {
      const validationErrorHandler = new ValidationErrorHandler(mockClient as any, {
        ...defaultPrContext,
        title: 'feet: update the README with new information.',
      });
      const result: any = await validationErrorHandler.handleValidationError('autofix', [
        typeError,
      ]);

      expect(result.title).toBe('feat: update the README with new information.');
    });

    test('scope가 틀리면 scope를 수정한다.', async () => {
      const validationErrorHandler = new ValidationErrorHandler(mockClient as any, {
        ...defaultPrContext,
        title: 'feat(dug): update the README with new information.',
      });
      const result: any = await validationErrorHandler.handleValidationError('autofix', [
        scopeError,
      ]);

      expect(result.title).toBe('feat(dog): update the README with new information.');
    });
    test('type, scope 둘 다 틀리면 둘 다 수정한다.', async () => {
      const validationErrorHandler = new ValidationErrorHandler(mockClient as any, {
        ...defaultPrContext,
        title: 'feat(dug): update the README with new information.',
      });

      const result: any = await validationErrorHandler.handleValidationError('autofix', [
        typeError,
        scopeError,
      ]);

      expect(result.title).toBe('feat(dog): update the README with new information.');
    });
    test('subject가 틀리면 comment를 추가한다', async () => {
      const validationErrorHandler = new ValidationErrorHandler(mockClient as any, {
        ...defaultPrContext,
        title: 'feat: Update the README with new information.',
      });

      const result: any = await validationErrorHandler.handleValidationError('autofix', [
        subjectError,
      ]);

      expect(result.body).toContain('[PR Title Error Message]');
    });
  });

  describe('comment', () => {
    test('발생한 모든 에러의 메시지를 담아 comment를 추가한다', async () => {
      const validationErrorHandler = new ValidationErrorHandler(mockClient as any, {
        ...defaultPrContext,
        title: 'feet(dug): Update the README with new information.',
      });

      const result: any = await validationErrorHandler.handleValidationError('comment', [
        typeError,
        scopeError,
        subjectError,
      ]);

      expect(result.body).toMatchSnapshot();
    });
  });
});
