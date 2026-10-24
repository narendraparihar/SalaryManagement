import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { fetchWithAuth } from '../../api';
import './style.scss';

const API_BASE_URL = (process.env.REACT_APP_API_BASE_URL || 'http://localhost:8080').replace(/\/$/, '');

const initialValues = {
  firstName: '',
  lastName: '',
  employeeNumber: '',
  email: '',
  departmentId: '',
  designationId: '',
  countryCode: '',
  hireDate: '',
  employmentStatus: '',
};

function AddEmployeeForm({ employee, onCancel, onSuccess }) {
  const navigate = useNavigate();
  const [values, setValues] = useState(() => ({
    ...initialValues,
    ...(employee || {}),
    departmentId: employee?.departmentId == null ? '' : String(employee.departmentId),
    designationId: employee?.designationId == null ? '' : String(employee.designationId),
  }));
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState('');

  function updateValue(event) {
    const { name, value } = event.target;
    setValues((current) => ({ ...current, [name]: value }));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setIsSubmitting(true);
    setError('');

    const employeeDetails = {
      firstName: values.firstName.trim(),
      lastName: values.lastName.trim(),
      email: values.email.trim(),
    };
    ['employeeNumber', 'countryCode', 'hireDate', 'employmentStatus'].forEach((field) => {
      if (values[field].trim()) employeeDetails[field] = values[field].trim();
    });
    ['departmentId', 'designationId'].forEach((field) => {
      if (values[field]) employeeDetails[field] = Number(values[field]);
    });

    try {
      const token = window.localStorage.getItem('accessToken');
      const response = await fetchWithAuth(
        `${API_BASE_URL}/api/v1/employees${employee ? `/${encodeURIComponent(employee.id)}` : ''}`,
        {
          method: employee ? 'PUT' : 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
          body: JSON.stringify(employeeDetails),
        },
        navigate,
      );

      if (response.status === 401 || response.status === 403) return;

      if (!response.ok) {
        let message = `Unable to ${employee ? 'update' : 'add'} employee (HTTP ${response.status}).`;
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
      setError(requestError.message || 'Unable to connect to the employee API.');
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleDelete() {
    if (!window.confirm(`Delete ${employee.firstName} ${employee.lastName}? This action cannot be undone.`)) return;

    setIsDeleting(true);
    setError('');

    try {
      const token = window.localStorage.getItem('accessToken');
      const response = await fetchWithAuth(
        `${API_BASE_URL}/api/v1/employees/${encodeURIComponent(employee.id)}`,
        {
          method: 'DELETE',
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        },
        navigate,
      );

      if (response.status === 401 || response.status === 403) return;

      if (!response.ok) {
        let message = `Unable to delete employee (HTTP ${response.status}).`;
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
      setError(requestError.message || 'Unable to connect to the employee API.');
    } finally {
      setIsDeleting(false);
    }
  }

  return (
    <section className="panel add-employee-panel" aria-labelledby="add-employee-heading">
      <div className="panel-heading">
        <div>
          <p className="eyebrow">EMPLOYEE DETAILS</p>
          <h2 id="add-employee-heading">{employee ? 'Edit employee' : 'Add employee'}</h2>
        </div>
        <button className="form-cancel" type="button" onClick={onCancel} disabled={isSubmitting || isDeleting}>Cancel</button>
      </div>

      {error && <p className="employee-form-error" role="alert">{error}</p>}

      <form className="employee-form" onSubmit={handleSubmit}>
        <label>
          First name
          <input name="firstName" value={values.firstName} onChange={updateValue} required autoComplete="given-name" />
        </label>
        <label>
          Last name
          <input name="lastName" value={values.lastName} onChange={updateValue} required autoComplete="family-name" />
        </label>
        <label>
          Email
          <input name="email" type="email" value={values.email} onChange={updateValue} required autoComplete="email" />
        </label>
        <label>
          Employee number
          <input name="employeeNumber" value={values.employeeNumber} onChange={updateValue} />
        </label>
        <label>
          Department ID
          <input name="departmentId" type="number" min="1" value={values.departmentId} onChange={updateValue} />
        </label>
        <label>
          Designation ID
          <input name="designationId" type="number" min="1" value={values.designationId} onChange={updateValue} />
        </label>
        <label>
          Country code
          <input name="countryCode" value={values.countryCode} onChange={updateValue} maxLength="3" />
        </label>
        <label>
          Hire date
          <input name="hireDate" type="date" value={values.hireDate} onChange={updateValue} />
        </label>
        <label>
          Employment status
          <input name="employmentStatus" value={values.employmentStatus} onChange={updateValue} />
        </label>
        <div className="employee-form-actions">
          {employee && (
            <button
              className="employee-delete-button"
              type="button"
              onClick={handleDelete}
              disabled={isSubmitting || isDeleting}
            >
              {isDeleting ? 'Deleting…' : 'Delete employee'}
            </button>
          )}
          <button className="primary-button" type="submit" disabled={isSubmitting || isDeleting}>
            {isSubmitting ? 'Saving…' : employee ? 'Save changes' : 'Save employee'}
          </button>
        </div>
      </form>
    </section>
  );
}

export default AddEmployeeForm;
