import { getCurrentAccount } from '@/utils/permissionUtils';
import type { User } from '@/types/User';

const VISIBLE_LEADING = 4;
const VISIBLE_TRAILING = 3;
const MASK_CHARACTER = '•';

/**
 * Masks the middle of a phone number, keeping enough of the country code and
 * the final digits for an agent to tell two contacts apart.
 *
 * This hides the number in the interface only. The value still arrives from
 * the API and lives in the store, so it is a shoulder-surfing and screenshot
 * measure, not access control - restricting it properly belongs on the server.
 */
export const maskPhoneNumber = (phoneNumber?: string | null): string => {
  const value = (phoneNumber || '').trim();

  if (!value) {
    return '';
  }

  if (value.length <= VISIBLE_LEADING + VISIBLE_TRAILING) {
    // Too short to reveal both ends without showing most of it.
    return MASK_CHARACTER.repeat(value.length);
  }

  const leading = value.slice(0, VISIBLE_LEADING);
  const trailing = value.slice(-VISIBLE_TRAILING);
  const hiddenLength = value.length - VISIBLE_LEADING - VISIBLE_TRAILING;

  return `${leading}${MASK_CHARACTER.repeat(hiddenLength)}${trailing}`;
};

/**
 * Chatwoot stores a contact's phone number in `name` when the contact has no
 * name of its own, so the conversation list and chat header can show a raw
 * number even though they never read the phone field. Treat a name that is
 * only digits and phone punctuation as a number.
 */
const PHONE_LIKE = /^\+?[0-9][0-9\s\-().]{5,}$/;

export const looksLikePhoneNumber = (value?: string | null): boolean =>
  PHONE_LIKE.test((value || '').trim());

/** Masks a contact name only when the name is itself a phone number. */
export const maskContactName = (name?: string | null, shouldMask = true): string => {
  const value = (name || '').trim();

  if (!shouldMask || !looksLikePhoneNumber(value)) {
    return name || '';
  }

  return maskPhoneNumber(value);
};

/**
 * Administrators keep full visibility; agents see masked numbers.
 * Falls back to masking when the role cannot be resolved.
 */
export const shouldMaskContactNumbers = (user: User | null, accountId: number | null): boolean => {
  if (!user) {
    return true;
  }

  return getCurrentAccount(user, accountId)?.role !== 'administrator';
};
