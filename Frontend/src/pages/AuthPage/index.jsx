import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './style.scss';
const API_BASE_URL = (process.env.REACT_APP_API_BASE_URL || 'http://localhost:8080').replace(/\/$/, '');

function AuthPage({ mode }) {
  const isSignup = mode === 'signup';
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const navigate = useNavigate();

  async function handleSubmit(event) {
    event.preventDefault();
    setError('');
    setMessage('');
    setIsSubmitting(true);

    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/${isSignup ? 'signup' : 'login'}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      let result;
      try {
        result = await response.json();
      } catch (parseError) {
        throw new Error('The server returned an invalid response. Please try again.');
      }

      if (!response.ok) {
        throw new Error(result.error || `${isSignup ? 'Sign up' : 'Sign in'} failed (HTTP ${response.status}).`);
      }

      if (isSignup) {
        setMessage('Your account is ready. Sign in to continue.');
        return;
      }

      if (typeof result.accessToken !== 'string' || !result.accessToken) {
        throw new Error('Sign in succeeded but the server did not return an access token.');
      }

      window.localStorage.setItem('accessToken', result.accessToken);
      window.localStorage.setItem(
        'userEmail',
        typeof result.email === 'string' && result.email.trim() ? result.email.trim() : email.trim(),
      );
      navigate('/dashboard', { replace: true });
    } catch (requestError) {
      setError(requestError.message || 'Unable to connect to the authentication service.');
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main className="auth-page">
      <section className="auth-card" aria-labelledby="auth-title">
        <a className="brand auth-brand" href="#/" aria-label="Northstar home">
          <span className="brand-mark">N</span>
          <span>northstar<span className="brand-period">.</span></span>
        </a>
        <p className="eyebrow">{isSignup ? 'GET STARTED' : 'WELCOME BACK'}</p>
        <h1 id="auth-title">{isSignup ? 'Create your account' : 'Sign in to Northstar'}</h1>
        <p className="auth-description">
          {isSignup ? 'Set up your account to access your workspace.' : 'Enter your credentials to continue to your workspace.'}
        </p>

        {message && <p className="auth-message" role="status">{message}</p>}
        {error && <p className="auth-error" role="alert">{error}</p>}

        <form className="auth-form" onSubmit={handleSubmit}>
          <label htmlFor="auth-email">Email address</label>
          <input
            autoComplete="email"
            id="auth-email"
            name="email"
            onChange={(event) => setEmail(event.target.value)}
            required
            type="email"
            value={email}
          />
          <label htmlFor="auth-password">Password</label>
          <input
            autoComplete={isSignup ? 'new-password' : 'current-password'}
            id="auth-password"
            minLength={isSignup ? 8 : undefined}
            name="password"
            onChange={(event) => setPassword(event.target.value)}
            required
            type="password"
            value={password}
          />
          <button className="primary-button auth-submit" disabled={isSubmitting} type="submit">
            {isSubmitting ? 'Please wait…' : isSignup ? 'Create account' : 'Sign in'}
          </button>
        </form>

        <p className="auth-switch">
          {isSignup ? 'Already have an account?' : 'New to Northstar?'}{' '}
          <a href={isSignup ? '#/login' : '#/signup'}>{isSignup ? 'Sign in' : 'Create an account'}</a>
        </p>
      </section>
    </main>
  );
}

export default AuthPage;
