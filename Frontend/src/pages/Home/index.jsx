import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { fetchWithAuth } from '../../api';
import './style.scss';

const API_BASE_URL = (process.env.REACT_APP_API_BASE_URL || 'http://localhost:8080').replace(/\/$/, '');
const RECENT_EMPLOYEE_LIMIT = 5;
const DEPARTMENT_SALARIES_ENDPOINT = '/api/v1/analytics/salaries/by-department';
const EXCHANGE_RATES_ENDPOINT = 'https://api.frankfurter.dev/v2/rates';
const SUPPORTED_CURRENCIES = ['AUD', 'CAD', 'EUR', 'GBP', 'INR', 'SGD', 'USD'];

function formatDate(date) {
  if (!date) return '—';

  const parsedDate = new Date(`${date}T00:00:00Z`);
  if (Number.isNaN(parsedDate.getTime())) return '—';

  return new Intl.DateTimeFormat('en', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    timeZone: 'UTC',
  }).format(parsedDate);
}

function getInitials(employee) {
  return `${employee.firstName?.[0] || ''}${employee.lastName?.[0] || ''}`.toUpperCase() || '?';
}

function formatCurrency(amount, currencyCode) {
  return new Intl.NumberFormat('en', {
    style: 'currency',
    currency: currencyCode,
    maximumFractionDigits: 0,
  }).format(amount);
}

function formatExchangeRate(rate) {
  return new Intl.NumberFormat('en', {
    maximumFractionDigits: 6,
  }).format(rate);
}

