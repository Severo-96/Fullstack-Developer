import { describe, expect, it, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import AccountForm from '../AccountForm';

describe('AccountForm', () => {
  it('submits register form with valid data', async () => {
    const onSubmit = vi.fn().mockResolvedValue(undefined);

    render(
      <AccountForm
        mode="register"
        title="Register"
        subtitle="Create account"
        initialValues={{ fullName: '', email: '', avatarUrl: null }}
        submitLabel="Create"
        pendingLabel="Creating..."
        onSubmit={onSubmit}
      />
    );

    const user = userEvent.setup();

    await user.type(screen.getByLabelText(/full name/i), 'Alice Example');
    await user.type(screen.getByLabelText(/^email/i), 'alice@example.com');
    await user.type(screen.getByLabelText(/^password$/i), 'password123');
    await user.type(screen.getByLabelText(/confirm password/i), 'password123');

    const submitButton = screen.getByRole('button', { name: /create/i });
    expect(submitButton).not.toBeDisabled();

    await user.click(submitButton);

    await waitFor(() =>
      expect(onSubmit).toHaveBeenCalledWith({
        full_name: 'Alice Example',
        email: 'alice@example.com',
        password: 'password123',
        avatarFile: undefined,
        role: 'non_admin'
      })
    );
  });

  it('prevents submission when passwords do not match', async () => {
    const onSubmit = vi.fn();

    render(
      <AccountForm
        mode="register"
        title="Register"
        subtitle="Create account"
        initialValues={{ fullName: '', email: '', avatarUrl: null }}
        submitLabel="Create"
        pendingLabel="Creating..."
        onSubmit={onSubmit}
      />
    );

    const user = userEvent.setup();

    await user.type(screen.getByLabelText(/full name/i), 'Bob');
    await user.type(screen.getByLabelText(/^email/i), 'bob@example.com');
    await user.type(screen.getByLabelText(/^password$/i), 'password123');
    await user.type(screen.getByLabelText(/confirm password/i), 'different');

    await user.click(screen.getByRole('button', { name: /create/i }));

    expect(onSubmit).not.toHaveBeenCalled();
    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Passwords do not match'
    );
  });

  it('allows role selection in edit mode', async () => {
    const onSubmit = vi.fn().mockResolvedValue(undefined);

    render(
      <AccountForm
        mode="edit"
        title="Edit"
        subtitle="Edit account"
        initialValues={{
          fullName: 'Existing',
          email: 'existing@example.com',
          avatarUrl: null,
          role: 'admin'
        }}
        submitLabel="Save"
        pendingLabel="Saving..."
        enableRoleSelection
        onSubmit={onSubmit}
      />
    );

    const user = userEvent.setup();
    const select = screen.getByLabelText(/role/i);
    expect(select).toHaveValue('admin');

    await user.selectOptions(select, 'non_admin');
    await user.click(screen.getByRole('button', { name: /save/i }));

    expect(onSubmit).toHaveBeenCalledWith(
      expect.objectContaining({
        role: 'non_admin'
      })
    );
  });
});

