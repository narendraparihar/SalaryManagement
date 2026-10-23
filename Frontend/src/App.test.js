import { fireEvent, render, screen, within } from '@testing-library/react';
import App from './App';

beforeEach(() => {
  window.location.hash = '#/';
  window.localStorage.setItem('accessToken', 'test-token');
  global.fetch = jest.fn().mockResolvedValue({
    ok: true,
    json: async () => ({
      content: [],
      totalElements: 0,
      totalPages: 0,
      number: 0,
      size: 5,
      first: true,
      last: true,
    }),
  });
});

test('renders the HRMS overview dashboard', async () => {
  render(<App />);
  expect(screen.getByRole('heading', { name: /good morning, alex/i })).toBeInTheDocument();
  expect(screen.getByRole('link', { name: /add employee/i })).toHaveAttribute('href', '#/employees');
  expect(await screen.findByText('No employees found.')).toBeInTheDocument();
});

test('requires sign in before loading the workspace', () => {
  window.localStorage.clear();
  render(<App />);

  expect(screen.getByRole('heading', { name: /sign in to northstar/i })).toBeInTheDocument();
  expect(global.fetch).not.toHaveBeenCalled();
});

test('navigates to the employee route', async () => {
  render(<App />);
  const navigation = within(screen.getByRole('navigation', { name: /main navigation/i }));
  fireEvent.click(navigation.getByRole('link', { name: /employees/i }));
  expect(await screen.findByRole('heading', { name: /employees/i })).toBeInTheDocument();
});

test('navigates to the dedicated analytics page', async () => {
  render(<App />);
  const navigation = within(screen.getByRole('navigation', { name: /main navigation/i }));
  fireEvent.click(navigation.getByRole('link', { name: /analytics/i }));

  expect(await screen.findByRole('heading', { name: /analytics/i })).toBeInTheDocument();
  expect(await screen.findByRole('heading', { name: /salary by country/i })).toBeInTheDocument();
  expect(global.fetch).toHaveBeenCalledWith(
    'http://localhost:8080/api/v1/overview',
    expect.any(Object),
  );
});
