import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import Home from './index';

const employee = {
  id: 'employee-1',
  firstName: 'Avery',
  lastName: 'Morgan',
  departmentId: 12,
  countryCode: 'US',
  hireDate: '2024-02-10',
  employmentStatus: 'ACTIVE',
};

const departmentSalaries = [
  {
    departmentId: 8,
    departmentName: 'Customer Support',
    currencyCode: 'AUD',
    totalSalary: 16461997.5,
  },
  {
    departmentId: 8,
    departmentName: 'Customer Support',
    currencyCode: 'CAD',
    totalSalary: 15254550,
  },
];

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

test('loads and displays the five most recent employees', async () => {
  global.fetch.mockImplementation((url) => Promise.resolve(apiResponse(
    String(url).includes('/api/v1/employees?')
      ? pagedResponse([employee], 0, 2)
      : departmentSalaries,
  )));
  window.localStorage.setItem('accessToken', 'test-token');

  render(<MemoryRouter><Home /></MemoryRouter>);

  expect(await screen.findByText('Avery Morgan')).toBeInTheDocument();
  expect(screen.getByText('Department 12')).toBeInTheDocument();
  expect(screen.getByText('6')).toBeInTheDocument();
  expect(screen.queryByRole('button', { name: 'Next page' })).not.toBeInTheDocument();
  expect(screen.queryByRole('button', { name: 'Previous page' })).not.toBeInTheDocument();
  expect(screen.queryByLabelText('Rows per page')).not.toBeInTheDocument();

  const [requestUrl, requestOptions] = global.fetch.mock.calls[0];
  expect(requestUrl).toContain('/api/v1/employees?page=0&size=5&sort=createdAt%2Cdesc');
  expect(requestOptions.headers.Authorization).toBe('Bearer test-token');
});

test('filters salary bars by the selected currency', async () => {
  global.fetch.mockImplementation((url) => Promise.resolve(apiResponse(
    String(url).includes('/api/v1/employees?')
      ? pagedResponse([employee], 0, 2)
      : departmentSalaries,
  )));

  render(<MemoryRouter><Home /></MemoryRouter>);

  expect(await screen.findByText('Customer Support')).toBeInTheDocument();
  expect(screen.getByText('A$16,461,998')).toBeInTheDocument();
  expect(screen.queryByText('CA$15,254,550')).not.toBeInTheDocument();
  expect(screen.getByLabelText('Salary chart currency')).toHaveValue('AUD');

  fireEvent.change(screen.getByLabelText('Salary chart currency'), { target: { value: 'CAD' } });

  expect(screen.getByText('CA$15,254,550')).toBeInTheDocument();
  expect(screen.queryByText('A$16,461,998')).not.toBeInTheDocument();
  expect(screen.getByLabelText('Salary chart currency')).toHaveValue('CAD');
  expect(global.fetch).toHaveBeenCalledWith(
    'http://localhost:8080/api/v1/analytics/salaries/by-department',
    expect.objectContaining({ signal: expect.any(AbortSignal) }),
  );
});

test('does not display employees beyond the first five', async () => {
  const employees = Array.from({ length: 6 }, (_, index) => ({
    ...employee,
    id: `employee-${index + 1}`,
    firstName: `Employee${index + 1}`,
  }));
  global.fetch.mockImplementation((url) => Promise.resolve(apiResponse(
    String(url).includes('/api/v1/employees?')
      ? pagedResponse(employees, 0, 2, 6, 6)
      : departmentSalaries,
  )));

  render(<MemoryRouter><Home /></MemoryRouter>);

  expect(await screen.findByText('Employee1 Morgan')).toBeInTheDocument();
  expect(screen.getByText('Employee5 Morgan')).toBeInTheDocument();
  expect(screen.queryByText('Employee6 Morgan')).not.toBeInTheDocument();
  expect(global.fetch).toHaveBeenCalledTimes(2);
});

test('shows API authorization errors and offers a retry', async () => {
  global.fetch.mockResolvedValue(apiResponse({}, 401));

  render(<MemoryRouter><Home /></MemoryRouter>);

  await waitFor(() => expect(window.localStorage.getItem('accessToken')).toBeNull());
});
