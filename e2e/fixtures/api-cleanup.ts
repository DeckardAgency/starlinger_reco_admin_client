const API_BASE = 'http://localhost:8000/api/v1';
const LOGIN_URL = 'http://localhost:8000/api/login_check';

let cachedToken: string | null = null;

async function getToken(): Promise<string> {
  if (cachedToken) return cachedToken;

  const response = await fetch(LOGIN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      username: 'admin@starlinger.com',
      password: 'recouser123!',
    }),
  });

  if (!response.ok) {
    throw new Error(`Login failed: ${response.status} ${response.statusText}`);
  }

  const data = await response.json();
  cachedToken = data.token;
  return cachedToken!;
}

/**
 * Delete all records from an API endpoint where the given field contains "e2e" (case-insensitive).
 * Handles pagination by fetching up to 500 items at once.
 */
export async function cleanupE2ERecords(
  endpoint: string,
  matchField: string = 'name',
): Promise<number> {
  let deleted = 0;

  try {
    const token = await getToken();

    const listResponse = await fetch(`${API_BASE}${endpoint}?itemsPerPage=500`, {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: 'application/ld+json',
      },
    });

    if (!listResponse.ok) return 0;

    const data = await listResponse.json();
    const items = data.member || data['hydra:member'] || [];

    for (const item of items) {
      const fieldValue = item[matchField] || '';
      if (typeof fieldValue === 'string' && fieldValue.toLowerCase().includes('e2e')) {
        const deleteResponse = await fetch(`${API_BASE}${endpoint}/${item.id}`, {
          method: 'DELETE',
          headers: {
            Authorization: `Bearer ${token}`,
            Accept: 'application/ld+json',
          },
        });

        if (deleteResponse.ok || deleteResponse.status === 204) {
          deleted++;
        }
      }
    }
  } catch {
    // Cleanup is best-effort — don't fail tests
  }

  return deleted;
}

/**
 * Clean up all E2E records from the given endpoints.
 * Use in test.afterAll() to ensure test data is removed even if delete tests fail.
 */
export async function cleanupEndpoints(
  endpoints: Array<{ path: string; field?: string }>,
): Promise<void> {
  for (const { path, field } of endpoints) {
    await cleanupE2ERecords(path, field || 'name');
  }
}
