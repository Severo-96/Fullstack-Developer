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
        title="Criar conta"
        subtitle="Preencha os dados para se cadastrar"
        initialValues={{ fullName: '', email: '', avatarUrl: null }}
        submitLabel="Criar conta"
        pendingLabel="Criando..."
        onSubmit={onSubmit}
      />
    );

    const user = userEvent.setup();

    await user.type(screen.getByLabelText(/nome completo/i), 'Alice Example');
    await user.type(screen.getByLabelText(/^e-mail/i), 'alice@example.com');
    await user.type(screen.getByLabelText(/^senha$/i), 'password123');
    await user.type(screen.getByLabelText(/confirmar senha/i), 'password123');

    const submitButton = screen.getByRole('button', { name: /criar conta/i });
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
        title="Criar conta"
        subtitle="Preencha os dados para se cadastrar"
        initialValues={{ fullName: '', email: '', avatarUrl: null }}
        submitLabel="Criar conta"
        pendingLabel="Criando..."
        onSubmit={onSubmit}
      />
    );

    const user = userEvent.setup();

    await user.type(screen.getByLabelText(/nome completo/i), 'Bob');
    await user.type(screen.getByLabelText(/^e-mail/i), 'bob@example.com');
    await user.type(screen.getByLabelText(/^senha$/i), 'password123');
    await user.type(screen.getByLabelText(/confirmar senha/i), 'different');

    await user.click(screen.getByRole('button', { name: /criar conta/i }));

    expect(onSubmit).not.toHaveBeenCalled();
    expect(await screen.findByRole('alert')).toHaveTextContent(
      'As senhas não coincidem'
    );
  });

  it('allows role selection in edit mode', async () => {
    const onSubmit = vi.fn().mockResolvedValue(undefined);

    render(
      <AccountForm
        mode="edit"
        title="Editar usuário"
        subtitle="Atualize os dados da conta"
        initialValues={{
          fullName: 'Existing',
          email: 'existing@example.com',
          avatarUrl: null,
          role: 'admin'
        }}
        submitLabel="Salvar"
        pendingLabel="Salvando..."
        enableRoleSelection
        onSubmit={onSubmit}
      />
    );

    const user = userEvent.setup();
    const select = screen.getByLabelText(/função/i);
    expect(select).toHaveValue('admin');

    await user.selectOptions(select, 'non_admin');
    await user.click(screen.getByRole('button', { name: /salvar/i }));

    expect(onSubmit).toHaveBeenCalledWith(
      expect.objectContaining({
        role: 'non_admin'
      })
    );
  });
});

