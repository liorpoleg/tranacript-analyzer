import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import StatusBadge from './StatusBadge';
import type { JobStatus } from '@/core/types';

describe('StatusBadge', () => {
  it('renders the status text', () => {
    render(<StatusBadge status="completed" />);
    expect(screen.getByText('completed')).toBeInTheDocument();
  });

  it('renders pending status', () => {
    render(<StatusBadge status="pending" />);
    expect(screen.getByText('pending')).toBeInTheDocument();
  });

  it('renders running status', () => {
    render(<StatusBadge status="running" />);
    expect(screen.getByText('running')).toBeInTheDocument();
  });

  it('renders failed status', () => {
    render(<StatusBadge status="failed" />);
    expect(screen.getByText('failed')).toBeInTheDocument();
  });

  it('renders stopped status', () => {
    render(<StatusBadge status="stopped" />);
    expect(screen.getByText('stopped')).toBeInTheDocument();
  });

  it('renders unknown status without crashing', () => {
    render(<StatusBadge status={'unknown-status' as unknown as JobStatus} />);
    expect(screen.getByText('unknown-status')).toBeInTheDocument();
  });
});