function Home() {
  const navigate = useNavigate();
  const [employeesPage, setEmployeesPage] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [reload, setReload] = useState(0);
  const [departmentSalaries, setDepartmentSalaries] = useState([]);
  const [isDepartmentSalariesLoading, setIsDepartmentSalariesLoading] = useState(true);
  const [departmentSalariesError, setDepartmentSalariesError] = useState('');
  const [departmentSalariesReload, setDepartmentSalariesReload] = useState(0);
  const [selectedSalaryCurrency, setSelectedSalaryCurrency] = useState('');
  const [exchangeRateBase, setExchangeRateBase] = useState('INR');
  const [exchangeRates, setExchangeRates] = useState([]);
  const [isExchangeRatesLoading, setIsExchangeRatesLoading] = useState(true);
  const [exchangeRatesError, setExchangeRatesError] = useState('');
  const [exchangeRatesReload, setExchangeRatesReload] = useState(0);

  useEffect(() => {
    const controller = new AbortController();

    async function loadEmployees() {
      setIsLoading(true);
      setError('');

      try {
        const query = new URLSearchParams({
          page: '0',
          size: String(RECENT_EMPLOYEE_LIMIT),
          sort: 'created_at,desc',
        });
        const token = window.localStorage.getItem('accessToken');
        const response = await fetchWithAuth(`${API_BASE_URL}/api/v1/employees?${query}`, {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
          signal: controller.signal,
        }, navigate);

        if (response.status === 401 || response.status === 403) return;

        if (!response.ok) {
          throw new Error(`Unable to load employees (HTTP ${response.status}).`);
        }

        const result = await response.json();
        if (
          !Array.isArray(result.content)
          || !Number.isInteger(result.totalElements)
          || !Number.isInteger(result.totalPages)
          || !Number.isInteger(result.number)
          || !Number.isInteger(result.size)
        ) {
          throw new Error('The employee API returned an invalid paginated response.');
        }

        setEmployeesPage(result);
      } catch (requestError) {
        if (requestError.name !== 'AbortError') {
          setError(requestError.message || 'Unable to connect to the employee API.');
        }
      } finally {
        if (!controller.signal.aborted) setIsLoading(false);
      }
    }

    loadEmployees();
    return () => controller.abort();
  }, [reload, navigate]);

  useEffect(() => {
    const controller = new AbortController();

    async function loadDepartmentSalaries() {
      setIsDepartmentSalariesLoading(true);
      setDepartmentSalariesError('');

      try {
        const token = window.localStorage.getItem('accessToken');
        const response = await fetchWithAuth(`${API_BASE_URL}${DEPARTMENT_SALARIES_ENDPOINT}`, {
          headers: token ? { Authorization: 'Bearer ' + token } : {},
          signal: controller.signal,
        }, navigate);

        if (response.status === 401 || response.status === 403) return;
        if (!response.ok) {
          throw new Error(`Unable to load salary by department (HTTP ${response.status}).`);
        }

        const result = await response.json();
        if (!Array.isArray(result) || result.some((record) => (
          !record
          || typeof record.departmentName !== 'string'
          || !record.departmentName
          || typeof record.currencyCode !== 'string'
          || !/^[A-Z]{3}$/.test(record.currencyCode)
          || typeof record.totalSalary !== 'number'
          || !Number.isFinite(record.totalSalary)
        ))) {
          throw new Error('The salary-by-department API returned invalid data.');
        }

        setDepartmentSalaries(result);
      } catch (requestError) {
        if (requestError.name !== 'AbortError') {
          setDepartmentSalariesError(
            requestError.message || 'Unable to connect to salary by department API.',
          );
        }
      } finally {
        if (!controller.signal.aborted) setIsDepartmentSalariesLoading(false);
      }
    }

    loadDepartmentSalaries();
    return () => controller.abort();
  }, [departmentSalariesReload, navigate]);

  useEffect(() => {
    const controller = new AbortController();

    async function loadExchangeRates() {
      setIsExchangeRatesLoading(true);
      setExchangeRatesError('');

      try {
        const query = new URLSearchParams({ base: exchangeRateBase });
        const response = await fetch(`${EXCHANGE_RATES_ENDPOINT}?${query}`, {
          signal: controller.signal,
        });

        if (!response.ok) {
          throw new Error(`Unable to load exchange rates (HTTP ${response.status}).`);
        }

        const result = await response.json();
        if (!Array.isArray(result) || result.length === 0 || result.some((record) => (
          !record
          || typeof record.quote !== 'string'
          || !/^[A-Z]{3}$/.test(record.quote)
          || typeof record.rate !== 'number'
          || !Number.isFinite(record.rate)
          || typeof record.date !== 'string'
        ))) {
          throw new Error('The exchange rates API returned invalid data.');
        }

        const supportedRates = result.filter((record) => SUPPORTED_CURRENCIES.includes(record.quote));
        setExchangeRates(supportedRates);
      } catch (requestError) {
        if (requestError.name !== 'AbortError') {
          setExchangeRatesError(requestError.message || 'Unable to connect to the exchange rates API.');
        }
      } finally {
        if (!controller.signal.aborted) setIsExchangeRatesLoading(false);
      }
    }

    loadExchangeRates();
    return () => controller.abort();
  }, [exchangeRateBase, exchangeRatesReload]);

  const page = employeesPage;
  const recentEmployees = page?.content.slice(0, RECENT_EMPLOYEE_LIMIT) || [];
  const salaryCurrencies = [...new Set(departmentSalaries.map((record) => record.currencyCode))].sort();
  const activeSalaryCurrency = salaryCurrencies.includes(selectedSalaryCurrency)
    ? selectedSalaryCurrency
    : salaryCurrencies[0] || '';
  const displayedDepartmentSalaries = departmentSalaries.filter(
    (record) => record.currencyCode === activeSalaryCurrency,
  );
  const maxDepartmentSalary = Math.max(
    0,
    ...displayedDepartmentSalaries.map((record) => record.totalSalary),
  );
  const today = new Intl.DateTimeFormat('en', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  }).format(new Date()).toUpperCase();

  return (
    <div className="home-page">
      <section className="page-intro">
        <div>
          <p className="eyebrow">{today}</p>
          <h1>Good morning<span className="heading-period">.</span></h1>
          <p className="intro-copy">Here's what's happening across your team today.</p>
        </div>
        <a className="primary-button" href="#/employees"><span aria-hidden="true">+</span> Add employee</a>
      </section>

      <section className="metric-grid" aria-label="Workforce summary">
        <article className="metric-card">
          <div className="metric-topline"><span>Total employees</span><span className="metric-icon">PE</span></div>
          <strong className="metric-value">{page ? page.totalElements.toLocaleString() : '—'}</strong>
          <p className="metric-foot">From the employee directory</p>
        </article>
      </section>

      <section className="dashboard-grid">
        <article className="panel salary-panel">
          <div className="panel-heading">
            <div><p className="eyebrow">PEOPLE COSTS</p><h2>Salary by department</h2></div>
            <a className="text-link" href="#/analytics">View analytics <span aria-hidden="true">-&gt;</span></a>
          </div>
          {departmentSalariesError ? (
            <div className="salary-chart-message" role="alert">
              <span>{departmentSalariesError}</span>
              <button type="button" onClick={() => setDepartmentSalariesReload((current) => current + 1)}>Retry</button>
            </div>
          ) : isDepartmentSalariesLoading ? (
            <p className="salary-chart-message" role="status">Loading department salaries…</p>
          ) : departmentSalaries.length === 0 ? (
            <p className="salary-chart-message">No department salary data found.</p>
          ) : (
            <>
              <div className="salary-chart-controls">
                <p className="salary-chart-note">Bar lengths are scaled within the selected currency.</p>
                <label className="salary-currency-control">
                  Currency
                  <select
                    aria-label="Salary chart currency"
                    value={activeSalaryCurrency}
                    onChange={(event) => setSelectedSalaryCurrency(event.target.value)}
                  >
                    {salaryCurrencies.map((currencyCode) => (
                      <option key={currencyCode} value={currencyCode}>{currencyCode}</option>
                    ))}
                  </select>
                </label>
              </div>
              <ul className="salary-department-chart" aria-label={`Total salary by department in ${activeSalaryCurrency}`}>
                {displayedDepartmentSalaries.map((record, index) => {
                  const barWidth = maxDepartmentSalary > 0
                    ? (record.totalSalary / maxDepartmentSalary) * 100
                    : 0;

                  return (
                    <li className="salary-department-row" key={`${record.departmentId}-${record.currencyCode}-${index}`}>
                      <span className="salary-department-name">{record.departmentName}</span>
                      <span className="salary-bar-track" aria-hidden="true">
                        <span className="salary-bar" style={{ width: `${barWidth}%` }} />
                      </span>
                      <strong className="salary-department-value">{formatCurrency(record.totalSalary, record.currencyCode)}</strong>
                    </li>
                  );
                })}
              </ul>
            </>
          )}
        </article>

        <article className="panel exchange-rate-panel">
          <div className="panel-heading">
            <div><p className="eyebrow">LIVE CURRENCY</p><h2>Latest exchange rates</h2></div>
            <label className="salary-currency-control">
              Base
              <select
                aria-label="Exchange rate base currency"
                value={exchangeRateBase}
                onChange={(event) => setExchangeRateBase(event.target.value)}
              >
                {SUPPORTED_CURRENCIES.map((currencyCode) => (
                  <option key={currencyCode} value={currencyCode}>{currencyCode}</option>
                ))}
              </select>
            </label>
          </div>
          {exchangeRatesError ? (
            <div className="salary-chart-message" role="alert">
              <span>{exchangeRatesError}</span>
              <button type="button" onClick={() => setExchangeRatesReload((current) => current + 1)}>Retry</button>
            </div>
          ) : isExchangeRatesLoading ? (
            <p className="salary-chart-message" role="status">Loading exchange rates…</p>
          ) : (
            <>
              <p className="exchange-rate-date">
                Value of 1 {exchangeRateBase} in each currency · latest available rates
              </p>
              <ul className="exchange-rate-list" aria-label={`Exchange rates with ${exchangeRateBase} as base`}>
                {SUPPORTED_CURRENCIES.map((currencyCode) => {
                  const currencyRate = exchangeRates.find((record) => record.quote === currencyCode);
                  const rate = currencyCode === exchangeRateBase ? 1 : currencyRate?.rate;

                  return (
                    <li className="exchange-rate-row" key={currencyCode}>
                      <span className="exchange-rate-currency">
                        <strong>{currencyCode}</strong>
                        <small>
                          {currencyCode === exchangeRateBase
                            ? 'Base currency'
                            : currencyRate ? formatDate(currencyRate.date) : 'Unavailable'}
                        </small>
                      </span>
                      <strong>{rate === undefined ? '—' : formatExchangeRate(rate)}</strong>
                    </li>
                  );
                })}
              </ul>
            </>
          )}
        </article>

      </section>

      <section className="panel activity-panel">
        <div className="panel-heading activity-heading">
          <div><p className="eyebrow">THE LATEST</p><h2>Recent employees</h2></div>
          <a className="text-link" href="#/employees">View employees <span aria-hidden="true">-&gt;</span></a>
        </div>
        {error && (
          <div className="employee-error" role="alert">
            <span>{error}</span>
            <button type="button" onClick={() => setReload((current) => current + 1)}>Retry</button>
          </div>
        )}
        <div className="activity-table-wrap">
          <table className="activity-table" aria-busy={isLoading}>
            <thead><tr><th>EMPLOYEE</th><th>DEPARTMENT</th><th>COUNTRY</th><th>HIRE DATE</th><th>STATUS</th></tr></thead>
            <tbody>
              {isLoading ? (
                <tr><td colSpan="5" className="employee-table-message">Loading employees…</td></tr>
              ) : error ? (
                <tr><td colSpan="5" className="employee-table-message">Employee records could not be loaded.</td></tr>
              ) : recentEmployees.length === 0 ? (
                <tr><td colSpan="5" className="employee-table-message">No employees found.</td></tr>
              ) : recentEmployees.map((employee) => (
                <tr key={employee.id}>
                  <td><span className="table-person"><span className="avatar">{getInitials(employee)}</span><strong>{employee.firstName} {employee.lastName}</strong></span></td>
                  <td>{employee.departmentId ? `Department ${employee.departmentId}` : '—'}</td>
                  <td>{employee.countryCode || '—'}</td>
                  <td>{formatDate(employee.hireDate)}</td>
                  <td><span className="status-pill">{employee.employmentStatus || 'Unknown'}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}

export default Home;