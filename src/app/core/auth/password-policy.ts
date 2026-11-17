/**
 * Password policy for admin-set passwords. Mirrors the rule the backend enforces
 * on user create/update and in the reset flow: at least 8 characters with an
 * uppercase letter, a lowercase letter and a digit. Keep the two in sync.
 */
export const PASSWORD_MIN_LENGTH = 8;

export const PASSWORD_POLICY_MESSAGE =
  `Password must be at least ${PASSWORD_MIN_LENGTH} characters and contain an uppercase letter, a lowercase letter and a digit`;

/** Returns the policy message when the password breaks the policy, else ''. */
export function passwordPolicyError(password: string): string {
  const ok =
    password.length >= PASSWORD_MIN_LENGTH &&
    /[A-Z]/.test(password) &&
    /[a-z]/.test(password) &&
    /\d/.test(password);
  return ok ? '' : PASSWORD_POLICY_MESSAGE;
}
