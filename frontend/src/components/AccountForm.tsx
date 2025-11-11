import { FormEvent, ReactNode, useEffect, useMemo, useRef, useState, ChangeEvent } from 'react';
import type { UserRole } from '@/types/user';
import { isPresent, isStrongPassword, isValidEmail } from '@/utils/validators';

const defaultAvatarUrl = '/images/default-avatar.svg';

type AccountFormMode = 'register' | 'edit';

export interface AccountFormSubmitValues {
  full_name: string;
  email: string;
  password?: string;
  avatarFile?: File | null;
  role: UserRole;
}

interface AccountFormProps {
  mode: AccountFormMode;
  title: string;
  subtitle: string;
  initialValues: {
    fullName: string;
    email: string;
    avatarUrl?: string | null;
    role?: UserRole;
  };
  submitLabel: string;
  pendingLabel: string;
  onSubmit: (values: AccountFormSubmitValues) => Promise<void>;
  footerLeft?: ReactNode;
  backButton?: {
    label?: string;
    onClick: () => void;
  };
  enableRoleSelection?: boolean;
}

const AccountForm = ({
  mode,
  title,
  subtitle,
  initialValues,
  submitLabel,
  pendingLabel,
  onSubmit,
  footerLeft,
  backButton,
  enableRoleSelection = false
}: AccountFormProps) => {
  const {
    fullName: initialFullName,
    email: initialEmail,
    avatarUrl: initialAvatarUrl,
    role: initialRole = 'non_admin'
  } = initialValues;
  const normalizedAvatarUrl = initialAvatarUrl || defaultAvatarUrl;

  const [fullName, setFullName] = useState(initialFullName);
  const [email, setEmail] = useState(initialEmail);
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [role, setRole] = useState<UserRole>(initialRole);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreviewUrl, setAvatarPreviewUrl] = useState(normalizedAvatarUrl);
  const [showAvatarModal, setShowAvatarModal] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const avatarObjectUrlRef = useRef<string | null>(null);

  useEffect(() => {
    setFullName(initialFullName);
    setEmail(initialEmail);
    setPassword('');
    setConfirmPassword('');
    setAvatarFile(null);
    if (avatarObjectUrlRef.current) {
      URL.revokeObjectURL(avatarObjectUrlRef.current);
      avatarObjectUrlRef.current = null;
    }
    setAvatarPreviewUrl(normalizedAvatarUrl);
    setRole(initialRole);
  }, [initialFullName, initialEmail, normalizedAvatarUrl, initialRole]);

  useEffect(() => {
    if (!password) {
      setConfirmPassword('');
    }
  }, [password]);

  useEffect(() => () => {
    if (avatarObjectUrlRef.current) {
      URL.revokeObjectURL(avatarObjectUrlRef.current);
    }
  }, []);

  const hasChanges = useMemo(() => {
    if (mode === 'register') {
      return Boolean(fullName || email || password || confirmPassword || avatarFile);
    }

    const nameChanged = fullName !== initialFullName;
    const emailChanged = email !== initialEmail;
    const passwordProvided = Boolean(password);
    const avatarChanged = Boolean(avatarFile);
    const roleChanged = enableRoleSelection && role !== initialRole;
    return nameChanged || emailChanged || passwordProvided || avatarChanged || roleChanged;
  }, [mode, fullName, email, password, confirmPassword, avatarFile, initialFullName, initialEmail, enableRoleSelection, role, initialRole]);

  const validate = () => {
    if (!isPresent(fullName)) return 'Full name is required';
    if (!isValidEmail(email)) return 'A valid email address is required';

    if (mode === 'register') {
      if (!isStrongPassword(password)) return 'Password must contain at least 6 characters';
      if (!isPresent(confirmPassword)) return 'Please confirm your password';
    } else if (password && !isStrongPassword(password)) {
      return 'Password must contain at least 6 characters';
    }

    if (password !== confirmPassword) return 'Passwords do not match';

    if (enableRoleSelection && !role) {
      return 'Role is required';
    }

    return null;
  };

  const openAvatarModal = () => {
    setShowAvatarModal(true);
  };

  const closeAvatarModal = () => {
    setShowAvatarModal(false);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleAvatarFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (avatarObjectUrlRef.current) {
      URL.revokeObjectURL(avatarObjectUrlRef.current);
    }

    const objectUrl = URL.createObjectURL(file);
    avatarObjectUrlRef.current = objectUrl;

    setAvatarFile(file);
    setAvatarPreviewUrl(objectUrl);
    setShowAvatarModal(false);

    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);

    const validationError = validate();
    if (validationError) {
      setError(validationError);
      return;
    }

    setSubmitting(true);
    try {
      const resolvedRole: UserRole = enableRoleSelection ? role : 'non_admin';
      await onSubmit({
        full_name: fullName,
        email,
        password: password || undefined,
        avatarFile: avatarFile || undefined,
        role: resolvedRole
      });
    } catch (exception) {
      setError(
        exception instanceof Error
          ? exception.message
          : 'Unable to save changes'
      );
    } finally {
      setSubmitting(false);
    }
  };

  const renderLeftAction = () => {
    if (backButton) {
      return (
        <button
          type="button"
          className="btn btn-outline-secondary"
          onClick={backButton.onClick}
        >
          {backButton.label ?? 'Back'}
        </button>
      );
    }

    if (footerLeft) {
      return <div className="text-muted small mb-0">{footerLeft}</div>;
    }

    return <span />;
  };

  return (
    <div className="row justify-content-center">
      <div className="col-lg-10 col-xl-9">
        <div className="card shadow-sm border-0">
          <div className="card-body p-4">
            <form onSubmit={handleSubmit} noValidate>
              <div className="profile-editor-layout">
                <div className="profile-editor-content">
                  <h1 className="h3 mb-3">{title}</h1>
                  <p className="text-muted mb-4">{subtitle}</p>

                  {error && (
                    <div className="alert alert-danger" role="alert">
                      {error}
                    </div>
                  )}

                  <div className="mb-3">
                    <label htmlFor="account-form-full-name" className="form-label">
                      Full name
                    </label>
                    <input
                      id="account-form-full-name"
                      type="text"
                      className="form-control"
                      value={fullName}
                      onChange={(event) => setFullName(event.target.value)}
                      required
                    />
                  </div>

                  <div className="mb-3">
                    <label htmlFor="account-form-email" className="form-label">
                      Email
                    </label>
                    <input
                      id="account-form-email"
                      type="email"
                      className="form-control"
                      value={email}
                      onChange={(event) => setEmail(event.target.value)}
                      required
                      autoComplete="email"
                    />
                  </div>

                  {enableRoleSelection && (
                    <div className="mb-3">
                      <label htmlFor="account-form-role" className="form-label">
                        Role
                      </label>
                      <select
                        id="account-form-role"
                        className="form-select"
                        value={role}
                        onChange={(event) => setRole(event.target.value as UserRole)}
                      >
                        <option value="admin">Admin</option>
                        <option value="non_admin">User</option>
                      </select>
                    </div>
                  )}

                  <div className="mb-3">
                    <label htmlFor="account-form-password" className="form-label">
                      {mode === 'register' ? 'Password' : 'New password'}
                    </label>
                    <input
                      id="account-form-password"
                      type="password"
                      className="form-control"
                      value={password}
                      onChange={(event) => setPassword(event.target.value)}
                      autoComplete="new-password"
                      minLength={6}
                      placeholder={mode === 'edit' ? 'Leave blank to keep current password' : undefined}
                      required={mode === 'register'}
                    />
                  </div>

                  <div className="mb-3">
                    <label htmlFor="account-form-password-confirm" className="form-label">
                      Confirm password
                    </label>
                    <input
                      id="account-form-password-confirm"
                      type="password"
                      className="form-control"
                      value={confirmPassword}
                      onChange={(event) => setConfirmPassword(event.target.value)}
                      autoComplete="new-password"
                      minLength={6}
                      disabled={!password}
                      required={mode === 'register'}
                    />
                  </div>
                </div>

                <div className="profile-editor-sidebar">
                  <h2 className="h5 mb-3">Profile photo</h2>
                  <div
                    className="avatar-edit-wrapper"
                    role="button"
                    tabIndex={0}
                    onClick={openAvatarModal}
                    onKeyDown={(event) => {
                      if (event.key === 'Enter' || event.key === ' ') {
                        event.preventDefault();
                        openAvatarModal();
                      }
                    }}
                  >
                    <img
                      src={avatarPreviewUrl}
                      alt={fullName || 'User avatar'}
                      className="rounded-circle border shadow-sm register-avatar-preview"
                    />
                    <div className="avatar-edit-overlay">
                      <span>Click to upload a photo</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="profile-editor-actions d-flex justify-content-between align-items-center mt-4">
                {renderLeftAction()}
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={submitting || !hasChanges}
                >
                  {submitting ? pendingLabel : submitLabel}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>

      {showAvatarModal && (
        <div className="profile-avatar-modal-backdrop" role="dialog" aria-modal="true">
          <div className="profile-avatar-modal">
            <h2 className="h5 mb-3">Upload a profile photo</h2>
            <p className="text-muted mb-3">
              Select an image from your device. You can change it later at any time.
            </p>

            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="form-control"
              onChange={handleAvatarFileChange}
            />

            <div className="d-flex justify-content-end gap-2 mt-4">
              <button type="button" className="btn btn-primary" onClick={closeAvatarModal}>
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AccountForm;
