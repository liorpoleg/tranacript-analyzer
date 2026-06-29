import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import AppButton from './AppButton';

describe('AppButton', () => {
  it('renders children text', () => {
    render(<AppButton>Click me</AppButton>);
    expect(screen.getByText('Click me')).toBeInTheDocument();
  });

  it('is enabled when not loading and not disabled', () => {
    render(<AppButton>Click me</AppButton>);
    expect(screen.getByRole('button')).not.toBeDisabled();
  });

  it('is disabled when loading is true', () => {
    render(<AppButton loading>Click me</AppButton>);
    expect(screen.getByRole('button')).toBeDisabled();
  });

  it('is disabled when disabled prop is true', () => {
    render(<AppButton disabled>Click me</AppButton>);
    expect(screen.getByRole('button')).toBeDisabled();
  });

  it('shows circular progress when loading', () => {
    const { container } = render(<AppButton loading>Submit</AppButton>);
    // MUI CircularProgress renders an svg role="progressbar"
    const spinner = container.querySelector('[role="progressbar"]');
    expect(spinner).toBeInTheDocument();
  });

  it('does not show spinner when not loading', () => {
    const { container } = render(<AppButton>Submit</AppButton>);
    const spinner = container.querySelector('[role="progressbar"]');
    expect(spinner).not.toBeInTheDocument();
  });

  it('calls onClick when clicked', async () => {
    const handler = vi.fn();
    render(<AppButton onClick={handler}>Click me</AppButton>);
    await userEvent.click(screen.getByRole('button'));
    expect(handler).toHaveBeenCalledOnce();
  });

  it('does not call onClick when disabled', () => {
    const handler = vi.fn();
    render(<AppButton disabled onClick={handler}>Click me</AppButton>);
    fireEvent.click(screen.getByRole('button'));
    expect(handler).not.toHaveBeenCalled();
  });
});
