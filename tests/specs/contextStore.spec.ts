import { test, expect } from '@playwright/test';
import { globalContextStore } from '../../src/engine/contextStore';

test.describe('ContextStore Unit Tests', () => {
  test.beforeEach(() => {
    globalContextStore.clear();
  });

  test('should store and retrieve values correctly', () => {
    globalContextStore.set('orderId', 'CONF-1001');
    globalContextStore.set('userId', 42);

    expect(globalContextStore.get('orderId')).toBe('CONF-1001');
    expect(globalContextStore.get('userId')).toBe(42);
    expect(globalContextStore.has('orderId')).toBe(true);
    expect(globalContextStore.has('missingKey')).toBe(false);
  });

  test('should resolve string placeholders using ${context:key}', () => {
    globalContextStore.set('orderId', 'CONF-9988');
    globalContextStore.set('status', 'APPROVED');

    const input = 'Order ${context:orderId} has status ${context:status}';
    const resolved = globalContextStore.resolve(input);

    expect(resolved).toBe('Order CONF-9988 has status APPROVED');
  });

  test('should throw an explicit error if token key is missing', () => {
    expect(() => {
      globalContextStore.resolve('Hello ${context:nonExistentKey}');
    }).toThrow('[ContextStore Error] Unable to resolve token "${context:nonExistentKey}". Key "nonExistentKey" was not found in the context store.');
  });

  test('should clear stored values between scenario runs', () => {
    globalContextStore.set('tempToken', 'XYZ-123');
    expect(globalContextStore.has('tempToken')).toBe(true);

    globalContextStore.clear();

    expect(globalContextStore.has('tempToken')).toBe(false);
    expect(globalContextStore.get('tempToken')).toBeUndefined();
  });
});


