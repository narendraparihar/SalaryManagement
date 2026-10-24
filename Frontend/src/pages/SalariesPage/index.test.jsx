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
