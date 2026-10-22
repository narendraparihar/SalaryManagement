import { fetchWithAuth } from './api';

beforeEach(() => {
  window.localStorage.setItem('accessToken', 'test-token');
  global.fetch = jest.fn();
});

afterEach(() => {
  jest.clearAllMocks();
});

test.each([401, 403])('clears the session and redirects to login for HTTP %s', async (status) => {
  const response = { status };
  const navigate = jest.fn();
  global.fetch.mockResolvedValue(response);

  await expect(fetchWithAuth('/api/protected', {}, navigate)).resolves.toBe(response);

  expect(window.localStorage.getItem('accessToken')).toBeNull();
  expect(navigate).toHaveBeenCalledWith('/login', { replace: true });
});

test('does not redirect when an authenticated API request succeeds', async () => {
  const response = { status: 200 };
  const navigate = jest.fn();
  global.fetch.mockResolvedValue(response);

  await expect(fetchWithAuth('/api/protected', {}, navigate)).resolves.toBe(response);

  expect(window.localStorage.getItem('accessToken')).toBe('test-token');
  expect(navigate).not.toHaveBeenCalled();
});
