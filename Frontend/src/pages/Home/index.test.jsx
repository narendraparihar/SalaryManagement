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

const exchangeRates = [
  { date: '2026-10-23', base: 'INR', quote: 'AUD', rate: 0.016 },
  { date: '2026-10-23', base: 'INR', quote: 'USD', rate: 0.011 },
  { date: '2026-10-23', base: 'INR', quote: 'JPY', rate: 1.7 },
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
  global.fetch.mockImplementation((url) => {
    const requestUrl = String(url);
    return Promise.resolve(apiResponse(
      requestUrl.includes('/v2/rates')
        ? exchangeRates
        : requestUrl.includes('/api/v1/employees?')
          ? pagedResponse([employee], 0, 2)
          : departmentSalaries,
    ));
  });
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
  global.fetch.mockImplementation((url) => {
    const requestUrl = String(url);
    return Promise.resolve(apiResponse(
      requestUrl.includes('/v2/rates')
        ? exchangeRates
        : requestUrl.includes('/api/v1/employees?')
          ? pagedResponse([employee], 0, 2)
          : departmentSalaries,
    ));
  });

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
  global.fetch.mockImplementation((url) => {
    const requestUrl = String(url);
    return Promise.resolve(apiResponse(
      requestUrl.includes('/v2/rates')
        ? exchangeRates
        : requestUrl.includes('/api/v1/employees?')
          ? pagedResponse(employees, 0, 2, 6, 6)
          : departmentSalaries,
    ));
  });

  render(<MemoryRouter><Home /></MemoryRouter>);

  expect(await screen.findByText('Employee1 Morgan')).toBeInTheDocument();
  expect(screen.getByText('Employee5 Morgan')).toBeInTheDocument();
  expect(screen.queryByText('Employee6 Morgan')).not.toBeInTheDocument();
  expect(global.fetch).toHaveBeenCalledTimes(3);
});

test('displays only supported currency rates and reloads for the selected base', async () => {
  global.fetch.mockImplementation((url) => {
    const requestUrl = String(url);
    if (requestUrl.includes('/v2/rates')) {
      return Promise.resolve(apiResponse(
        requestUrl.includes('base=USD')
          ? [{ date: '2026-10-23', base: 'USD', quote: 'INR', rate: 90 }]
          : exchangeRates,
      ));
    }
    return Promise.resolve(apiResponse(
      requestUrl.includes('/api/v1/employees?') ? pagedResponse([employee], 0, 1) : departmentSalaries,
    ));
  });

  render(<MemoryRouter><Home /></MemoryRouter>);

  const baseCurrency = await screen.findByLabelText('Exchange rate base currency');
  expect(baseCurrency).toHaveValue('INR');
  expect(baseCurrency.querySelectorAll('option')).toHaveLength(7);
  expect(await screen.findByRole('list', { name: 'Exchange rates with INR as base' })).toBeInTheDocument();
  expect(screen.getByText('0.016')).toBeInTheDocument();
  expect(screen.getByText('JPY')).not.toBeInTheDocument();

  fireEvent.change(baseCurrency, { target: { value: 'USD' } });

  expect(await screen.findByRole('list', { name: 'Exchange rates with USD as base' })).toBeInTheDocument();
  expect(global.fetch).toHaveBeenCalledWith(
    'https://api.frankfurter.dev/v2/rates?base=USD',
    { signal: expect.any(AbortSignal) },
  );
});

test('shows API authorization errors and offers a retry', async () => {
  global.fetch.mockResolvedValue(apiResponse({}, 401));

  render(<MemoryRouter><Home /></MemoryRouter>);

  await waitFor(() => expect(window.localStorage.getItem('accessToken')).toBeNull());
});
