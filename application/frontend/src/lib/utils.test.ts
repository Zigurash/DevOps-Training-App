import { describe, expect, it } from 'vitest';
import { formatBytes, formatUptime } from '@/lib/utils';

describe('utils', () => {
  it('formats bytes', () => {
    expect(formatBytes(0)).toBe('0 B');
    expect(formatBytes(1024)).toBe('1 KB');
  });

  it('formats uptime', () => {
    expect(formatUptime(65)).toBe('1m 5s');
    expect(formatUptime(3661)).toBe('1h 1m 1s');
  });
});
