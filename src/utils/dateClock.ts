/**
 * Date, Clock, and Timezone Utilities
 *
 * Provides real current time in user's local timezone, live clock hook,
 * and deterministic testing helpers via optional `now` parameter.
 */

import { useState, useEffect } from 'react';

/**
 * Returns YYYY-MM-DD for a given date in local timezone.
 */
export function getTodayDateStr(now: Date = new Date()): string {
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Returns YYYY-MM-DD offset by N days from the base date.
 */
export function getRelativeDateStr(offsetDays = 0, now: Date = new Date()): string {
  const d = new Date(now);
  d.setDate(d.getDate() + offsetDays);
  return getTodayDateStr(d);
}

/**
 * Returns ISO 8601 string offset by N days, hours, and minutes from the base date.
 */
export function getRelativeIsoStr(
  offsetDays = 0,
  hour = 12,
  minute = 0,
  now: Date = new Date()
): string {
  const d = new Date(now);
  d.setDate(d.getDate() + offsetDays);
  d.setHours(hour, minute, 0, 0);
  return d.toISOString();
}

/**
 * Formats time-of-day greeting (Good morning, Good afternoon, Good evening).
 */
export function formatGreeting(now: Date = new Date(), userName?: string): string {
  const hour = now.getHours();
  let greeting = 'Good morning';
  if (hour >= 12 && hour < 17) {
    greeting = 'Good afternoon';
  } else if (hour >= 17 || hour < 4) {
    greeting = 'Good evening';
  }
  return userName ? `${greeting}, ${userName}` : greeting;
}

/**
 * Formats a date into full readable format: e.g. "Monday, October 19, 2026".
 */
export function formatHeaderDate(now: Date = new Date()): string {
  return now.toLocaleDateString(undefined, {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });
}

/**
 * Formats local live clock time: e.g. "4:42 PM" or "16:42".
 */
export function formatLiveTime(now: Date = new Date()): string {
  return now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

/**
 * React hook that yields current time updated on an interval.
 */
export function useLiveClock(intervalMs: number = 1000): Date {
  const [now, setNow] = useState<Date>(() => new Date());

  useEffect(() => {
    const timer = setInterval(() => {
      setNow(new Date());
    }, intervalMs);
    return () => clearInterval(timer);
  }, [intervalMs]);

  return now;
}
