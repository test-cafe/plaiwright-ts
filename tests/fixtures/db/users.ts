import type { PrismaClient } from '@prisma/client';
import { UserRole } from '@prisma/client';
import { hashSync } from 'bcrypt';

type UserOverrides = {
  email?: string;
  fullName?: string;
  password?: string;
  role?: UserRole;
  verified?: Date | null;
  provider?: string;
  providerId?: string;
};

export function createUserFactory(prisma: PrismaClient) {
  let counter = 0;

  return {
    async build(overrides: UserOverrides = {}) {
      counter++;
      return prisma.user.create({
        data: {
          email: overrides.email ?? `user${counter}@test.com`,
          fullName: overrides.fullName ?? `Test User ${counter}`,
          password: hashSync(overrides.password ?? 'TestPass123!', 10),
          role: overrides.role ?? UserRole.USER,
          verified: overrides.verified !== undefined ? overrides.verified : new Date(),
          provider: overrides.provider,
          providerId: overrides.providerId,
        },
      });
    },

    async buildAdmin(overrides: UserOverrides = {}) {
      return this.build({ ...overrides, role: UserRole.ADMIN });
    },

    async buildUnverified(overrides: UserOverrides = {}) {
      return this.build({ ...overrides, verified: null });
    },

    async buildOAuthUser(provider: 'google' | 'github', overrides: UserOverrides = {}) {
      return this.build({
        ...overrides,
        provider,
        providerId: `${provider}-account-id-${counter}`,
      });
    },
  };
}
