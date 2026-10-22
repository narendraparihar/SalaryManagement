import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import AddEmployeeForm from './AddEmployeeForm';

beforeEach(() => {
  window.localStorage.setItem('accessToken', 'test-token');
  global.fetch = jest.fn();
});

afterEach(() => {
  jest.clearAllMocks();
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
