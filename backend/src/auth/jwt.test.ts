import { describe, expect, it } from 'vitest';
import { signAccessToken, signRefreshToken, verifyAccessToken, verifyRefreshToken } from './jwt';

describe('access tokens', () => {
  it('round-trips the payload it was signed with', () => {
    const token = signAccessToken({ sub: 42, role: 'customer' });
    const payload = verifyAccessToken(token);
    expect(payload.sub).toBe(42);
    expect(payload.role).toBe('customer');
  });

  it('rejects a tampered token', () => {
    const token = signAccessToken({ sub: 1, role: 'admin' });
    const tampered = token.slice(0, -2) + (token.endsWith('a') ? 'b' : 'a') + token.slice(-1);
    expect(() => verifyAccessToken(tampered)).toThrow();
  });

  it('rejects a refresh token presented as an access token', () => {
    const refreshToken = signRefreshToken({ sub: 1, jti: 'some-id' });
    expect(() => verifyAccessToken(refreshToken)).toThrow();
  });

  it('rejects garbage input', () => {
    expect(() => verifyAccessToken('not-a-jwt')).toThrow();
  });
});

describe('refresh tokens', () => {
  it('round-trips the payload it was signed with', () => {
    const token = signRefreshToken({ sub: 7, jti: 'abc-123' });
    const payload = verifyRefreshToken(token);
    expect(payload.sub).toBe(7);
    expect(payload.jti).toBe('abc-123');
  });

  it('rejects an access token presented as a refresh token', () => {
    const accessToken = signAccessToken({ sub: 1, role: 'customer' });
    expect(() => verifyRefreshToken(accessToken)).toThrow();
  });
});
