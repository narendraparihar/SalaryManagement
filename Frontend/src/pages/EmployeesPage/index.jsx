import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { fetchWithAuth } from '../../api';
import AddEmployeeForm from '../AddEmployeeForm';
import './style.scss';
const API_BASE_URL = (process.env.REACT_APP_API_BASE_URL || 'http://localhost:8080').replace(/\/$/, '');
const PAGE_SIZE_OPTIONS = [10, 20, 50];
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

function EmployeesPage() {
  const navigate = useNavigate();
  const [employeesPage, setEmployeesPage] = useState(null);
  const [pageIndex, setPageIndex] = useState(0);
  const [pageSize, setPageSize] = useState(PAGE_SIZE_OPTIONS[0]);
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [reload, setReload] = useState(0);
  const [isAddingEmployee, setIsAddingEmployee] = useState(false);
  const [employeeToEdit, setEmployeeToEdit] = useState(null);

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

    async function loadEmployees() {
      setIsLoading(true);
      setError('');

      try {
        const query = new URLSearchParams({
          page: String(pageIndex),
          size: String(pageSize),
          sort: 'last_name,asc',
        });
        const endpoint = debouncedSearchTerm
          ? `/api/v1/employees/search?${new URLSearchParams({
            keyword: debouncedSearchTerm,
            page: String(pageIndex),
            size: String(pageSize),
          })}`
          : `/api/v1/employees?${query.toString()}`;
        const token = window.localStorage.getItem('accessToken');
        const response = await fetchWithAuth(`${API_BASE_URL}${endpoint}`, {
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
          || typeof result.first !== 'boolean'
          || typeof result.last !== 'boolean'
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
  }, [pageIndex, pageSize, debouncedSearchTerm, reload, navigate]);

  const page = employeesPage;
  const firstRecord = page && page.totalElements > 0 ? (page.number * page.size) + 1 : 0;
  const lastRecord = page ? Math.min((page.number + 1) * page.size, page.totalElements) : 0;
  const pageCount = Math.max(page?.totalPages || 0, 1);

  return (
    <section className="employees-page">
      <div className="page-intro route-intro">
        <div>
          <p className="eyebrow">NORTHSTAR WORKSPACE</p>
          <h1>Employees<span className="heading-period">.</span></h1>
          <p className="intro-copy">Your people directory, all in one place.</p>
        </div>
        <div className="employee-page-actions">
          <label className="employee-search">
            <span className="visually-hidden">Search employees by name</span>
            <input
              type="search"
              aria-label="Search employees by name"
              placeholder="Search by name"
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
            />
          </label>
          <button className="primary-button" type="button" onClick={() => {
            setEmployeeToEdit(null);
            setIsAddingEmployee(true);
          }}>
            <span aria-hidden="true">+</span> Add employee
          </button>
        </div>
      </div>

      {(isAddingEmployee || employeeToEdit) && (
        <AddEmployeeForm
          key={employeeToEdit?.id || 'new'}
          employee={employeeToEdit}
          onCancel={() => {
            setIsAddingEmployee(false);
            setEmployeeToEdit(null);
          }}
          onSuccess={() => {
            setIsAddingEmployee(false);
            setEmployeeToEdit(null);
            setPageIndex(0);
            setReload((current) => current + 1);
          }}
        />
      )}

      <div className="route-summary">
        <span>
          <strong>{page ? page.totalElements.toLocaleString() : '—'}</strong>
          {page?.totalElements === 1 ? ' employee' : ' employees'}
        </span>
      </div>

      {error && (
        <div className="employee-error" role="alert">
          <span>{error}</span>
          <button type="button" onClick={() => setReload((current) => current + 1)}>Retry</button>
        </div>
      )}

      <div className="panel route-table-panel">
        <div className="activity-table-wrap">
          <table className="activity-table employees-table" aria-busy={isLoading}>
            <thead>
              <tr>
                <th>EMPLOYEE</th>
                <th>EMPLOYEE NO.</th>
                <th>EMAIL</th>
                <th>DEPARTMENT</th>
                <th>DESIGNATION</th>
                <th>COUNTRY</th>
                <th>HIRE DATE</th>
                <th>STATUS</th>
                <th><span className="visually-hidden">ACTIONS</span></th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr><td colSpan="9" className="employee-table-message">Loading employees…</td></tr>
              ) : error ? (
                <tr><td colSpan="9" className="employee-table-message">Employee records could not be loaded.</td></tr>
              ) : page.content.length === 0 ? (
                <tr><td colSpan="9" className="employee-table-message">No employees found.</td></tr>
              ) : page.content.map((employee) => (
                <tr key={employee.id}>
                  <td><strong>{employee.firstName} {employee.lastName}</strong></td>
                  <td>{employee.employeeNumber || '—'}</td>
                  <td>{employee.email || '—'}</td>
                  <td>{employee.departmentId ? `${employee.departmentName}` : '—'}</td>
                  <td>{employee.designationId ? `${employee.designationName}` : '—'}</td>
                  <td>{employee.countryCode || '—'}</td>
                  <td>{formatDate(employee.hireDate)}</td>
                  <td><span className="status-pill">{employee.status || 'Unknown'}</span></td>
                  <td>
                    <button
                      className="employee-edit-button"
                      type="button"
                      aria-label={`Edit employee ${employee.firstName} ${employee.lastName}`}
                      title="Edit employee"
                      onClick={() => {
                        setIsAddingEmployee(false);
                        setEmployeeToEdit(employee);
                      }}
                    >
                      <span aria-hidden="true">✎</span>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
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
  );
}

export default EmployeesPage;
