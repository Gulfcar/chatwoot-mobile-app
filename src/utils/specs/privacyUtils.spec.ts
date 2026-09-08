import {
  looksLikePhoneNumber,
  maskContactName,
  maskPhoneNumber,
  shouldMaskContactNumbers,
} from '@/utils/privacyUtils';
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

describe('maskContactName', () => {
  it('leaves a real name alone', () => {
    expect(maskContactName('Eman AlShahrani', true)).toBe('Eman AlShahrani');
    expect(maskContactName('عبدالمجيد السعيد', true)).toBe('عبدالمجيد السعيد');
  });

  it('masks a name that is really a phone number', () => {
    expect(maskContactName('+966505822507', true)).toBe('+966••••••507');
    expect(maskContactName('0505822507', true)).toBe('0505•••507');
  });

  it('handles numbers written with spaces', () => {
    expect(maskContactName('+44 7725 678698', true)).not.toContain('7725');
  });

  it('does not mask when masking is off', () => {
    expect(maskContactName('+966505822507', false)).toBe('+966505822507');
  });

  it('returns an empty string for missing names', () => {
    expect(maskContactName(undefined, true)).toBe('');
    expect(maskContactName(null, true)).toBe('');
  });
});

describe('looksLikePhoneNumber', () => {
  it.each(['+966505822507', '966505822507', '0505822507', '+44 7725 678698'])('detects %s', value =>
    expect(looksLikePhoneNumber(value)).toBe(true),
  );

  it.each(['Eman AlShahrani', 'MAS', '#1204', 'عبدالمجيد السعيد', ''])('does not flag %s', value =>
    expect(looksLikePhoneNumber(value)).toBe(false),
  );
});
