import { describe, expect, it, vi, beforeEach } from 'vitest';
import {
  isSoundEnabled,
  setSoundEnabled,
  playKeySound,
  playStepSuccessSound,
  playStepErrorSound,
  playFanfareSound,
} from '../sound';

describe('sound module', () => {
  let mockStorage: Record<string, string> = {};

  beforeEach(() => {
    mockStorage = {};
    vi.stubGlobal('localStorage', {
      getItem: (key: string) => mockStorage[key] ?? null,
      setItem: (key: string, val: string) => {
        mockStorage[key] = val;
      },
    });
  });

  it('defaults to enabled when no storage entry is set', () => {
    expect(isSoundEnabled()).toBe(true);
  });

  it('reflects disabled status when saved', () => {
    setSoundEnabled(false);
    expect(isSoundEnabled()).toBe(false);
    expect(mockStorage['git-learn-sound-enabled']).toBe('false');

    setSoundEnabled(true);
    expect(isSoundEnabled()).toBe(true);
    expect(mockStorage['git-learn-sound-enabled']).toBe('true');
  });

  it('sound play functions execute safely without AudioContext in test env', () => {
    expect(() => playKeySound()).not.toThrow();
    expect(() => playStepSuccessSound()).not.toThrow();
    expect(() => playStepErrorSound()).not.toThrow();
    expect(() => playFanfareSound()).not.toThrow();
  });
});
