import { maskPhoneNumber, shouldMaskContactNumbers } from '@/utils/privacyUtils';
import type { User } from '@/types/User';

const buildUser = (role: string): User =>
  ({
    id: 1,
    account_id: 7,
    accounts: [{ id: 7, role } as never],
  }) as unknown as User;

describe('maskPhoneNumber', () => {
  it('keeps the country code and the last digits', () => {
    expect(maskPhoneNumber('+966505822507')).toBe('+966••••••507');
  });

  it('masks every character of a number too short to split', () => {
    expect(maskPhoneNumber('12345')).toBe('•••••');
  });

  it('returns an empty string for missing values', () => {
    expect(maskPhoneNumber(undefined)).toBe('');
    expect(maskPhoneNumber(null)).toBe('');
    expect(maskPhoneNumber('   ')).toBe('');
  });

  it('never leaks more than the visible ends', () => {
    const masked = maskPhoneNumber('+966545025873');
    expect(masked).not.toContain('5450');
    expect(masked.startsWith('+966')).toBe(true);
    expect(masked.endsWith('873')).toBe(true);
  });
});

describe('shouldMaskContactNumbers', () => {
  it('does not mask for administrators', () => {
    expect(shouldMaskContactNumbers(buildUser('administrator'), 7)).toBe(false);
  });

  it('masks for agents', () => {
    expect(shouldMaskContactNumbers(buildUser('agent'), 7)).toBe(true);
  });

  it('masks when the account cannot be resolved', () => {
    expect(shouldMaskContactNumbers(buildUser('administrator'), 99)).toBe(true);
    expect(shouldMaskContactNumbers(null, 7)).toBe(true);
  });
});
