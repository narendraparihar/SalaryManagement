import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { fetchWithAuth } from '../api';

const API_BASE_URL = (process.env.REACT_APP_API_BASE_URL || 'http://localhost:8080').replace(/\/$/, '');
const PAGE_SIZE_OPTIONS = [5, 10, 20, 50];

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

function Home() {
  const navigate = useNavigate();
  const [employeesPage, setEmployeesPage] = useState(null);
  const [pageIndex, setPageIndex] = useState(0);
  const [pageSize, setPageSize] = useState(PAGE_SIZE_OPTIONS[0]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [reload, setReload] = useState(0);

  useEffect(() => {
    const controller = new AbortController();

    async function loadEmployees() {
      setIsLoading(true);
      setError('');

      try {
        const query = new URLSearchParams({
          page: String(pageIndex),
          size: String(pageSize),
          sort: 'createdAt,desc',
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
  }, [pageIndex, pageSize, reload, navigate]);

  const page = employeesPage;
  const firstRecord = page && page.totalElements > 0 ? (page.number * page.size) + 1 : 0;
  const lastRecord = page ? Math.min((page.number + 1) * page.size, page.totalElements) : 0;
  const pageCount = Math.max(page?.totalPages || 0, 1);
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
          <h1>Good morning, Alex<span className="heading-period">.</span></h1>
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
        <article className="metric-card">
          <div className="metric-topline"><span>Monthly payroll</span><span className="metric-icon pay-icon">$</span></div>
          <strong className="metric-value">$842,600</strong>
          <p className="metric-foot"><span className="positive-change">+ 2.8%</span> <span>vs. last month</span></p>
        </article>
        <article className="metric-card">
          <div className="metric-topline"><span>Open positions</span><span className="metric-icon role-icon">OP</span></div>
          <strong className="metric-value">7</strong>
          <p className="metric-foot"><span className="neutral-change">2 closing soon</span></p>
        </article>
        <article className="metric-card metric-card-highlight">
          <div className="metric-topline"><span>Pending approvals</span><span className="metric-icon approval-icon">!</span></div>
          <strong className="metric-value">4</strong>
          <p className="metric-foot"><a href="#/salaries">Review requests <span aria-hidden="true">-&gt;</span></a></p>
        </article>
      </section>

      <section className="dashboard-grid">
        <article className="panel payroll-panel">
          <div className="panel-heading">
            <div><p className="eyebrow">PEOPLE COSTS</p><h2>Payroll overview</h2></div>
            <a className="text-link" href="#/analytics">View analytics <span aria-hidden="true">-&gt;</span></a>
          </div>
          <div className="chart-summary"><strong>$842.6k</strong><span><b>+ 2.8%</b> from September</span></div>
          <div className="chart" role="img" aria-label="Monthly payroll from May to October, rising from 760 thousand to 843 thousand dollars">
            <div className="chart-y-labels"><span>$900k</span><span>$800k</span><span>$700k</span></div>
            <div className="chart-plot">
              <div className="chart-gridline gridline-top" /><div className="chart-gridline gridline-middle" /><div className="chart-gridline gridline-bottom" />
              <div className="bar-set"><i style={{ height: '48%' }} /><i style={{ height: '55%' }} /><i style={{ height: '59%' }} /><i style={{ height: '64%' }} /><i style={{ height: '70%' }} /><i className="current-bar" style={{ height: '78%' }} /></div>
              <div className="chart-x-labels"><span>May</span><span>Jun</span><span>Jul</span><span>Aug</span><span>Sep</span><span>Oct</span></div>
            </div>
          </div>
        </article>

        <article className="panel approvals-panel">
          <div className="panel-heading">
            <div><p className="eyebrow">NEEDS YOUR EYES</p><h2>Pending approvals</h2></div>
            <span className="count-badge">4</span>
          </div>
          <div className="approval-list">
            <div className="approval-row"><span className="avatar avatar-coral">JL</span><div className="approval-person"><strong>Jordan Lee</strong><span>Salary adjustment</span></div><span className="approval-amount">+$450</span></div>
            <div className="approval-row"><span className="avatar avatar-green">SR</span><div className="approval-person"><strong>Sam Rivera</strong><span>Expense claim</span></div><span className="approval-amount">$286</span></div>
            <div className="approval-row"><span className="avatar avatar-blue">AK</span><div className="approval-person"><strong>Amir Khan</strong><span>Time off - 3 days</span></div><span className="approval-status">Review</span></div>
          </div>
          <a className="panel-footer-link" href="#/salaries">View all approvals <span aria-hidden="true">-&gt;</span></a>
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
              ) : page.content.length === 0 ? (
                <tr><td colSpan="5" className="employee-table-message">No employees found.</td></tr>
              ) : page.content.map((employee) => (
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
        <div className="employee-pagination">
          <span className="employee-page-summary">
            {page ? `Showing ${firstRecord}-${lastRecord} of ${page.totalElements}` : 'Showing — employees'}
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
    </div>
  );
}

export default Home;