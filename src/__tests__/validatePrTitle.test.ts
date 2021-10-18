import { validatePrTitle } from '../validatePrTitle';

describe('validatePrTitle', () => {
  it('allows valid PR titles that use the default types', async () => {
    const inputs = [
      'fix:Fix bug',
      'fix: Fix bug',
      'fix!: Fix bug',
      'feat: Add feature',
      'feat!: Add feature',
      'refactor: Internal cleanup',
    ];

    let validationErrors = [];
    for (let index = 0; index < inputs.length; index++) {
      const errors = await validatePrTitle(inputs[index]);
      validationErrors.push(...errors);
    }

    expect(validationErrors.length).toBe(0);
  });

  it('returns for PR titles without a type', async () => {
    const errors = await validatePrTitle('Fix bug');
    expect(errors[0].message).toContain(
      'Unknown release type "null" found in pull request title "Fix bug".'
    );
  });

  it('returns for PR titles with only a type', async () => {
    const errors = await validatePrTitle('fix:');
    expect(errors[0].message).toBe('No subject found in pull request title "fix:".');
  });

  it('returns for PR titles without a subject', async () => {
    const errors = await validatePrTitle('fix: ');
    expect(errors[0].message).toBe('No subject found in pull request title "fix: ".');
  });

  it('throws for PR titles with an unknown type', async () => {
    const errors = await validatePrTitle('foo: Bar');
    expect(errors[0].message).toContain(
      'Unknown release type "foo" found in pull request title "foo: Bar".'
    );
  });

  describe('suggest similar words', () => {
    it('suggest similar type', async () => {
      const errors = await validatePrTitle('fox: foobar', { types: ['fix'] });
      expect(errors[0].message).toBe(
        'Unknown release type "fox" found in pull request title "fox: foobar". Did you mean "fix"? \n\nAvailable types:\n - fix'
      );
    });
    it('suggest similar scope', async () => {
      const errors = await validatePrTitle('fix(frruit): foobar', { scopes: ['fruit', 'animal'] });
      expect(errors[0].message).toBe(
        'Unknown scope "frruit" found in pull request title "fix(frruit): foobar". Did you mean "fruit"? Use one of the available scopes: fruit, animal.'
      );
    });
  });

  describe('custom types', () => {
    it('allows PR titles with a supported type', async () => {
      const inputs = ['foo: Foobar', 'bar: Foobar', 'baz: Foobar'];
      const types = ['foo', 'bar', 'baz'];

      let validationErrors = [];
      for (let index = 0; index < inputs.length; index++) {
        const errors = await validatePrTitle(inputs[index], { types });
        validationErrors.push(...errors);
      }

      expect(validationErrors.length).toBe(0);
    });

    it('throws for PR titles with an unknown type', async () => {
      const errors = await validatePrTitle('fix: Foobar', { types: ['foo', 'bar'] });
      expect(errors[0].message).toContain(
        'Unknown release type "fix" found in pull request title "fix: Foobar".'
      );
    });
  });

  describe('defined scopes', () => {
    it('allows a missing scope by default', async () => {
      const errors = await validatePrTitle('fix: Bar');
      expect(errors.length).toBe(0);
    });

    it('allows all scopes by default', async () => {
      const errors = await validatePrTitle('fix(core): Bar');
      expect(errors.length).toBe(0);
    });

    it('allows a missing scope when custom scopes are defined', async () => {
      const errors = await validatePrTitle('fix: Bar', { scopes: ['foo'] });
      expect(errors.length).toBe(0);
    });

    it('allows a matching scope', async () => {
      const errors = await validatePrTitle('fix(core): Bar', { scopes: ['core'] });
      expect(errors.length).toBe(0);
    });

    it('allows multiple matching scopes', async () => {
      const errors = await validatePrTitle('fix(core,e2e): Bar', {
        scopes: ['core', 'e2e', 'web'],
      });
      expect(errors.length).toBe(0);
    });

    it('throws when an unknown scope is detected within multiple scopes', async () => {
      const errors = await validatePrTitle('fix(core,e2e,foo,bar): Bar', {
        scopes: ['foo', 'core'],
      });
      expect(errors[0].message).toBe(
        'Unknown scopes "e2e,bar" found in pull request title "fix(core,e2e,foo,bar): Bar". Use one of the available scopes: foo, core.'
      );
    });

    it('throws when an unknown scope is detected', async () => {
      const errors = await validatePrTitle('fix(core): Bar', { scopes: ['foo'] });
      expect(errors[0].message).toBe(
        'Unknown scope "core" found in pull request title "fix(core): Bar". Use one of the available scopes: foo.'
      );
    });
  });

  describe('description validation', () => {
    it('does not validate the description by default', async () => {
      await validatePrTitle('fix: sK!"§4123');
    });

    it('can pass the validation when `subjectPatternError` is configured', async () => {
      await validatePrTitle('fix: foobar', {
        subjectPattern: '^(?![A-Z]).+$',
        subjectPatternError:
          'The subject found in the pull request title cannot start with an uppercase character.',
      });
    });

    it('uses the `subjectPatternError` if available when the `subjectPattern` does not match', async () => {
      const customError =
        'The subject found in the pull request title cannot start with an uppercase character.';
      const errors = await validatePrTitle('fix: Foobar', {
        subjectPattern: '^(?!\\s?[A-Z]).+$',
        subjectPatternError: customError,
      });
      expect(errors[0].message).toContain(customError);
    });

    it('interpolates variables into `subjectPatternError`', async () => {
      const errors = await validatePrTitle('fix: Foobar', {
        subjectPattern: '^(?!\\s?[A-Z]).+$',
        subjectPatternError:
          'The subject "{subject}" found in the pull request title "{title}" cannot start with an uppercase character.',
      });
      expect(errors[0].message).toContain(
        'The subject " Foobar" found in the pull request title "fix: Foobar" cannot start with an uppercase character.'
      );
    });

    it('throws for invalid subjects', async () => {
      const errors = await validatePrTitle('fix: Foobar', {
        subjectPattern: '^(?!\\s?[A-Z]).+$',
      });
      expect(errors[0].message).toContain(
        'The subject " Foobar" found in pull request title "fix: Foobar" doesn\'t match the configured pattern "^(?!\\s?[A-Z]).+$'
      );
    });

    it('throws for only partial matches', async () => {
      const errors = await validatePrTitle('fix: Foobar', { subjectPattern: 'Foo' });
      expect(errors[0].message).toContain(
        'The subject " Foobar" found in pull request title "fix: Foobar" isn\'t an exact match for the configured pattern "Foo". Please provide a subject that matches the whole pattern exactly.'
      );
    });

    it('accepts valid subjects', async () => {
      const errors = await validatePrTitle('fix: foobar', {
        subjectPattern: '^(?![A-Z]).+$',
      });

      expect(errors.length).toBe(0);
    });
  });
});
