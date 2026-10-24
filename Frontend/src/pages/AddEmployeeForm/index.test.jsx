import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import AddEmployeeForm from './index';

beforeEach(() => {
  window.localStorage.setItem('accessToken', 'test-token');
  global.fetch = jest.fn();
});

afterEach(() => {
  jest.clearAllMocks();
  jest.restoreAllMocks();
});

test('deletes an employee after confirmation and reports success', async () => {
  const onSuccess = jest.fn();
  const employee = {
    id: '31db4e5a-ef45-4d9d-b089-c683d77ce856',
    firstName: 'Taylor',
    lastName: 'Lee',
    email: 'taylor@example.com',
  };
  global.fetch.mockResolvedValue({ ok: true, status: 204 });
  jest.spyOn(window, 'confirm').mockReturnValue(true);

  render(
    <MemoryRouter>
      <AddEmployeeForm employee={employee} onCancel={jest.fn()} onSuccess={onSuccess} />
    </MemoryRouter>,
  );

  fireEvent.click(screen.getByRole('button', { name: 'Delete employee' }));

  await waitFor(() => expect(onSuccess).toHaveBeenCalledTimes(1));
  expect(window.confirm).toHaveBeenCalledWith(
    'Delete Taylor Lee? This action cannot be undone.',
  );
  expect(global.fetch).toHaveBeenCalledWith(
    `http://localhost:8080/api/v1/employees/${employee.id}`,
    expect.objectContaining({ method: 'DELETE' }),
  );
});

test('does not delete an employee when deletion is canceled', () => {
  global.fetch.mockResolvedValue({ ok: true, status: 204 });
  jest.spyOn(window, 'confirm').mockReturnValue(false);

  render(
    <MemoryRouter>
      <AddEmployeeForm
        employee={{ id: 'employee-123', firstName: 'Taylor', lastName: 'Lee' }}
        onCancel={jest.fn()}
        onSuccess={jest.fn()}
      />
    </MemoryRouter>,
  );

  fireEvent.click(screen.getByRole('button', { name: 'Delete employee' }));

  expect(global.fetch).not.toHaveBeenCalled();
});

test('posts employee details to the employee endpoint and reports success', async () => {
  const onSuccess = jest.fn();
  global.fetch.mockResolvedValue({ ok: true, status: 201 });

  render(
    <MemoryRouter>
      <AddEmployeeForm onCancel={jest.fn()} onSuccess={onSuccess} />
    </MemoryRouter>,
  );

  fireEvent.change(screen.getByLabelText('First name'), { target: { value: 'Taylor' } });
  fireEvent.change(screen.getByLabelText('Last name'), { target: { value: 'Lee' } });
  fireEvent.change(screen.getByLabelText('Email'), { target: { value: 'taylor@example.com' } });
  fireEvent.change(screen.getByLabelText('Department ID'), { target: { value: '12' } });
  fireEvent.click(screen.getByRole('button', { name: 'Save employee' }));

  await waitFor(() => expect(onSuccess).toHaveBeenCalledTimes(1));
  expect(global.fetch).toHaveBeenCalledWith(
    'http://localhost:8080/api/v1/employees',
    expect.objectContaining({
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: 'Bearer test-token',
      },
      body: JSON.stringify({
        firstName: 'Taylor',
        lastName: 'Lee',
        email: 'taylor@example.com',
        departmentId: 12,
      }),
    }),
  );
});

test('puts updated employee details to the employee-specific endpoint', async () => {
  const onSuccess = jest.fn();
  global.fetch.mockResolvedValue({ ok: true, status: 200 });
  const employee = {
    id: '31db4e5a-ef45-4d9d-b089-c683d77ce856',
    firstName: 'Taylor',
    lastName: 'Lee',
    employeeNumber: 'EMP-12',
    email: 'taylor@example.com',
    departmentId: 12,
    designationId: 4,
    countryCode: 'USA',
    hireDate: '2024-01-15',
    employmentStatus: 'ACTIVE',
  };

  render(
    <MemoryRouter>
      <AddEmployeeForm employee={employee} onCancel={jest.fn()} onSuccess={onSuccess} />
    </MemoryRouter>,
  );

  expect(screen.getByLabelText('First name')).toHaveValue('Taylor');
  expect(screen.getByLabelText('Department ID')).toHaveValue(12);
  fireEvent.change(screen.getByLabelText('First name'), { target: { value: 'Tay' } });
  fireEvent.click(screen.getByRole('button', { name: 'Save changes' }));

  await waitFor(() => expect(onSuccess).toHaveBeenCalledTimes(1));
  expect(global.fetch).toHaveBeenCalledWith(
    `http://localhost:8080/api/v1/employees/${employee.id}`,
    expect.objectContaining({
      method: 'PUT',
      body: JSON.stringify({
        firstName: 'Tay',
        lastName: 'Lee',
        email: 'taylor@example.com',
        employeeNumber: 'EMP-12',
        countryCode: 'USA',
        hireDate: '2024-01-15',
        employmentStatus: 'ACTIVE',
        departmentId: 12,
        designationId: 4,
      }),
    }),
  );
});

test('shows API errors and leaves the form available for correction', async () => {
  global.fetch.mockResolvedValue({
    ok: false,
    status: 400,
    json: async () => ({ message: 'Employee number already exists.' }),
  });

  render(
    <MemoryRouter>
      <AddEmployeeForm onCancel={jest.fn()} onSuccess={jest.fn()} />
    </MemoryRouter>,
  );

  fireEvent.change(screen.getByLabelText('First name'), { target: { value: 'Taylor' } });
  fireEvent.change(screen.getByLabelText('Last name'), { target: { value: 'Lee' } });
  fireEvent.change(screen.getByLabelText('Email'), { target: { value: 'taylor@example.com' } });
  fireEvent.click(screen.getByRole('button', { name: 'Save employee' }));

  expect(await screen.findByRole('alert')).toHaveTextContent('Employee number already exists.');
  expect(screen.getByLabelText('First name')).toHaveValue('Taylor');
});
