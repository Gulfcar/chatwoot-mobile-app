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
 * Administrators keep full visibility; agents see masked numbers.
 * Falls back to masking when the role cannot be resolved.
 */
export const shouldMaskContactNumbers = (user: User | null, accountId: number | null): boolean => {
  if (!user) {
    return true;
  }

  return getCurrentAccount(user, accountId)?.role !== 'administrator';
};
