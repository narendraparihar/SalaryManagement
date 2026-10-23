import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import AnalyticsPage from './index';

beforeEach(() => {
  window.localStorage.setItem('accessToken', 'test-token');
  global.fetch = jest.fn((url) => {
    const payloads = {
      'http://localhost:8080/api/v1/analytics/overview': { totalEmployees: 8, totalPayroll: 55000 },
      'http://localhost:8080/api/v1/analytics/salaries/by-country': [
        { countryCode: 'US', countryName: 'United States', currencyCode: 'USD', totalSalary: 120000 },
        { countryCode: 'AU', countryName: 'Australia', currencyCode: 'AUD', totalSalary: 98000 },
      ],
      'http://localhost:8080/api/v1/analytics/salaries/by-department': [
        { departmentId: 12, departmentName: 'Engineering', currencyCode: 'AUD' },
      ],
      'http://localhost:8080/api/v1/analytics/highest-paid': [{ firstName: 'Ari', lastName: 'Shah', annualSalary: 100000 }],
    };
    const responseUrl = String(url).split('?')[0];
    const isDistributionRequest = responseUrl.endsWith('/analytics/salaries/distribution');
    const payload = isDistributionRequest
      ? [
        { employeeCount: 119, rangeOrder: 1, salaryRange: 'Under 30,000' },
        { employeeCount: 115, rangeOrder: 2, salaryRange: '30,000 - 59,999' },
      ]
      : payloads[responseUrl];

    return Promise.resolve({
      ok: true,
      status: 200,
      json: async () => payload,
    });
  });
});

afterEach(() => {
  jest.clearAllMocks();
});

test('loads analytics and uses available currency options for salary distribution', async () => {
  render(
    <MemoryRouter>
      <AnalyticsPage />
    </MemoryRouter>,
  );

  expect(await screen.findByText('Total Employees')).toBeInTheDocument();
  expect(screen.getByText('55,000')).toBeInTheDocument();
  expect(screen.getByText('US')).toBeInTheDocument();
  expect(await screen.findByText('Under 30,000')).toBeInTheDocument();
  expect(screen.getByText('Ari')).toBeInTheDocument();
  expect(screen.getByRole('option', { name: 'AUD' })).toBeInTheDocument();
  expect(screen.getByRole('option', { name: 'Engineering' })).toBeInTheDocument();

  await waitFor(() => expect(global.fetch).toHaveBeenCalledWith(
    'http://localhost:8080/api/v1/analytics/salaries/distribution?currencyCode=AUD',
    expect.any(Object),
  ));
});

test('fetches salary distribution when filters change without a country filter', async () => {
  render(
    <MemoryRouter>
      <AnalyticsPage />
    </MemoryRouter>,
  );

  await screen.findByText('Under 30,000');
  fireEvent.change(screen.getByLabelText('Currency code'), { target: { value: 'USD' } });
  fireEvent.change(screen.getByLabelText('Department'), { target: { value: '12' } });
  fireEvent.change(screen.getByLabelText('As of'), { target: { value: '2026-10-01' } });

  expect(screen.queryByLabelText('Country')).not.toBeInTheDocument();
  await waitFor(() => expect(global.fetch).toHaveBeenCalledWith(
    'http://localhost:8080/api/v1/analytics/salaries/distribution?currencyCode=USD&departmentId=12&asOf=2026-10-01',
    expect.any(Object),
  ));
});
