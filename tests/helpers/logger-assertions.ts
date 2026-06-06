import { vi } from 'vitest';
import type { Mock } from 'vitest';

export type LogLevel = 'trace' | 'debug' | 'info' | 'warn' | 'error' | 'fatal';

export interface CapturedLog {
  level: LogLevel;
  msg: string;
  [key: string]: unknown;
}

/**
 * Creates a mock logger object. Use inside the vi.mock factory, then import and cast
 * the mocked module to pass to captureLogger:
 *
 *   vi.mock('@/lib/logger', () => ({ logger: createMockLogger() }));
 *   import { logger } from '@/lib/logger';
 *
 *   beforeEach(() => {
 *     vi.clearAllMocks();
 *     logs = captureLogger(logger as unknown as MockLogger);
 *   });
 */
export function createMockLogger() {
  return {
    trace: vi.fn(),
    debug: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    fatal: vi.fn(),
    child: vi.fn().mockReturnThis(),
  };
}

export type MockLogger = ReturnType<typeof createMockLogger>;

/**
 * Wires capture on a pre-established mock logger and returns an inspection handle.
 * Call this in beforeEach *after* vi.clearAllMocks() to re-wire the implementations.
 *
 *   const loggerMock = vi.hoisted(() => createMockLogger());
 *   vi.mock('@/lib/logger', () => ({ logger: loggerMock }));
 *
 *   let logs: ReturnType<typeof captureLogger>;
 *   beforeEach(() => {
 *     vi.clearAllMocks();
 *     logs = captureLogger(loggerMock);
 *   });
 */
export function captureLogger(mockLogger: MockLogger) {
  const captured: CapturedLog[] = [];

  const levels: LogLevel[] = ['trace', 'debug', 'info', 'warn', 'error', 'fatal'];

  for (const level of levels) {
    (mockLogger[level] as Mock).mockImplementation((...args: unknown[]) => {
      const [msgOrObj, msg] = args;
      if (typeof msgOrObj === 'string') {
        captured.push({ level, msg: msgOrObj });
      } else if (typeof msgOrObj === 'object' && msgOrObj !== null) {
        captured.push({ level, msg: String(msg ?? ''), ...(msgOrObj as object) });
      }
    });
  }

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
