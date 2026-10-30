import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import AnalyticsPage from './index';

let questionApiResponse;
let originalCreateObjectURL;
let originalRevokeObjectURL;

beforeEach(() => {
  window.localStorage.setItem('accessToken', 'test-token');
  originalCreateObjectURL = Object.getOwnPropertyDescriptor(URL, 'createObjectURL');
  originalRevokeObjectURL = Object.getOwnPropertyDescriptor(URL, 'revokeObjectURL');
  Object.defineProperty(URL, 'createObjectURL', { configurable: true, value: jest.fn(() => 'blob:salary-records') });
  Object.defineProperty(URL, 'revokeObjectURL', { configurable: true, value: jest.fn() });
  questionApiResponse = {
    question: 'What is the min annual salary in India?',
    status: 'answered',
    metric: 'minimum_annual_base_salary',
    filters: { country: 'IN', as_of_date: '2026-11-01' },
    currency_code: 'INR',
    value: 187200,
    employee_count: 1400,
    explanation: 'Minimum annual base salary for employees with a salary effective on the specified date.',
  };
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
      'http://localhost:8080/api/v1/questions': questionApiResponse,
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
      blob: async () => new Blob(['id,salary\n1,50000'], { type: 'text/csv' }),
    });
  });
});

afterEach(() => {
  if (originalCreateObjectURL) {
    Object.defineProperty(URL, 'createObjectURL', originalCreateObjectURL);
  } else {
    delete URL.createObjectURL;
  }
  if (originalRevokeObjectURL) {
    Object.defineProperty(URL, 'revokeObjectURL', originalRevokeObjectURL);
  } else {
    delete URL.revokeObjectURL;
  }
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

test('downloads salary CSV with the selected country, department, and currency filters', async () => {
  const clickedLinks = [];
  const clickSpy = jest.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(function click() {
    clickedLinks.push({ href: this.href, download: this.download });
  });

  render(
    <MemoryRouter>
      <AnalyticsPage />
    </MemoryRouter>,
  );

  await screen.findByText('Under 30,000');
  fireEvent.change(screen.getByLabelText('Currency code'), { target: { value: 'USD' } });
  fireEvent.change(screen.getByLabelText('Department'), { target: { value: '12' } });
  fireEvent.change(screen.getByLabelText('Export country'), { target: { value: 'AU' } });
  fireEvent.click(screen.getByRole('button', { name: 'Download salary CSV' }));

  await waitFor(() => expect(global.fetch.mock.calls.map(([url]) => url)).toContain(
    'http://localhost:8080/api/v1/analytics/salaries/export?countryCode=AU&departmentId=12&currencyCode=USD',
  ));
  const exportCall = global.fetch.mock.calls.find(([url]) => String(url).includes('/analytics/salaries/export'));
  expect(exportCall[1].headers.Authorization).toBeTruthy();
  await waitFor(() => expect(clickedLinks).toEqual([
    { href: 'blob:salary-records', download: 'salary-records.csv' },
  ]));
  expect(URL.createObjectURL).toHaveBeenCalledWith(expect.any(Blob));
  expect(URL.revokeObjectURL).toHaveBeenCalledWith('blob:salary-records');

  clickSpy.mockRestore();
});

test('downloads all salary records when no export filters are selected', async () => {
  const clickSpy = jest.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {});

  render(
    <MemoryRouter>
      <AnalyticsPage />
    </MemoryRouter>,
  );

  await screen.findByText('Under 30,000');
  fireEvent.change(screen.getByLabelText('Currency code'), { target: { value: '' } });
  fireEvent.click(screen.getByRole('button', { name: 'Download salary CSV' }));

  await waitFor(() => expect(global.fetch.mock.calls.map(([url]) => url)).toContain(
    'http://localhost:8080/api/v1/analytics/salaries/export',
  ));

  clickSpy.mockRestore();
});

test('filters highest-paid employees by country without changing other analytics requests', async () => {
  render(
    <MemoryRouter>
      <AnalyticsPage />
    </MemoryRouter>,
  );

  await screen.findByText('Ari');
  fireEvent.change(screen.getByLabelText('Highest-paid country'), { target: { value: 'AU' } });

  await waitFor(() => expect(global.fetch).toHaveBeenCalledWith(
    'http://localhost:8080/api/v1/analytics/highest-paid?countryCode=AU',
    expect.any(Object),
  ));
  expect(global.fetch).not.toHaveBeenCalledWith(
    expect.stringContaining('/api/v1/analytics/overview?'),
    expect.any(Object),
  );
  expect(global.fetch).not.toHaveBeenCalledWith(
    expect.stringContaining('/api/v1/analytics/salaries/by-country?'),
    expect.any(Object),
  );
});

test('submits a question and as-of date to the questions API', async () => {
  render(
    <MemoryRouter>
      <AnalyticsPage />
    </MemoryRouter>,
  );

  fireEvent.change(screen.getByLabelText('Question'), {
    target: { value: 'What is the min annual salary in India?' },
  });
  fireEvent.click(screen.getByRole('button', { name: 'Ask question' }));

  expect(await screen.findByText('INR 187,200')).toBeInTheDocument();
  expect(screen.getByText('Answered')).toBeInTheDocument();
  expect(screen.getByText('Minimum Annual Base Salary')).toBeInTheDocument();
  expect(screen.getByText('1,400')).toBeInTheDocument();
  expect(screen.getByText('Minimum annual base salary for employees with a salary effective on the specified date.')).toBeInTheDocument();
  expect(global.fetch).toHaveBeenCalledWith(
    'http://localhost:8080/api/v1/questions',
    expect.objectContaining({
      method: 'POST',
      headers: {
        Authorization: 'Bearer test-token',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        question: 'What is the min annual salary in India?',
        as_of_date: new Date().toISOString().split('T')[0],
      }),
    }),
  );
});

test('shows supported question types when the API marks a question unsupported', async () => {
  questionApiResponse = { status: 'unsupported' };

  render(
    <MemoryRouter>
      <AnalyticsPage />
    </MemoryRouter>,
  );

  fireEvent.click(screen.getByRole('button', { name: 'Ask question' }));

  expect(await screen.findByText('This question type is not supported. Supported question types:')).toBeInTheDocument();
  ['Employee count', 'Average', 'Total', 'Minimum', 'Maximum'].forEach((type) => {
    expect(screen.getByText(type)).toBeInTheDocument();
  });
  expect(screen.queryByText('INR 187,200')).not.toBeInTheDocument();
});
