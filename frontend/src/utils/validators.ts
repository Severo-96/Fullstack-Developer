const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export const isValidEmail = (value: string) => EMAIL_REGEX.test(value);

export const isStrongPassword = (value: string) => value.length >= 6;

export const isPresent = (value: string | undefined | null) =>
  Boolean(value && value.trim().length > 0);

