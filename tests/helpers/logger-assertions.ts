import { vi } from 'vitest';

export type LogLevel = 'trace' | 'debug' | 'info' | 'warn' | 'error' | 'fatal';

export interface CapturedLog {
  level: LogLevel;
  msg: string;
  [key: string]: unknown;
}

/**
 * Replaces the app logger with a spy and returns a handle to inspect captured logs.
 *
 * Usage:
 *   const logs = captureLogger();
 *   // ... call code under test ...
 *   logs.assertLogged('error', 'Unauthorized');
 *   logs.assertNotLogged('info');
 */
export function captureLogger() {
  const captured: CapturedLog[] = [];

  const makeMethod = (level: LogLevel) =>
    vi.fn((...args: unknown[]) => {
      const [msgOrObj, msg] = args;
      if (typeof msgOrObj === 'string') {
        captured.push({ level, msg: msgOrObj });
      } else if (typeof msgOrObj === 'object' && msgOrObj !== null) {
        captured.push({ level, msg: String(msg ?? ''), ...(msgOrObj as object) });
      }
    });

  const mockLogger = {
    trace: makeMethod('trace'),
    debug: makeMethod('debug'),
    info: makeMethod('info'),
    warn: makeMethod('warn'),
    error: makeMethod('error'),
    fatal: makeMethod('fatal'),
    child: vi.fn().mockReturnThis(),
  };

  vi.mock('@/lib/logger', () => ({ logger: mockLogger }));

  return {
    all: captured,

    ofLevel: (level: LogLevel) => captured.filter((l) => l.level === level),

    assertLogged(level: LogLevel, containing?: string) {
      const matching = captured.filter(
        (l) => l.level === level && (containing == null || l.msg.includes(containing)),
      );
      if (matching.length === 0) {
        const summary = captured.map((l) => `  [${l.level}] ${l.msg}`).join('\n') || '  (none)';
        throw new Error(
          `Expected a "${level}" log${containing ? ` containing "${containing}"` : ''}, but got:\n${summary}`,
        );
      }
    },

    assertNotLogged(level: LogLevel) {
      const matching = captured.filter((l) => l.level === level);
      if (matching.length > 0) {
        throw new Error(
          `Expected no "${level}" logs, but got: ${matching.map((l) => l.msg).join(', ')}`,
        );
      }
    },

    clear() {
      captured.length = 0;
    },
  };
}
