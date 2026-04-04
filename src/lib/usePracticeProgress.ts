'use client';

import { useSyncExternalStore } from 'react';
import {
  loadEarnedAchievements,
  saveEarnedAchievements,
  clearEarnedAchievements,
  checkNewAchievements,
  type Achievement,
} from './achievements';
import { interactivePracticeTaskIdSet } from './practice';

const STORAGE_KEY = 'git-learn-progress';
const STREAK_KEY = 'git-learn-streak';

export interface StreakData {
  count: number;
  lastDate: string;
}

interface StorageLike {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
}

interface PracticeProgressSnapshot {
  completedIds: Set<string>;
  streak: number;
  earnedAchievements: string[];
  newAchievement: Achievement | null;
}

const emptySnapshot: PracticeProgressSnapshot = {
  completedIds: new Set(),
  streak: 0,
  earnedAchievements: [],
  newAchievement: null,
};

let currentSnapshot = emptySnapshot;
const listeners = new Set<() => void>();

function getStorage(): StorageLike | null {
  if (typeof window === 'undefined') {
    return null;
  }

  return window.localStorage;
}

export function getLocalDateString(date = new Date()): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function getPreviousLocalDateString(date = new Date()): string {
  const previous = new Date(date);
  previous.setDate(previous.getDate() - 1);
  return getLocalDateString(previous);
}

export function getUpdatedStreak(
  current: StreakData,
  date = new Date()
): StreakData {
  const today = getLocalDateString(date);

  if (current.lastDate === today) {
    return current;
  }

  const yesterday = getPreviousLocalDateString(date);
  return {
    count: current.lastDate === yesterday ? current.count + 1 : 1,
    lastDate: today,
  };
}

function sanitizeCompletedIds(ids: string[]): string[] {
  return ids.filter((id) => interactivePracticeTaskIdSet.has(id));
}

export function loadCompletedFromStorage(storage = getStorage()): Set<string> {
  if (!storage) {
    return new Set();
  }

  try {
    const data = storage.getItem(STORAGE_KEY);
    if (!data) {
      return new Set();
    }

    const parsed = JSON.parse(data);
    return new Set(sanitizeCompletedIds(parsed.completedTaskIds || []));
  } catch {
    return new Set();
  }
}

export function saveCompletedToStorage(
  ids: Set<string>,
  storage = getStorage()
): void {
  if (!storage) {
    return;
  }

  storage.setItem(
    STORAGE_KEY,
    JSON.stringify({ completedTaskIds: Array.from(ids) })
  );
}

export function loadStreakFromStorage(storage = getStorage()): StreakData {
  if (!storage) {
    return { count: 0, lastDate: '' };
  }

  try {
    const data = storage.getItem(STREAK_KEY);
    return data ? JSON.parse(data) : { count: 0, lastDate: '' };
  } catch {
    return { count: 0, lastDate: '' };
  }
}

export function updateStreakInStorage(
  storage = getStorage(),
  date = new Date()
): number {
  if (!storage) {
    return 0;
  }

  const next = getUpdatedStreak(loadStreakFromStorage(storage), date);
  storage.setItem(STREAK_KEY, JSON.stringify(next));
  return next.count;
}

export function clearPracticeProgressStorage(storage = getStorage()): void {
  if (!storage) {
    return;
  }

  storage.removeItem(STORAGE_KEY);
  storage.removeItem(STREAK_KEY);
}

export function resetAllPracticeProgress(storage = getStorage()): void {
  clearPracticeProgressStorage(storage);
  clearEarnedAchievements(storage);
}

export function getStreak(): number {
  return loadStreakFromStorage().count;
}

function createSnapshot(storage = getStorage()): PracticeProgressSnapshot {
  return {
    completedIds: loadCompletedFromStorage(storage),
    streak: loadStreakFromStorage(storage).count,
    earnedAchievements: loadEarnedAchievements(storage),
    newAchievement: currentSnapshot.newAchievement,
  };
}

function emitSnapshot(snapshot: PracticeProgressSnapshot) {
  currentSnapshot = snapshot;
  listeners.forEach((listener) => listener());
}

function refreshSnapshot() {
  emitSnapshot(createSnapshot());
}

function subscribe(listener: () => void) {
  listeners.add(listener);

  if (listeners.size === 1 && typeof window !== 'undefined') {
    currentSnapshot = createSnapshot();
    window.addEventListener('storage', refreshSnapshot);
  }

  return () => {
    listeners.delete(listener);

    if (listeners.size === 0 && typeof window !== 'undefined') {
      window.removeEventListener('storage', refreshSnapshot);
    }
  };
}

function getSnapshot() {
  return currentSnapshot;
}

function getServerSnapshot() {
  return emptySnapshot;
}

function markCompletedInStore(id: string) {
  if (!interactivePracticeTaskIdSet.has(id)) {
    return;
  }

  const previous = currentSnapshot.completedIds;
  const nextCompletedIds = new Set(previous);
  nextCompletedIds.add(id);
  saveCompletedToStorage(nextCompletedIds);

  const streak = updateStreakInStorage();
  const earned = loadEarnedAchievements();
  const newAchievements = checkNewAchievements(nextCompletedIds, earned);
  const earnedAchievements =
    newAchievements.length > 0
      ? [...earned, ...newAchievements.map((item) => item.id)]
      : earned;

  if (newAchievements.length > 0) {
    saveEarnedAchievements(earnedAchievements);
  }

  emitSnapshot({
    completedIds: nextCompletedIds,
    streak,
    earnedAchievements,
    newAchievement: newAchievements[0] ?? null,
  });
}

function resetProgressInStore() {
  resetAllPracticeProgress();
  emitSnapshot({
    completedIds: new Set(),
    streak: 0,
    earnedAchievements: [],
    newAchievement: null,
  });
}

function dismissAchievementInStore() {
  emitSnapshot({
    ...currentSnapshot,
    newAchievement: null,
  });
}

export function usePracticeProgressStore() {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}

export function usePracticeProgress() {
  const snapshot = usePracticeProgressStore();

  return {
    completedIds: snapshot.completedIds,
    streak: snapshot.streak,
    loaded: true,
    markCompleted: markCompletedInStore,
    isCompleted: (id: string) => snapshot.completedIds.has(id),
    resetProgress: resetProgressInStore,
    newAchievement: snapshot.newAchievement,
    dismissAchievement: dismissAchievementInStore,
    earnedAchievements: snapshot.earnedAchievements,
  };
}
