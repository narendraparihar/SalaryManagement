import { Fragment, useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { fetchWithAuth } from '../../api';
import './style.scss';

const API_BASE_URL = (process.env.REACT_APP_API_BASE_URL || 'http://localhost:8080').replace(/\/$/, '');
const HIGHEST_PAID_PATH = '/api/v1/analytics/highest-paid';
const QUESTIONS_PATH = '/api/v1/questions';
const SALARY_EXPORT_PATH = '/api/v1/analytics/salaries/export';
const ANALYTICS_ENDPOINTS = [
  { key: 'overview', title: 'Workforce overview', path: '/api/v1/analytics/overview', type: 'overview' },
  { key: 'country', title: 'Salary by country', path: '/api/v1/analytics/salaries/by-country', type: 'table' },
  { key: 'distribution', title: 'Salary distribution', path: '/api/v1/analytics/salaries/distribution', type: 'table' },
  { key: 'highestPaid', title: 'Highest-paid employees', path: '/api/v1/analytics/highest-paid', type: 'table' },
  { key: 'departments', title: 'Departments', path: '/api/v1/analytics/salaries/by-department', type: 'options' },
];
const DISTRIBUTION_PATH = '/api/v1/analytics/salaries/distribution';

function formatLabel(label) {
  return String(label)
    .replace(/([a-z0-9])([A-Z])/g, '$1 $2')
    .replace(/[_-]+/g, ' ')
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function formatValue(value) {
  if (value === null || value === undefined || value === '') return '—';
  if (typeof value === 'number') return value.toLocaleString('en');
  if (typeof value === 'boolean') return value ? 'Yes' : 'No';
  if (Array.isArray(value)) return value.map(formatValue).join(', ');
  if (typeof value === 'object') return JSON.stringify(value);
  return String(value);
}

function getRecords(data, endpointKey) {
  if (Array.isArray(data)) {
    return data.map((record) => (
      record && typeof record === 'object' ? record : { value: record }
    ));
  }

  if (!data || typeof data !== 'object') {
    return data === null || data === undefined ? [] : [{ value: data }];
  }

  const nestedRecords = data.content || data.records || data.results || data.items || data.data;
  if (Array.isArray(nestedRecords)) return getRecords(nestedRecords, endpointKey);
  if (nestedRecords && typeof nestedRecords === 'object') return getRecords(nestedRecords, endpointKey);

  const entries = Object.entries(data);
  if (entries.length > 0 && entries.every(([, value]) => value === null || typeof value !== 'object')) {
    if (endpointKey === 'country' && entries.some(([key]) => ['country', 'countryCode', 'countryName'].includes(key))) {
      return [data];
    }
    if (endpointKey === 'country') {
      return entries.map(([country, value]) => ({ country, value }));
    }
    return [data];
  }
  if (endpointKey === 'country') {
    return entries.map(([country, value]) => ({
      country,
      ...(value && typeof value === 'object' && !Array.isArray(value) ? value : { value }),
    }));
  }
  return entries.map(([label, value]) => ({ label, value }));
}

function getOverviewMetrics(data) {
  if (!data || typeof data !== 'object' || Array.isArray(data)) {
    return [{ label: 'Overview', value: formatValue(data) }];
  }

  return Object.entries(data).flatMap(([key, value]) => {
    if (value === null || typeof value !== 'object') {
      return [{ label: formatLabel(key), value: formatValue(value) }];
    }
    if (Array.isArray(value)) return [];
    return Object.entries(value).map(([nestedKey, nestedValue]) => ({
      label: `${formatLabel(key)} · ${formatLabel(nestedKey)}`,
      value: formatValue(nestedValue),
    }));
  });
}

function AnalyticsPage() {
  const navigate = useNavigate();
  const [results, setResults] = useState({});
  const [reload, setReload] = useState(0);
  const [filters, setFilters] = useState({
    currencyCode: '',
    departmentId: '',
    asOf: '',
  });
  const [currencySelectionTouched, setCurrencySelectionTouched] = useState(false);
  const [highestPaidCountryCode, setHighestPaidCountryCode] = useState('');
  const [exportCountryCode, setExportCountryCode] = useState('');
  const [exportState, setExportState] = useState({ loading: false, error: '' });
  const [question, setQuestion] = useState('What is the max annual salary in India?');
  const [questionAsOfDate] = useState(Date.now().toISOString().split('T')[0]);
  const [questionResult, setQuestionResult] = useState({ loading: false, data: undefined, error: '' });
  const questionResponse = questionResult.data && typeof questionResult.data === 'object'
    && !Array.isArray(questionResult.data)
    ? questionResult.data
    : null;
  const questionUnsupported = String(questionResponse?.status || '').toLowerCase() === 'unsupported';

  const countryRecords = useMemo(
    () => getRecords(results.country?.data, 'country'),
    [results.country?.data],
  );
  const currencyOptions = useMemo(
    () => [...new Set(countryRecords.map((record) => record.currencyCode).filter(Boolean))].sort(),
    [countryRecords],
  );
  const highestPaidCountryOptions = useMemo(
    () => [...new Map(countryRecords
      .filter((record) => record.countryCode)
      .map((record) => [
        String(record.countryCode),
        {
          code: String(record.countryCode),
          name: record.countryName || String(record.countryCode),
        },
      ])).values()],
    [countryRecords],
  );
  const departmentOptions = useMemo(
    () => [...new Map(getRecords(results.departments?.data, 'departments')
      .filter((record) => record.departmentId !== null && record.departmentId !== undefined)
      .map((record) => [
        String(record.departmentId),
        {
          id: String(record.departmentId),
          name: record.departmentName || `Department ${record.departmentId}`,
        },
      ])).values()],
    [results.departments?.data],
  );

  const loadAnalytics = useCallback(async (signal) => {
    const token = window.localStorage.getItem('accessToken');
    const requests = ANALYTICS_ENDPOINTS
      .filter((endpoint) => !['distribution', 'highestPaid'].includes(endpoint.key))
      .map(async (endpoint) => {
      setResults((current) => ({
        ...current,
        [endpoint.key]: { loading: true, data: current[endpoint.key]?.data, error: '' },
      }));

      try {
        const response = await fetchWithAuth(`${API_BASE_URL}${endpoint.path}`, {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
          signal,
        }, navigate);

        if (response.status === 401 || response.status === 403) return;
        if (!response.ok) {
          throw new Error(`Unable to load ${endpoint.title.toLowerCase()} (HTTP ${response.status}).`);
        }

        const data = await response.json();
        setResults((current) => ({
          ...current,
          [endpoint.key]: { loading: false, data, error: '' },
        }));
      } catch (requestError) {
        if (requestError.name !== 'AbortError') {
          setResults((current) => ({
            ...current,
            [endpoint.key]: {
              loading: false,
              data: current[endpoint.key]?.data,
              error: requestError.message || `Unable to connect to ${endpoint.title.toLowerCase()} API.`,
            },
          }));
        }
      }
    });

    await Promise.all(requests);
  }, [navigate]);

  useEffect(() => {
    const controller = new AbortController();
    const query = new URLSearchParams();
    if (highestPaidCountryCode) query.set('countryCode', highestPaidCountryCode);
    const path = highestPaidCountryCode
      ? `${HIGHEST_PAID_PATH}?${query.toString()}`
      : HIGHEST_PAID_PATH;

    async function loadHighestPaid() {
      setResults((current) => ({
        ...current,
        highestPaid: { loading: true, data: current.highestPaid?.data, error: '' },
      }));

      try {
        const token = window.localStorage.getItem('accessToken');
        const response = await fetchWithAuth(`${API_BASE_URL}${path}`, {
          headers: token ? { Authorization: 'Bearer ' + token } : {},
          signal: controller.signal,
        }, navigate);

        if (response.status === 401 || response.status === 403) return;
        if (!response.ok) {
          throw new Error(`Unable to load highest-paid employees (HTTP ${response.status}).`);
        }

        const data = await response.json();
        setResults((current) => ({
          ...current,
          highestPaid: { loading: false, data, error: '' },
        }));
      } catch (requestError) {
        if (requestError.name !== 'AbortError') {
          setResults((current) => ({
            ...current,
            highestPaid: {
              loading: false,
              data: current.highestPaid?.data,
              error: requestError.message || 'Unable to connect to highest-paid employees API.',
            },
          }));
        }
      }
    }

    loadHighestPaid();
    return () => controller.abort();
  }, [highestPaidCountryCode, navigate, reload]);

  useEffect(() => {
    const controller = new AbortController();
    loadAnalytics(controller.signal);
    return () => controller.abort();
  }, [loadAnalytics, reload]);

  useEffect(() => {
    if (!currencySelectionTouched && !filters.currencyCode && currencyOptions.length > 0) {
      setFilters((current) => (
        current.currencyCode ? current : { ...current, currencyCode: currencyOptions[0] }
      ));
    }
  }, [currencyOptions, currencySelectionTouched, filters.currencyCode]);

  useEffect(() => {
    if (!filters.currencyCode) return undefined;

    const controller = new AbortController();
    const query = new URLSearchParams({ currencyCode: filters.currencyCode });
    if (filters.departmentId) query.set('departmentId', filters.departmentId);
    if (filters.asOf) query.set('asOf', filters.asOf);

    async function loadDistribution() {
      setResults((current) => ({
        ...current,
        distribution: { loading: true, data: current.distribution?.data, error: '' },
      }));

      try {
        const token = window.localStorage.getItem('accessToken');
        const response = await fetchWithAuth(`${API_BASE_URL}${DISTRIBUTION_PATH}?${query.toString()}`, {
          headers: token ? { Authorization: 'Bearer ' + token } : {},
          signal: controller.signal,
        }, navigate);

        if (response.status === 401 || response.status === 403) return;
        if (!response.ok) {
          throw new Error(`Unable to load salary distribution (HTTP ${response.status}).`)
        }

        const data = await response.json();
        setResults((current) => ({
          ...current,
          distribution: { loading: false, data, error: '' },
        }));
      } catch (requestError) {
        if (requestError.name !== 'AbortError') {
          setResults((current) => ({
            ...current,
            distribution: {
              loading: false,
              data: current.distribution?.data,
              error: requestError.message || 'Unable to connect to salary distribution API.',
            },
          }));
        }
      }
    }

    loadDistribution();
    return () => controller.abort();
  }, [filters, navigate, reload]);

  function updateFilter(event) {
    const { name, value } = event.target;
    if (name === 'currencyCode') setCurrencySelectionTouched(true);
    setFilters((current) => ({ ...current, [name]: value }));
  }

  async function exportSalaries() {
    setExportState({ loading: true, error: '' });
    const query = new URLSearchParams();
    if (exportCountryCode) query.set('countryCode', exportCountryCode);
    if (filters.departmentId) query.set('departmentId', filters.departmentId);
    if (filters.currencyCode) query.set('currencyCode', filters.currencyCode);
    const queryString = query.toString();
    const path = queryString ? `${SALARY_EXPORT_PATH}?${queryString}` : SALARY_EXPORT_PATH;

    try {
      const token = window.localStorage.getItem('accessToken');
      const response = await fetchWithAuth(`${API_BASE_URL}${path}`, {
        headers: token ? { Authorization: 'Bearer ' + token } : {},
      }, navigate);

      if (response.status === 401 || response.status === 403) {
        setExportState({ loading: false, error: '' });
        return;
      }
      if (!response.ok) {
        throw new Error(`Unable to export salary records (HTTP ${response.status}).`);
      }

      const blob = await response.blob();
      const downloadUrl = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = 'salary-records.csv';
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(downloadUrl);
      setExportState({ loading: false, error: '' });
    } catch (requestError) {
      setExportState({
        loading: false,
        error: requestError.message || 'Unable to download salary records.',
      });
    }
  }

  async function submitQuestion(event) {
    event.preventDefault();
    setQuestionResult((current) => ({ ...current, loading: true, error: '' }));

    try {
      const token = window.localStorage.getItem('accessToken');
      const response = await fetchWithAuth(`${API_BASE_URL}${QUESTIONS_PATH}`, {
        method: 'POST',
        headers: {
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ question, as_of_date: questionAsOfDate }),
      }, navigate);

      if (response.status === 401 || response.status === 403) return;
      if (!response.ok) {
        throw new Error(`Unable to answer question (HTTP ${response.status}).`);
      }

      const data = await response.json();
      setQuestionResult({ loading: false, data, error: '' });
    } catch (requestError) {
      setQuestionResult((current) => ({
        ...current,
        loading: false,
        error: requestError.message || 'Unable to connect to questions API.',
      }));
    }
  }

  return (
    <section className="analytics-page">
      <div className="page-intro route-intro">
        <div>
          <p className="eyebrow">NORTHSTAR WORKSPACE</p>
          <h1>Analytics<span className="heading-period">.</span></h1>
          <p className="intro-copy">A clear view of your workforce and salary data.</p>
        </div>
        <button className="form-cancel" type="button" onClick={() => setReload((current) => current + 1)}>
          Refresh analytics
        </button>
      </div>

      <div className="analytics-grid">
        {ANALYTICS_ENDPOINTS.filter((endpoint) => endpoint.key !== 'departments').map((endpoint) => {
          const result = results[endpoint.key];
          const overviewMetrics = endpoint.type === 'overview' && result?.data !== undefined
            ? getOverviewMetrics(result.data)
            : [];
          const records = endpoint.type === 'table' && result?.data !== undefined
            ? getRecords(result.data, endpoint.key)
            : [];
          const columns = records.reduce((allColumns, record) => (
            allColumns.concat(Object.keys(record).filter((key) => !allColumns.includes(key)))
          ), []);

          return (
            
            <article className={`panel analytics-panel${endpoint.type === 'overview' ? ' analytics-overview-panel' : ''}`} key={endpoint.key}>
              <div className="panel-heading">
                <div><p className="eyebrow">PEOPLE &amp; PAY</p><h2>{endpoint.title}</h2></div>
                {endpoint.key === 'overview' && (
                  <div className="analytics-export-actions">
                    <button
                      className="primary-button"
                      type="button"
                      onClick={exportSalaries}
                      disabled={exportState.loading}
                    >
                      {exportState.loading ? 'Preparing CSV…' : 'Download salary CSV'}
                    </button>
                    {exportState.error && <div className="employee-error" role="alert">{exportState.error}</div>}
                  </div>
                )}
              </div>
              {result?.error && (
                <div className="employee-error" role="alert">
                  <span>{result.error}</span>
                  <button type="button" onClick={() => setReload((current) => current + 1)}>Retry</button>
                </div>
              )}
              {endpoint.key === 'distribution'  && (
                <section className="panel analytics-filters" aria-labelledby="distribution-filters-heading">
                  <div className="panel-heading">
                    <div><p className="eyebrow">SALARY DISTRIBUTION</p><h2 id="distribution-filters-heading">Filter results</h2></div>
                  </div>
                  <div className="analytics-filter-grid">
                    <label>
                      Currency code
                      <select
                        name="currencyCode"
                        value={filters.currencyCode}
                        onChange={updateFilter}
                        disabled={currencyOptions.length === 0}
                      >
                        <option value="">All currencies</option>
                        {currencyOptions.map((currency) => <option key={currency} value={currency}>{currency}</option>)}
                      </select>
                    </label>
                    <label>
                      Department
                      <select name="departmentId" value={filters.departmentId} onChange={updateFilter}>
                        <option value="">All departments</option>
                        {departmentOptions.map((department) => (
                          <option key={department.id} value={department.id}>{department.name}</option>
                        ))}
                      </select>
                    </label>
                    <label>
                      Export country
                      <select
                        name="exportCountryCode"
                        value={exportCountryCode}
                        onChange={(event) => setExportCountryCode(event.target.value)}
                      >
                        <option value="">All countries</option>
                        {highestPaidCountryOptions.map((country) => (
                          <option key={country.code} value={country.code}>{country.name}</option>
                        ))}
                      </select>
                    </label>
                    <label>
                      As of
                      <input name="asOf" type="date" value={filters.asOf} onChange={updateFilter} />
                    </label>
                  </div>
                  {results.departments?.error && (
                    <p className="analytics-message" role="alert">
                      Department filters could not be loaded: {results.departments.error}
                    </p>
                  )}
                </section>
              )}
              {endpoint.key === 'highestPaid' && (
                <section className="analytics-filters" aria-label="Highest-paid employee filters">
                  <div className="analytics-filter-grid">
                    <label>
                      Highest-paid country
                      <select
                        name="highestPaidCountryCode"
                        value={highestPaidCountryCode}
                        onChange={(event) => setHighestPaidCountryCode(event.target.value)}
                      >
                        <option value="">India</option>
                        {highestPaidCountryOptions.map((country) => (
                          <option key={country.code} value={country.code}>{country.name}</option>
                        ))}
                      </select>
                    </label>
                  </div>
                </section>
              )}

              {endpoint.key === 'distribution' && !filters.currencyCode ? (
                <p className="analytics-message">Select a currency to load salary distribution.</p>
              ) : result?.loading && !result.data ? (
                <p className="analytics-message" role="status">Loading {endpoint.title.toLowerCase()}…</p>
              ) : result?.data === undefined ? (
                !result?.error && <p className="analytics-message">No analytics data available.</p>
              ) : endpoint.type === 'overview' ? (
                overviewMetrics.length > 0 ? (
                  <div className="analytics-metric-grid">
                    {overviewMetrics.map((metric) => (
                      <div className="analytics-metric" key={metric.label}>
                        <span>{metric.label}</span>
                        <strong>{metric.value}</strong>
                      </div>
                    ))}
                  </div>
                ) : <p className="analytics-message">No overview metrics available.</p>
              ) : records.length > 0 && columns.length > 0 ? (
                <div className="activity-table-wrap analytics-table-wrap">
                  <table className="activity-table analytics-table">
                    <thead><tr>{columns.map((column) => <th key={column}>{formatLabel(column)}</th>)}</tr></thead>
                    <tbody>
                      {records.map((record, index) => (
                        <tr key={record.id || record.label || index}>
                          {columns.map((column) => <td key={column}>{formatValue(record[column])}</td>)}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : <p className="analytics-message">No records available.</p>}
            </article>
          );
        })}
        <article className="panel analytics-panel analytics-question-panel">
          <div className="panel-heading">
            <div><p className="eyebrow">ASK ABOUT YOUR DATA</p><h2>Questions</h2></div>
          </div>
          <form className="analytics-question-form" onSubmit={submitQuestion}>
            <label>
              Question
              <input
                name="question"
                type="text"
                value={question}
                onChange={(event) => setQuestion(event.target.value)}
                required
              />
            </label>
            <button className="form-cancel" type="submit" disabled={questionResult.loading}>
              {questionResult.loading ? 'Getting answer…' : 'Ask question'}
            </button>
          </form>
          {questionResult.error && (
            <div className="employee-error" role="alert">
              <span>{questionResult.error}</span>
              <button type="button" onClick={submitQuestion}>Retry</button>
            </div>
          )}
          {questionResult.loading && !questionResult.data && (
            <p className="analytics-message" role="status">Getting an answer…</p>
          )}
          {questionResult.data !== undefined && (
            <div className="analytics-question-answer" aria-live="polite">
              <div className="analytics-question-answer-heading">
                <h3>Answer</h3>
                {questionResponse?.status && (
                  <span className="analytics-question-status">{formatLabel(questionResponse.status)}</span>
                )}
              </div>
              {questionResponse?.question && (
                <p className="analytics-question-prompt">{questionResponse.question}</p>
              )}
              {questionUnsupported ? (
                <div className="analytics-question-supported">
                  <p>This question type is not supported. Supported question types:</p>
                  <ul>
                    <li>Employee count</li>
                    <li>Average</li>
                    <li>Total</li>
                    <li>Minimum</li>
                    <li>Maximum</li>
                  </ul>
                </div>
              ) : (
                <>
                  <p className="analytics-question-value">
                    {questionResponse?.value !== undefined && questionResponse?.value !== null
                      ? `${questionResponse.currency_code ? `${questionResponse.currency_code} ` : ''}${formatValue(questionResponse.value)}`
                      : formatValue(questionResponse?.answer ?? questionResult.data)}
                  </p>
                  {(questionResponse?.metric || questionResponse?.employee_count !== undefined) && (
                    <dl className="analytics-question-details">
                      {questionResponse.metric && (
                        <>
                          <dt>Metric</dt>
                          <dd>{formatLabel(questionResponse.metric)}</dd>
                        </>
                      )}
                      {questionResponse.employee_count !== undefined && (
                        <>
                          <dt>Employees included</dt>
                          <dd>{formatValue(questionResponse.employee_count)}</dd>
                        </>
                      )}
                      {questionResponse.filters && Object.entries(questionResponse.filters).map(([key, value]) => (
                        <Fragment key={key}>
                          <dt>{formatLabel(key)}</dt>
                          <dd>{formatValue(value)}</dd>
                        </Fragment>
                      ))}
                    </dl>
                  )}
                  {questionResponse?.explanation && (
                    <p className="analytics-question-explanation">{questionResponse.explanation}</p>
                  )}
                </>
              )}
            </div>
          )}
        </article>
      </div>
    </section>
  );
}

export default AnalyticsPage;
