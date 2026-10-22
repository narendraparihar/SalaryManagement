import { HashRouter, useLocation } from 'react-router-dom';
import './App.css';
import AuthPage from './pages/AuthPage';
import EmployeesPage from './pages/EmployeesPage';
import Home from './pages/Home';
import RoutePage from './pages/RoutePage';
import SalariesPage from './pages/SalariesPage';

const navigation = [
  { path: '/', label: 'Overview', marker: 'OV' },
  { path: '/employees', label: 'Employees', marker: 'EM' },
  { path: '/salaries', label: 'Salary', marker: 'SL' },
  { path: '/analytics', label: 'Analytics', marker: 'AN' },
];

const sections = {
  '/analytics': {
    title: 'Analytics',
    description: 'A clear view of the numbers behind your team.',
    columns: ['Metric', 'This month', 'Last month', 'Change'],
    rows: [
      ['Headcount', '128', '124', '+3.2%'],
      ['Monthly payroll', '$842,600', '$819,400', '+2.8%'],
      ['Open positions', '7', '9', '-22.2%'],
    ],
  },
};

function AppContent() {
  const route = useLocation().pathname;

  const activeSection = sections[route];
  const isDashboard = route === '/' || route === '/dashboard';
  const pageTitle = isDashboard
    ? 'Overview'
    : navigation.find((item) => item.path === route)?.label || activeSection?.title || 'Page not found';

  if (route === '/login' || route === '/signup') {
    return <AuthPage mode={route.slice(1)} />;
  }

  if (!window.localStorage.getItem('accessToken')) {
    return <AuthPage mode="login" />;
  }

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <a className="brand" href="#/" aria-label="Northstar home">
          <span className="brand-mark">N</span>
          <span>northstar<span className="brand-period">.</span></span>
        </a>
        <p className="nav-caption">WORKSPACE</p>
        <nav className="main-nav" aria-label="Main navigation">
          {navigation.map((item) => (
            <a
              className={`nav-link${route === item.path ? ' is-active' : ''}`}
              href={`#${item.path}`}
              key={item.path}
              aria-current={route === item.path ? 'page' : undefined}
            >
              <span className="nav-marker" aria-hidden="true">{item.marker}</span>
              <span>{item.label}</span>
            </a>
          ))}
        </nav>
        <div className="sidebar-footer">
          <span className="avatar avatar-small">AM</span>
          <span><strong>Alex Morgan</strong><small>Administrator</small></span>
          <span className="more-mark" aria-hidden="true">...</span>
        </div>
      </aside>

      <div className="workspace">
        <header className="topbar">
          <div className="breadcrumbs"><span>Workspace</span><span className="breadcrumb-slash">/</span><strong>{pageTitle}</strong></div>
          <div className="topbar-actions">
            <span className="period-label">OCT 2026</span>
            <button className="icon-button notification-button" type="button" aria-label="Notifications">
              <span aria-hidden="true">N</span><i />
            </button>
            <span className="avatar">AM</span>
          </div>
        </header>

        <main className="main-content">
          {isDashboard ? <Home /> : route === '/employees' ? <EmployeesPage /> : route === '/salaries' ? <SalariesPage /> : activeSection ? <RoutePage section={activeSection} /> : (
            <section className="not-found">
              <p className="eyebrow">404 / NOT FOUND</p>
              <h1>This page isn't here.</h1>
              <a className="text-link" href="#/">Return to overview <span aria-hidden="true">-&gt;</span></a>
            </section>
          )}
        </main>
      </div>
    </div>
  );
}

function App() {
  return (
    <HashRouter>
      <AppContent />
    </HashRouter>
  );
}

export default App;
