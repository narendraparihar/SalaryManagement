import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { fetchWithAuth } from '../api';
const PAGE_SIZE_OPTIONS = [10, 20, 50];
const API_BASE_URL = (process.env.REACT_APP_API_BASE_URL || 'http://localhost:8080').replace(/\/$/, '');
const SEARCH_DEBOUNCE_MS = 350;

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

function formatAmount(amount, currency) {
  const numericAmount = Number(amount);
  if (!Number.isFinite(numericAmount)) return '—';

  if (typeof currency !== 'string' || !/^[A-Z]{3}$/.test(currency)) {
    return numericAmount.toLocaleString('en', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }

  return new Intl.NumberFormat('en', {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(numericAmount);
}

function SalariesPage() {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [reload, setReload] = useState(0);
  const [salariesPage, setSalariesPage] = useState(null);
  const [pageIndex, setPageIndex] = useState(0);
  const [pageSize, setPageSize] = useState(PAGE_SIZE_OPTIONS[0]);
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');

  useEffect(() => {
    const normalizedSearchTerm = searchTerm.trim();
    if (normalizedSearchTerm === debouncedSearchTerm) return undefined;

    const timeout = window.setTimeout(() => {
      setPageIndex(0);
      setDebouncedSearchTerm(normalizedSearchTerm);
    }, SEARCH_DEBOUNCE_MS);

    return () => window.clearTimeout(timeout);
  }, [searchTerm, debouncedSearchTerm]);

  useEffect(() => {
    const controller = new AbortController();

    async function loadSalaries() {
      setIsLoading(true);
      setError('');

      try {
        const query = new URLSearchParams({
          page: String(pageIndex),
          size: String(pageSize),
        });
        const endpoint = debouncedSearchTerm
          ? `/api/v1/salaries/search?${new URLSearchParams({
            keyword: debouncedSearchTerm,
            page: String(pageIndex),
            size: String(pageSize),
          })}`
          : `/api/v1/salaries/current?${query.toString()}`;
        const token = window.localStorage.getItem('accessToken');
        const response = await fetchWithAuth(`${API_BASE_URL}${endpoint}`, {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
          signal: controller.signal,
        }, navigate);

        if (response.status === 401 || response.status === 403) return;

        if (!response.ok) {
          throw new Error(`Unable to load salaries (HTTP ${response.status}).`);
        }

        const result = await response.json();
        if (
          !Array.isArray(result.content)
          || !Number.isInteger(result.totalElements)
          || !Number.isInteger(result.totalPages)
          || !Number.isInteger(result.number)
          || !Number.isInteger(result.size)
          || typeof result.first !== 'boolean'
          || typeof result.last !== 'boolean'
        ) {
          throw new Error('The salary API returned an invalid paginated response.');
        }

        setSalariesPage(result);
      } catch (requestError) {
        if (requestError.name !== 'AbortError') {
          setError(requestError.message || 'Unable to connect to the salary API.');
        }
      } finally {
        if (!controller.signal.aborted) setIsLoading(false);
      }
    }

    loadSalaries();
    return () => controller.abort();
  }, [pageIndex, pageSize, debouncedSearchTerm, reload, navigate]);

  const page = salariesPage;
  const firstRecord = page && page.totalElements > 0 ? (page.number * page.size) + 1 : 0;
  const lastRecord = page ? Math.min((page.number + 1) * page.size, page.totalElements) : 0;
  const pageCount = Math.max(page?.totalPages || 0, 1);

  return (
    <section className="salaries-page">
      <div className="page-intro route-intro">
        <div>
          <p className="eyebrow">NORTHSTAR WORKSPACE</p>
          <h1>Salary<span className="heading-period">.</span></h1>
          <p className="intro-copy">Review current compensation and effective dates.</p>
        </div>
        <label className="employee-search">
          <span className="visually-hidden">Search salaries by employee name</span>
          <input
            type="search"
            aria-label="Search salaries by employee name"
            placeholder="Search by employee name"
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
          />
        </label>
      </div>

      <div className="route-summary">
        <span>
          <strong>{page ? page.totalElements.toLocaleString() : '—'}</strong>
          {page?.totalElements === 1 ? ' current salary' : ' current salaries'}
        </span>
        <span className="route-filter">{debouncedSearchTerm ? `Name: ${debouncedSearchTerm}` : 'Current salaries'}</span>
      </div>

      {error && (
        <div className="employee-error" role="alert">
          <span>{error}</span>
          <button type="button" onClick={() => setReload((current) => current + 1)}>Retry</button>
        </div>
      )}

      <div className="panel route-table-panel">
        <div className="activity-table-wrap">
          <table className="activity-table salaries-table" aria-busy={isLoading}>
            <thead>
              <tr>
                <th>EMPLOYEE NAME</th>
                <th>ANNUAL SALARY</th>
                <th>CURRENCY</th>
                <th>EFFECTIVE FROM</th>
                <th>EFFECTIVE TO</th>
                <th>CREATED BY</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr><td colSpan="6" className="employee-table-message">Loading salaries…</td></tr>
              ) : error ? (
                <tr><td colSpan="6" className="employee-table-message">Salary records could not be loaded.</td></tr>
              ) : page.content.length === 0 ? (
                <tr><td colSpan="6" className="employee-table-message">No current salaries found.</td></tr>
              ) : page.content.map((salary) => (
                <tr key={salary.id}>
                  <td><strong>{salary.name}</strong></td>
                  <td>{formatAmount(salary.amount, salary.currency)}</td>
                  <td>{salary.currency || '—'}</td>
                  <td>{formatDate(salary.effectiveFrom)}</td>
                  <td>{formatDate(salary.effectiveTo)}</td>
                  <td>{salary.createdBy || '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      <div className="employee-pagination">
        <span className="employee-page-summary">
          {page ? `Showing ${firstRecord}-${lastRecord} of ${page.totalElements}` : 'Showing — salaries'}
        </span>
        <label className="page-size-control">
          Rows per page
          <select
            aria-label="Rows per page"
            value={pageSize}
            onChange={(event) => {
              setPageSize(Number(event.target.value));
              setPageIndex(0);
            }}
          >
            {PAGE_SIZE_OPTIONS.map((size) => <option key={size} value={size}>{size}</option>)}
          </select>
        </label>
        <span className="page-indicator">Page {page ? page.number + 1 : pageIndex + 1} of {pageCount}</span>
        <div className="pagination-buttons">
          <button type="button" onClick={() => setPageIndex((current) => current - 1)} disabled={!page || page.first || isLoading} aria-label="Previous page">Previous</button>
          <button type="button" onClick={() => setPageIndex((current) => current + 1)} disabled={!page || page.last || isLoading} aria-label="Next page">Next</button>
        </div>
      </div>
    </section>
  );
}

export default SalariesPage;
