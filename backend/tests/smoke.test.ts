import { describe, expect, it } from 'vitest';
import { SERVICE_IDS } from '../src/types';

describe('project scaffold', () => {
  it('exposes the five known service ids', () => {
    expect(SERVICE_IDS).toHaveLength(5);
    expect(SERVICE_IDS).toContain('svc-auth');
  });
});
