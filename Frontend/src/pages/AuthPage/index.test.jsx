import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, useLocation } from 'react-router-dom';
import AuthPage from './index';

function CurrentPath() {
  const location = useLocation();
  return <span data-testid="current-path">{location.pathname}</span>;
}

function authResponse(body, status = 200) {
  return {
    ok: status >= 200 && status < 300,
    status,
    json: async () => body,
  };
}

beforeEach(() => {
  window.localStorage.clear();
  global.fetch = jest.fn();
});

afterEach(() => {
  jest.clearAllMocks();
});

test('submits login credentials, stores the access token, and opens the overview', async () => {
  global.fetch.mockResolvedValue(authResponse({ accessToken: 'session-token' }));
  render(
    <MemoryRouter initialEntries={['/login']}>
      <AuthPage mode="login" />
      <CurrentPath />
    </MemoryRouter>,
  );

  fireEvent.change(screen.getByLabelText(/email address/i), { target: { value: 'person@example.com' } });
  fireEvent.change(screen.getByLabelText(/password/i), { target: { value: 'correct-horse' } });
  fireEvent.click(screen.getByRole('button', { name: 'Sign in' }));

  await waitFor(() => expect(window.localStorage.getItem('accessToken')).toBe('session-token'));
  expect(window.localStorage.getItem('userEmail')).toBe('person@example.com');
  expect(screen.getByTestId('current-path')).toHaveTextContent('/dashboard');
  expect(global.fetch).toHaveBeenCalledWith(
    'http://localhost:8080/api/auth/login',
    expect.objectContaining({
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'person@example.com', password: 'correct-horse' }),
    }),
  );
});

test('submits signup credentials and prompts the user to sign in', async () => {
  global.fetch.mockResolvedValue(authResponse({ id: 'user-1', email: 'person@example.com' }, 201));
  render(
    <MemoryRouter initialEntries={['/signup']}>
      <AuthPage mode="signup" />
    </MemoryRouter>,
  );

  fireEvent.change(screen.getByLabelText(/email address/i), { target: { value: 'person@example.com' } });
  fireEvent.change(screen.getByLabelText(/password/i), { target: { value: 'correct-horse' } });
  fireEvent.click(screen.getByRole('button', { name: 'Create account' }));

  expect(await screen.findByRole('status')).toHaveTextContent(/sign in to continue/i);
  expect(global.fetch).toHaveBeenCalledWith(
    'http://localhost:8080/api/auth/signup',
    expect.objectContaining({
      method: 'POST',
      body: JSON.stringify({ email: 'person@example.com', password: 'correct-horse' }),
    }),
  );
  expect(window.localStorage.getItem('accessToken')).toBeNull();
});

test('displays authentication errors returned by the API', async () => {
  global.fetch.mockResolvedValue(authResponse({ error: 'Invalid email or password' }, 401));
  render(
    <MemoryRouter initialEntries={['/login']}>
      <AuthPage mode="login" />
    </MemoryRouter>,
  );

  fireEvent.change(screen.getByLabelText(/email address/i), { target: { value: 'person@example.com' } });
  fireEvent.change(screen.getByLabelText(/password/i), { target: { value: 'incorrect-password' } });
  fireEvent.click(screen.getByRole('button', { name: 'Sign in' }));

  expect(await screen.findByRole('alert')).toHaveTextContent('Invalid email or password');
  expect(window.localStorage.getItem('accessToken')).toBeNull();
});
