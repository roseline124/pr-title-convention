import { validatePrTitle } from '../validatePrTitle';

describe('validatePrTitle', () => {
  it('validate pr title with given patterns', async () => {
    // regex pattern -> option
    const regexp = new RegExp('hi');
    validatePrTitle('fix', { regexp });
  });
  it('validate pr title with default options when not given validation patterns', async () => {});
});
