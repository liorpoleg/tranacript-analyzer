import { describe, it, expect } from 'vitest';
import { JOB_STATUS, TERMINAL_STATUSES, STATUS_COLORS, JOB_TYPE_LABELS } from './jobStatus';

describe('JOB_STATUS', () => {
  it('defines all five statuses', () => {
    expect(JOB_STATUS.PENDING).toBe('pending');
    expect(JOB_STATUS.RUNNING).toBe('running');
    expect(JOB_STATUS.COMPLETED).toBe('completed');
    expect(JOB_STATUS.FAILED).toBe('failed');
    expect(JOB_STATUS.STOPPED).toBe('stopped');
  });
});

describe('TERMINAL_STATUSES', () => {
  it('contains completed, failed, and stopped', () => {
    expect(TERMINAL_STATUSES.has('completed')).toBe(true);
    expect(TERMINAL_STATUSES.has('failed')).toBe(true);
    expect(TERMINAL_STATUSES.has('stopped')).toBe(true);
  });

  it('does not contain pending or running', () => {
    expect(TERMINAL_STATUSES.has('pending')).toBe(false);
    expect(TERMINAL_STATUSES.has('running')).toBe(false);
  });
});

describe('STATUS_COLORS', () => {
  it('has an entry for every JOB_STATUS value', () => {
    for (const status of Object.values(JOB_STATUS)) {
      expect(STATUS_COLORS[status]).toBeDefined();
      expect(STATUS_COLORS[status].bg).toBeDefined();
      expect(STATUS_COLORS[status].color).toBeDefined();
    }
  });

  it('each color entry is a non-empty string', () => {
    for (const { bg, color } of Object.values(STATUS_COLORS)) {
      expect(typeof bg).toBe('string');
      expect(bg.length).toBeGreaterThan(0);
      expect(typeof color).toBe('string');
      expect(color.length).toBeGreaterThan(0);
    }
  });
});

describe('JOB_TYPE_LABELS', () => {
  it('maps translate to a human-readable label', () => {
    expect(typeof JOB_TYPE_LABELS.translate).toBe('string');
    expect(JOB_TYPE_LABELS.translate.length).toBeGreaterThan(0);
  });

  it('maps summarize to a human-readable label', () => {
    expect(typeof JOB_TYPE_LABELS.summarize).toBe('string');
  });

  it('maps contextual_summary to a human-readable label', () => {
    expect(typeof JOB_TYPE_LABELS.contextual_summary).toBe('string');
  });
});
