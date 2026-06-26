import { Role, Agreement, ValidationError } from './types';

export function validateGameTitle(title: string): ValidationError[] {
  const errors: ValidationError[] = [];
  const trimmed = title.trim();
  if (!trimmed) {
    errors.push({ field: 'title', message: 'Game title is required' });
  } else if (trimmed.length > 120) {
    errors.push({ field: 'title', message: 'Title must be 120 characters or fewer' });
  }
  return errors;
}

export function validateRoleSelection(templateId: string, playerName?: string): ValidationError[] {
  const errors: ValidationError[] = [];
  if (!templateId?.trim()) {
    errors.push({ field: 'templateId', message: 'Please select a role' });
  }
  if (playerName && playerName.length > 100) {
    errors.push({ field: 'playerName', message: 'Display name must be 100 characters or fewer' });
  }
  return errors;
}

export function validateAgreementTerms(
  partyRoleIds: string[],
  commitments: Record<string, string>,
  notes: string
): ValidationError[] {
  const errors: ValidationError[] = [];

  if (partyRoleIds.length < 2) {
    errors.push({
      field: 'parties',
      message: 'Select at least one other role to form an agreement.',
    });
  }

  for (const roleId of partyRoleIds) {
    if (!commitments[roleId]?.trim()) {
      errors.push({
        field: `commitment-${roleId}`,
        message: 'Each party must describe what they are offering.',
      });
    }
  }

  if (!notes?.trim()) {
    errors.push({
      field: 'notes',
      message: 'Describe the combined effect when all offers are fulfilled.',
    });
  }

  return errors;
}

export function validateAgreement(agreement: Partial<Agreement>): ValidationError[] {
  const errors: ValidationError[] = [];
  const partyRoleIds = agreement.partyRoleIds ?? [];

  if (partyRoleIds.length < 2) {
    errors.push({ field: 'partyRoleIds', message: 'At least two parties are required' });
  }

  if (new Set(partyRoleIds).size !== partyRoleIds.length) {
    errors.push({ field: 'partyRoleIds', message: 'Duplicate parties are not allowed' });
  }

  if (!agreement.versions || agreement.versions.length === 0) {
    errors.push({ field: 'versions', message: 'Agreement must have at least one version' });
    return errors;
  }

  const currentVersion = agreement.versions[agreement.currentVersion ?? 0];
  if (!currentVersion) {
    errors.push({ field: 'currentVersion', message: 'Invalid current version' });
    return errors;
  }

  errors.push(
    ...validateAgreementTerms(partyRoleIds, currentVersion.commitments, currentVersion.notes)
  );

  return errors;
}

export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

export function validateMagicLinkEmail(email: string): ValidationError[] {
  const errors: ValidationError[] = [];
  if (!email.trim()) {
    errors.push({ field: 'email', message: 'Email is required' });
  } else if (!isValidEmail(email.trim())) {
    errors.push({ field: 'email', message: 'Please enter a valid email address' });
  }
  return errors;
}

export function validateSignIn(email: string, password: string): ValidationError[] {
  const errors: ValidationError[] = [];

  if (!email.trim()) {
    errors.push({ field: 'email', message: 'Email is required' });
  } else if (!isValidEmail(email)) {
    errors.push({ field: 'email', message: 'Please enter a valid email address' });
  }

  if (!password) {
    errors.push({ field: 'password', message: 'Password is required' });
  }

  return errors;
}

export function validateSignUp(email: string, password: string, confirmPassword: string): ValidationError[] {
  const errors: ValidationError[] = [];

  if (!email.trim()) {
    errors.push({ field: 'email', message: 'Email is required' });
  } else if (!isValidEmail(email)) {
    errors.push({ field: 'email', message: 'Please enter a valid email address' });
  }

  if (!password) {
    errors.push({ field: 'password', message: 'Password is required' });
  } else if (password.length < 6) {
    errors.push({ field: 'password', message: 'Password must be at least 6 characters' });
  }

  if (!confirmPassword) {
    errors.push({ field: 'confirmPassword', message: 'Please confirm your password' });
  } else if (password !== confirmPassword) {
    errors.push({ field: 'confirmPassword', message: 'Passwords do not match' });
  }

  return errors;
}
