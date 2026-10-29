import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import SalariesPage from './index';

const salary = {
  id: 'salary-123',
  name: 'Alex North',
  amount: 50000,
  currency: 'USD',
  effectiveFrom: '2025-01-01',
  effectiveTo: null,
  createdBy: 'admin@example.com',
};

function paginatedSalaries(amount) {
  return {
    content: [{ ...salary, amount }],
    totalElements: 1,
    totalPages: 1,
    number: 0,
    size: 10,
    first: true,
    last: true,
  };
}

beforeEach(() => {
  window.localStorage.setItem('accessToken', 'test-token');
  global.fetch = jest.fn()
    .mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => paginatedSalaries(50000),
    })
    .mockResolvedValueOnce({ ok: true, status: 200 })
    .mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => paginatedSalaries(62500),
    });
});

test('edits a salary through the PATCH endpoint and reloads the row', async () => {
  render(
    <MemoryRouter>
      <SalariesPage />
    </MemoryRouter>,
  );

  fireEvent.click(await screen.findByRole('button', { name: 'Edit salary for Alex North' }));
  fireEvent.change(screen.getByRole('spinbutton', { name: 'Annual salary for Alex North' }), {
    target: { value: '62500' },
  });
  fireEvent.click(screen.getByRole('button', { name: 'Save' }));

  await waitFor(() => {
    expect(global.fetch).toHaveBeenCalledWith(
      'http://localhost:8080/api/v1/salaries/salary-123',
      expect.objectContaining({
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: 'Bearer test-token',
        },
        body: JSON.stringify({
          amount: 62500,
          currency: 'USD',
          effectiveFrom: '2025-01-01',
        }),
      }),
    );
  });

  expect(await screen.findByText('$62,500.00')).toBeInTheDocument();
});

test('verifies a typed employee ID before creating a salary', async () => {
  const employee = {
    id: '6d3c7db1-9ac8-4f37-89bd-784bededab01',
    firstName: 'Taylor',
    lastName: 'Lee',
  };
  global.fetch = jest.fn()
    .mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => paginatedSalaries(50000),
    })
    .mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => employee,
    })
    .mockResolvedValueOnce({ ok: true, status: 201 })
    .mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => paginatedSalaries(62500),
    });

  render(
    <MemoryRouter>
      <SalariesPage />
    </MemoryRouter>,
  );

  fireEvent.click(screen.getByRole('button', { name: 'Add salary' }));
  expect(screen.queryByRole('spinbutton', { name: 'Annual salary' })).not.toBeInTheDocument();
  expect(screen.queryByRole('textbox', { name: 'Currency' })).not.toBeInTheDocument();
  expect(screen.queryByLabelText('Effective from')).not.toBeInTheDocument();
  fireEvent.change(screen.getByRole('textbox', { name: 'Employee ID' }), {
    target: { value: employee.id },
  });
  fireEvent.click(screen.getByRole('button', { name: 'Verify' }));
  expect(await screen.findByRole('status')).toHaveTextContent('Employee ID verified.');
  expect(screen.getByRole('spinbutton', { name: 'Annual salary' })).toBeInTheDocument();
  expect(screen.getByRole('textbox', { name: 'Currency' })).toBeInTheDocument();
  expect(screen.getByLabelText('Effective from')).toBeInTheDocument();
  expect(screen.queryByRole('combobox', { name: 'Employee' })).not.toBeInTheDocument();

  fireEvent.change(screen.getByRole('spinbutton', { name: 'Annual salary' }), {
    target: { value: '62500' },
  });
  fireEvent.change(screen.getByRole('textbox', { name: 'Currency' }), {
    target: { value: 'USD' },
  });
  fireEvent.change(screen.getByLabelText('Effective from'), {
    target: { value: '2025-01-01' },
  });
  fireEvent.click(screen.getByRole('button', { name: 'Save salary' }));

  await waitFor(() => {
    expect(global.fetch).toHaveBeenCalledWith(
      `http://localhost:8080/api/v1/employees/${employee.id}`,
      expect.any(Object),
    );
    expect(global.fetch).toHaveBeenCalledWith(
      `http://localhost:8080/api/v1/employees/${employee.id}/salaries`,
      expect.objectContaining({
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: 'Bearer test-token',
        },
        body: JSON.stringify({
          amount: 62500,
          currency: 'USD',
          effectiveFrom: '2025-01-01',
        }),
      }),
    );
  });

  expect(await screen.findByText('$62,500.00')).toBeInTheDocument();
  expect(screen.queryByRole('heading', { name: 'Add salary' })).not.toBeInTheDocument();
});

test('shows an employee-specific error when the selected employee does not exist', async () => {
  const employee = {
    id: '6d3c7db1-9ac8-4f37-89bd-784bededab01',
    firstName: 'Taylor',
    lastName: 'Lee',
  };
  global.fetch = jest.fn()
    .mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => paginatedSalaries(50000),
    })
    .mockResolvedValueOnce({ ok: false, status: 404 });

  render(
    <MemoryRouter>
      <SalariesPage />
    </MemoryRouter>,
  );

  fireEvent.click(screen.getByRole('button', { name: 'Add salary' }));
  fireEvent.change(screen.getByRole('textbox', { name: 'Employee ID' }), {
    target: { value: employee.id },
  });
  fireEvent.click(screen.getByRole('button', { name: 'Verify' }));

  expect(await screen.findByText('The employee ID does not exist.')).toBeInTheDocument();
  expect(screen.getByRole('textbox', { name: 'Employee ID' })).toHaveAttribute('aria-invalid', 'true');
  expect(screen.queryByRole('spinbutton', { name: 'Annual salary' })).not.toBeInTheDocument();
  expect(screen.queryByRole('textbox', { name: 'Currency' })).not.toBeInTheDocument();
  expect(global.fetch).toHaveBeenCalledTimes(2);
});
