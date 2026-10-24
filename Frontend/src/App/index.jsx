import { HashRouter, useLocation, useNavigate } from 'react-router-dom';
import './style.scss';
import AuthPage from '../pages/AuthPage';
import AnalyticsPage from '../pages/AnalyticsPage';
import EmployeesPage from '../pages/EmployeesPage';
import Home from '../pages/Home';
import SalariesPage from '../pages/SalariesPage';

const navigation = [
  { path: '/', label: 'Overview', marker: 'OV' },
  { path: '/employees', label: 'Employees', marker: 'EM' },
  { path: '/salaries', label: 'Salary', marker: 'SL' },
  { path: '/analytics', label: 'Analytics', marker: 'AN' },
];

function AppContent() {
  const route = useLocation().pathname;
  const navigate = useNavigate();
  const userEmail = window.localStorage.getItem('userEmail') || '';
  const avatarInitial = userEmail.trim().charAt(0).toUpperCase() || 'U';

  const isDashboard = route === '/' || route === '/dashboard';
  const pageTitle = isDashboard
    ? 'Overview'
    : navigation.find((item) => item.path === route)?.label || 'Page not found';

  if (route === '/login' || route === '/signup') {
    return <AuthPage mode={route.slice(1)} />;
  }

  if (!window.localStorage.getItem('accessToken')) {
    return <AuthPage mode="login" />;
  }

  function logout() {
    window.localStorage.removeItem('accessToken');
    window.localStorage.removeItem('userEmail');
    navigate('/login', { replace: true });
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
      </aside>

      <div className="workspace">
        <header className="topbar">
          <div className="breadcrumbs"><span>Workspace</span><span className="breadcrumb-slash">/</span><strong>{pageTitle}</strong></div>
          <div className="topbar-actions">
            <span className="icon-button account-avatar" aria-label={userEmail ? `Account: ${userEmail}` : 'Account'}>
              {avatarInitial}
            </span>
            <button className="logout-button" type="button" onClick={logout}>Log out</button>
          </div>
        </header>

        <main className="main-content">
          {isDashboard ? <Home /> : route === '/employees' ? <EmployeesPage /> : route === '/salaries' ? <SalariesPage /> : route === '/analytics' ? <AnalyticsPage /> : (
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
