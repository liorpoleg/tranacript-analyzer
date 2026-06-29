import { describe, it, expect } from 'vitest';
import { formatDate, formatRelative, formatDuration } from './formatDate';

describe('formatDate', () => {
  it('formats a valid ISO date string', () => {
    expect(formatDate('2024-03-15')).toBe('Mar 15, 2024');
  });

  it('returns em-dash for null', () => {
    expect(formatDate(null)).toBe('—');
  });

  it('returns em-dash for undefined', () => {
    expect(formatDate(undefined)).toBe('—');
  });

  it('returns em-dash for empty string', () => {
    expect(formatDate('')).toBe('—');
  });

  it('accepts a custom format string', () => {
    expect(formatDate('2024-01-05', 'yyyy/MM/dd')).toBe('2024/01/05');
  });

  it('returns original value on invalid date string', () => {
    expect(formatDate('not-a-date')).toBe('not-a-date');
  });
});

describe('formatRelative', () => {
  it('returns em-dash for null', () => {
    expect(formatRelative(null)).toBe('—');
  });

  it('returns em-dash for undefined', () => {
    expect(formatRelative(undefined)).toBe('—');
  });

  it('returns a non-empty string for a valid ISO date', () => {
    const result = formatRelative('2020-01-01T00:00:00Z');
    expect(typeof result).toBe('string');
    expect(result.length).toBeGreaterThan(0);
    expect(result).not.toBe('—');
  });
});

describe('formatDuration', () => {
  it('returns em-dash for null', () => {
    expect(formatDuration(null)).toBe('—');
  });

  it('returns em-dash for undefined', () => {
    expect(formatDuration(undefined)).toBe('—');
  });

  it('formats seconds under 60', () => {
    expect(formatDuration(45)).toBe('45s');
  });

  it('formats exactly 60 seconds as 1m 0s', () => {
    expect(formatDuration(60)).toBe('1m 0s');
  });

  it('formats seconds over 60', () => {
    expect(formatDuration(125)).toBe('2m 5s');
  });

  it('formats zero seconds', () => {
    expect(formatDuration(0)).toBe('0s');
  });
});
