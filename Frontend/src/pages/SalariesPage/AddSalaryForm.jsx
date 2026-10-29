import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { fetchWithAuth } from '../../api';

const API_BASE_URL = (process.env.REACT_APP_API_BASE_URL || 'http://localhost:8080').replace(/\/$/, '');

function getToday() {
  const today = new Date();
  const localDate = new Date(today.getTime() - (today.getTimezoneOffset() * 60000));
  return localDate.toISOString().slice(0, 10);
}

function AddSalaryForm({ onCancel, onSuccess }) {
  const navigate = useNavigate();
  const [employeeValidationError, setEmployeeValidationError] = useState('');
  const [verifiedEmployeeId, setVerifiedEmployeeId] = useState('');
  const [employeeDetails, setEmployeeDetails] = useState({});
  const [isVerifyingEmployee, setIsVerifyingEmployee] = useState(false);
  const [values, setValues] = useState({
    employeeId: '',
    amount: '',
    currency: '',
    effectiveFrom: getToday(),
    effectiveTo: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  function updateValue(event) {
    const { name, value } = event.target;
    setValues((current) => ({ ...current, [name]: value }));
    if (name === 'employeeId') {
      setEmployeeValidationError('');
      setVerifiedEmployeeId('');
      setEmployeeDetails({});
    }
  }

  async function verifyEmployee(employeeId = values.employeeId) {
    const id = employeeId.trim();
    if (!id) {
      setEmployeeValidationError('Enter an employee ID to verify.');
      setVerifiedEmployeeId('');
      return false;
    }

    setIsVerifyingEmployee(true);
    setEmployeeValidationError('');
    setVerifiedEmployeeId('');

    try {
      const token = window.localStorage.getItem('accessToken');
      const response = await fetchWithAuth(
        `${API_BASE_URL}/api/v1/employees/employee-number/${encodeURIComponent(id)}`,
        { headers: token ? { Authorization: `Bearer ${token}` } : {} },
        navigate,
      );

      if (response.status === 401 || response.status === 403) return false;
      if (response.status === 404) {
        setEmployeeValidationError('The employee ID does not exist.');
        return false;
      }
      if (!response.ok) {
        setEmployeeValidationError(`Unable to verify employee ID (HTTP ${response.status}).`);
        return false;
      }

      setVerifiedEmployeeId(id);
      setEmployeeDetails(await response.json());
      return true;
    } catch (verificationError) {
      setEmployeeValidationError(verificationError.message || 'Unable to verify employee ID.');
      return false;
    } finally {
      setIsVerifyingEmployee(false);
    }
  }

  async function handleSubmit(event) {
    event.preventDefault();
    if (!values.employeeId.trim()) {
      setEmployeeValidationError('Enter an employee ID to verify.');
      return;
    }
    const amount = Number(values.amount);
    if (!Number.isFinite(amount) || amount <= 0 || !/^\d{1,17}(\.\d{1,2})?$/.test(values.amount)) {
      setError('Enter an amount greater than zero with no more than two decimal places.');
      return;
    }
    if (!/^[A-Za-z]{3}$/.test(values.currency)) {
      setError('Enter a three-letter currency code.');
      return;
    }
    if (!values.effectiveFrom) {
      setError('Enter an effective from date.');
      return;
    }
    if (values.effectiveFrom > getToday()) {
      setError('Effective from date cannot be in the future.');
      return;
    }
    if (values.effectiveTo && values.effectiveTo < values.effectiveFrom) {
      setError('Effective to date cannot be before effective from date.');
      return;
    }

    setError('');

    try {
      if (verifiedEmployeeId !== values.employeeId.trim() && !(await verifyEmployee())) return;

      setIsSubmitting(true);
      const token = window.localStorage.getItem('accessToken');
      const requestBody = {
        amount,
        currency: values.currency.trim(),
        effectiveFrom: values.effectiveFrom,
      };
      if (values.effectiveTo) requestBody.effectiveTo = values.effectiveTo;

      const response = await fetchWithAuth(
        `${API_BASE_URL}/api/v1/employees/${encodeURIComponent(employeeDetails.id.trim())}/salaries`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
          body: JSON.stringify(requestBody),
        },
        navigate,
      );

      if (response.status === 401 || response.status === 403) return;

      if (!response.ok) {
        let message = `Unable to add salary (HTTP ${response.status}).`;
        try {
          const result = await response.json();
          if (result && typeof result.message === 'string') message = result.message;
          else if (result && typeof result.error === 'string') message = result.error;
        } catch (responseError) {
          if (responseError.name !== 'SyntaxError') throw responseError;
        }
        throw new Error(message);
      }

      onSuccess();
    } catch (requestError) {
      setError(requestError.message || 'Unable to connect to the salary API.');
    } finally {
      setIsSubmitting(false);
    }
  }

  const isEmployeeVerified = verifiedEmployeeId !== '' && verifiedEmployeeId === values.employeeId.trim();

  return (
    <section className="panel add-salary-panel" aria-labelledby="add-salary-heading">
      <div className="panel-heading">
        <div>
          <p className="eyebrow">COMPENSATION DETAILS</p>
          <h2 id="add-salary-heading">Add salary</h2>
        </div>
        <button className="form-cancel" type="button" onClick={onCancel} disabled={isSubmitting}>Cancel</button>
      </div>

      {error && <p className="salary-form-error" role="alert">{error}</p>}
      <form className="salary-create-form" onSubmit={handleSubmit}>
        <div className="salary-employee-field">
          <label htmlFor="salary-employee-id">Employee ID</label>
          <div className="salary-employee-input">
            <input
              id="salary-employee-id"
              name="employeeId"
              type="text"
              value={values.employeeId}
              onChange={updateValue}
              required
              aria-invalid={Boolean(employeeValidationError)}
              aria-describedby={employeeValidationError ? 'employee-validation-error' : undefined}
              disabled={isSubmitting || isVerifyingEmployee}
            />
            <button
              className="employee-verify-button"
              type="button"
              onClick={() => verifyEmployee()}
              disabled={isSubmitting || isVerifyingEmployee}
            >
              {isVerifyingEmployee ? 'Verifying…' : 'Verify'}
            </button>
          </div>
          {employeeValidationError && (
            <span id="employee-validation-error" className="salary-form-error" role="alert">
              {employeeValidationError}
            </span>
          )}
          {isEmployeeVerified && (
            <span className="employee-verified" role="status">Employee ID verified.</span>
          )}
        </div>
        {isEmployeeVerified && (
          <div className="salary-details-fields">
            <label>
              Annual salary
              <input
                name="amount"
                aria-label="Annual salary"
                type="number"
                min="0.01"
                step="0.01"
                value={values.amount}
                onChange={updateValue}
                required
              />
            </label>
            <label>
              Currency
              <input
                name="currency"
                aria-label="Currency"
                type="text"
                maxLength="3"
                value={values.currency}
                onChange={updateValue}
                required
              />
            </label>
            <label>
              Effective from
              <input
                name="effectiveFrom"
                aria-label="Effective from"
                type="date"
                max={getToday()}
                value={values.effectiveFrom}
                onChange={updateValue}
                required
              />
            </label>
            <label>
              Effective to <span className="salary-form-optional">(optional)</span>
              <input
                name="effectiveTo"
                aria-label="Effective to"
                type="date"
                min={values.effectiveFrom}
                value={values.effectiveTo}
                onChange={updateValue}
              />
            </label>
            <div className="salary-create-actions">
              <button className="primary-button" type="submit" disabled={isSubmitting || isVerifyingEmployee}>
                {isSubmitting ? 'Saving…' : 'Save salary'}
              </button>
            </div>
          </div>
        )}
      </form>
    </section>
  );
}

export default AddSalaryForm;
