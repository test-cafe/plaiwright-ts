import DashboardLayout from "@/app/dashboard/layout";
import { getUserSession } from "@/lib/get-user-session";
import { redirect } from "next/navigation";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { User } from "@prisma/client";

vi.mock("@/lib/get-user-session");
vi.mock("next/navigation", () => ({ redirect: vi.fn() }));
vi.mock("@/components/shared/dashboard/dashboard-menu", () => ({
  DashboardMenu: () => null,
}));

const ADMIN_SESSION: Partial<User> = { id: 1, email: "admin@test.com", role: "ADMIN", fullName: "Admin User" };
const USER_SESSION: Partial<User>  = { id: 2, email: "user@test.com",  role: "USER",  fullName: "Regular User" };

const mockSession = (data: Partial<User> | null) =>
  vi.mocked(getUserSession).mockResolvedValue(data as User);

const renderLayout = () => DashboardLayout({ children: <></> });

beforeEach(() => vi.clearAllMocks());

describe("DashboardLayout", () => {
  describe("when user is not authenticated", () => {
    it("redirects to / exactly once", async () => {
      mockSession(null);

      await renderLayout();

      expect(redirect).toHaveBeenCalledWith("/");
      expect(redirect).toHaveBeenCalledTimes(1);
    });
  });

  describe("when user has USER role", () => {
    it("redirects to /", async () => {
      mockSession(USER_SESSION);

      await renderLayout();

      expect(redirect).toHaveBeenCalledWith("/");
    });
  });

  describe("when user has ADMIN role", () => {
    it("does not redirect", async () => {
      mockSession(ADMIN_SESSION);

      await renderLayout();

      expect(redirect).not.toHaveBeenCalled();
    });
  });
});
