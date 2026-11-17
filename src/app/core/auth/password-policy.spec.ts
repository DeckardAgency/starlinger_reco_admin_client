import { passwordPolicyError, PASSWORD_POLICY_MESSAGE } from './password-policy';

describe('passwordPolicyError', () => {
  it('accepts 8+ characters with upper, lower and digit', () => {
    expect(passwordPolicyError('Abcdefg1')).toBe('');
    expect(passwordPolicyError('Str0ng-Passphrase!')).toBe('');
  });

  it('rejects passwords that break a rule', () => {
    for (const bad of ['', 'Abcde1', 'abcdefg1', 'ABCDEFG1', 'Abcdefgh', 'lowercase123!']) {
      expect(passwordPolicyError(bad)).withContext(bad).toBe(PASSWORD_POLICY_MESSAGE);
    }
  });
});
