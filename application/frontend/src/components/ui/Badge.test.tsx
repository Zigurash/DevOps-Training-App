import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { Badge } from '@/components/ui/Badge';

describe('Badge', () => {
  it('renders children', () => {
    render(<Badge tone="success">connected</Badge>);
    expect(screen.getByText('connected')).toBeInTheDocument();
  });
});
