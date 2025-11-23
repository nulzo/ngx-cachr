import { serializeKey } from './key-serializer';

describe('serializeKey', () => {
  it('should return string keys as is', () => {
    expect(serializeKey('test-key')).toBe('test-key');
  });

  it('should convert number keys to string', () => {
    expect(serializeKey(123)).toBe('123');
  });

  it('should join array keys with colon', () => {
    expect(serializeKey(['user', 1, 'details'])).toBe('user:1:details');
  });
});

