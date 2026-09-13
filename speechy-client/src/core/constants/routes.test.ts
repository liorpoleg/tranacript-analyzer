import { describe, it, expect } from 'vitest';
import { ROUTES, buildRoute } from './routes';

describe('ROUTES', () => {
  it('LOGIN resolves to /login', () => {
    expect(ROUTES.LOGIN).toBe('/login');
  });

  it('DASHBOARD resolves to /dashboard', () => {
    expect(ROUTES.DASHBOARD).toBe('/dashboard');
  });

  it('all route values are non-empty strings starting with /', () => {
    for (const [, value] of Object.entries(ROUTES)) {
      expect(typeof value).toBe('string');
      expect(value.startsWith('/')).toBe(true);
    }
  });
});

describe('buildRoute', () => {
  it('show builds correct URL', () => {
    expect(buildRoute.show('abc-123')).toBe('/shows/abc-123');
  });

  it('showSummaryTable builds correct URL', () => {
    expect(buildRoute.showSummaryTable('abc-123')).toBe('/shows/abc-123/summary-table');
  });

  it('season builds correct URL', () => {
    expect(buildRoute.season('s-1')).toBe('/seasons/s-1');
  });

  it('episode builds correct URL', () => {
    expect(buildRoute.episode('ep-42')).toBe('/episodes/ep-42');
  });

  it('job builds correct URL', () => {
    expect(buildRoute.job('job-99')).toBe('/jobs/job-99');
  });

  it('returns different URLs for different IDs', () => {
    expect(buildRoute.show('a')).not.toBe(buildRoute.show('b'));
  });
});
