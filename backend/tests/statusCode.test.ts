import { describe, expect, it } from 'vitest';
import { classifyStatusCode } from '../src/processors/statusCode';

describe('classifyStatusCode', () => {
  it('classifies 200 as clean', () => {
    expect(classifyStatusCode('200')).toEqual({ code: 200, status: 'CLEAN' });
  });

  it('classifies standard 5xx failures as clean (structurally valid, not "successful")', () => {
    expect(classifyStatusCode('503')).toEqual({ code: 503, status: 'CLEAN' });
  });

  it('flags 999 as invalid rather than treating it as success or remapping it', () => {
    const result = classifyStatusCode('999');
    expect(result.status).toBe('INVALID_STATUS');
    expect(result.code).toBe(999);
  });

  it('flags non-numeric status codes as invalid', () => {
    const result = classifyStatusCode('OK');
    expect(result.status).toBe('INVALID_STATUS');
    expect(result.code).toBeNull();
  });
});
