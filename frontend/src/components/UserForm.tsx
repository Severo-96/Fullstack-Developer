import { FormEvent, useEffect, useState } from 'react';
import type { User, UserRole } from '@/types/user';
import { isPresent, isStrongPassword, isValidEmail } from '@/utils/validators';

export interface UserFormValues {
  full_name: string;
  email: string;
  password?: string;
  role: UserRole;
  avatarFile?: File | null;
  avatarUrl?: string;
}

interface UserFormProps {
  initialUser?: User | null;
  submitLabel: string;
  submitting: boolean;
  onSubmit: (values: UserFormValues) => Promise<void>;
  onCancel: () => void;
}

type AvatarMode = 'file' | 'url';

const defaultState = {
  full_name: '',
  email: '',
  password: '',
  role: 'non_admin' as UserRole,
  avatarFile: null as File | null,
  avatarUrl: ''
};

const UserForm = ({
  initialUser,
  submitLabel,
  submitting,
  onSubmit,
  onCancel
}: UserFormProps) => {
  const [formValues, setFormValues] = useState(defaultState);
  const [avatarMode, setAvatarMode] = useState<AvatarMode>('file');
  const [errors, setErrors] = useState<string[]>([]);

  useEffect(() => {
    if (initialUser) {
      setFormValues({
        full_name: initialUser.full_name,
        email: initialUser.email,
        password: '',
        role: initialUser.role,
        avatarFile: null,
        avatarUrl: ''
      });
    } else {
      setFormValues(defaultState);
    }

    setErrors([]);
    setAvatarMode('file');
  }, [initialUser]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const validationErrors = validateForm();

    if (validationErrors.length > 0) {
      setErrors(validationErrors);
      return;
    }

    setErrors([]);
    await onSubmit({
      full_name: formValues.full_name.trim(),
      email: formValues.email.trim(),
      password: formValues.password?.trim() || undefined,
      role: formValues.role,
      avatarFile: avatarMode === 'file' ? formValues.avatarFile : undefined,
      avatarUrl:
        avatarMode === 'url' ? formValues.avatarUrl?.trim() || undefined : undefined
    });
  };

  const validateForm = () => {
    const validationErrors: string[] = [];

    if (!isPresent(formValues.full_name)) {
      validationErrors.push('Full name is required');
    }

    if (!isValidEmail(formValues.email)) {
      validationErrors.push('A valid email address is required');
    }

    if (!initialUser && !isStrongPassword(formValues.password || '')) {
      validationErrors.push('Password must have at least 6 characters');
    }

    if (avatarMode === 'url' && !isPresent(formValues.avatarUrl)) {
      validationErrors.push('Avatar URL cannot be empty');
    }

    return validationErrors;
  };

  return (
    <form onSubmit={handleSubmit} noValidate>
      <div className="row g-3">
        <div className="col-md-6">
          <label htmlFor="full_name" className="form-label">
            Full name
          </label>
          <input
            id="full_name"
            name="full_name"
            type="text"
            className="form-control"
            value={formValues.full_name}
            onChange={(event) =>
              setFormValues((prev) => ({
                ...prev,
                full_name: event.target.value
              }))
            }
            required
          />
        </div>

        <div className="col-md-6">
          <label htmlFor="email" className="form-label">
            Email
          </label>
          <input
            id="email"
            name="email"
            type="email"
            className="form-control"
            value={formValues.email}
            onChange={(event) =>
              setFormValues((prev) => ({ ...prev, email: event.target.value }))
            }
            required
          />
        </div>

        <div className="col-md-6">
          <label htmlFor="password" className="form-label">
            Password
          </label>
          <input
            id="password"
            name="password"
            type="password"
            placeholder={initialUser ? 'Leave blank to keep current password' : ''}
            className="form-control"
            value={formValues.password}
            onChange={(event) =>
              setFormValues((prev) => ({
                ...prev,
                password: event.target.value
              }))
            }
            minLength={6}
          />
        </div>

        <div className="col-md-6">
          <label htmlFor="role" className="form-label">
            Role
          </label>
          <select
            id="role"
            name="role"
            className="form-select"
            value={formValues.role}
            onChange={(event) =>
              setFormValues((prev) => ({
                ...prev,
                role: event.target.value as UserRole
              }))
            }
          >
            <option value="admin">Admin</option>
            <option value="non_admin">User</option>
          </select>
        </div>

        <div className="col-md-12">
          <label className="form-label">Avatar</label>
          <div className="btn-group mb-2" role="group" aria-label="Avatar mode">
            <input
              type="radio"
              className="btn-check"
              name="avatar-mode"
              id="avatar-mode-file"
              checked={avatarMode === 'file'}
              onChange={() => setAvatarMode('file')}
            />
            <label className="btn btn-outline-primary" htmlFor="avatar-mode-file">
              Upload file
            </label>
            <input
              type="radio"
              className="btn-check"
              name="avatar-mode"
              id="avatar-mode-url"
              checked={avatarMode === 'url'}
              onChange={() => setAvatarMode('url')}
            />
            <label className="btn btn-outline-primary" htmlFor="avatar-mode-url">
              Use URL
            </label>
          </div>

          {avatarMode === 'file' ? (
            <input
              type="file"
              className="form-control"
              accept="image/*"
              onChange={(event) =>
                setFormValues((prev) => ({
                  ...prev,
                  avatarFile: event.target.files?.item(0) ?? null
                }))
              }
            />
          ) : (
            <input
              type="url"
              className="form-control"
              placeholder="https://example.com/avatar.png"
              value={formValues.avatarUrl}
              onChange={(event) =>
                setFormValues((prev) => ({
                  ...prev,
                  avatarUrl: event.target.value
                }))
              }
              required
            />
          )}
        </div>

        {errors.length > 0 && (
          <div className="col-12">
            <div className="alert alert-danger" role="alert">
              <ul className="mb-0 ps-3">
                {errors.map((error) => (
                  <li key={error}>{error}</li>
                ))}
              </ul>
            </div>
          </div>
        )}

        <div className="col-12 d-flex justify-content-end gap-2">
          <button
            type="button"
            className="btn btn-outline-secondary"
            onClick={onCancel}
            disabled={submitting}
          >
            Cancel
          </button>
          <button
            type="submit"
            className="btn btn-primary"
            disabled={submitting}
          >
            {submitting ? 'Saving...' : submitLabel}
          </button>
        </div>
      </div>
    </form>
  );
};

export default UserForm;

