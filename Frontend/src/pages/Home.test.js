import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import Home from './Home';

const employee = {
  id: 'employee-1',
  firstName: 'Avery',
  lastName: 'Morgan',
  departmentId: 12,
  countryCode: 'US',
  hireDate: '2024-02-10',
  employmentStatus: 'ACTIVE',
};

function pagedResponse(content, number, totalPages, totalElements = 6, size = 5) {
  return {
    content,
    number,
    size,
    totalPages,
    totalElements,
    first: number === 0,
    last: number === totalPages - 1,
  };
}

function apiResponse(body, status = 200) {
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

test('loads employees and total count from the paginated API', async () => {
  global.fetch.mockResolvedValue(apiResponse(pagedResponse([employee], 0, 2)));
  window.localStorage.setItem('accessToken', 'test-token');

  render(<MemoryRouter><Home /></MemoryRouter>);

  expect(await screen.findByText('Avery Morgan')).toBeInTheDocument();
  expect(screen.getByText('Department 12')).toBeInTheDocument();
  expect(screen.getByText('6')).toBeInTheDocument();
  expect(screen.getByText('Showing 1-5 of 6')).toBeInTheDocument();

  const [requestUrl, requestOptions] = global.fetch.mock.calls[0];
  expect(requestUrl).toContain('/api/v1/employees?page=0&size=5&sort=createdAt%2Cdesc');
  expect(requestOptions.headers.Authorization).toBe('Bearer test-token');
});

test('requests the next page when the user selects Next', async () => {
  global.fetch
    .mockResolvedValueOnce(apiResponse(pagedResponse([employee], 0, 2)))
    .mockResolvedValueOnce(apiResponse(pagedResponse([{ ...employee, id: 'employee-2', firstName: 'Taylor' }], 1, 2)));

  render(<MemoryRouter><Home /></MemoryRouter>);
  expect(await screen.findByText('Avery Morgan')).toBeInTheDocument();

  fireEvent.click(screen.getByRole('button', { name: 'Next page' }));

  expect(await screen.findByText('Taylor Morgan')).toBeInTheDocument();
  await waitFor(() => expect(global.fetch).toHaveBeenCalledTimes(2));
  expect(global.fetch.mock.calls[1][0]).toContain('page=1');
  expect(screen.getByText('Page 2 of 2')).toBeInTheDocument();
});

test('shows API authorization errors and offers a retry', async () => {
  global.fetch.mockResolvedValue(apiResponse({}, 401));

  render(<MemoryRouter><Home /></MemoryRouter>);

  await waitFor(() => expect(window.localStorage.getItem('accessToken')).toBeNull());
});
