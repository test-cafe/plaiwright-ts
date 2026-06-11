import DashboardLayout from "@/app/dashboard/layout";
import { getUserSession } from "@/lib/get-user-session";
import { redirect } from "next/navigation";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { Session } from "next-auth";
import { UserRole } from "@prisma/client";

vi.mock("@/lib/get-user-session");
vi.mock("next/navigation", () => ({ redirect: vi.fn() }));
vi.mock("@/components/shared/dashboard/dashboard-menu", () => ({
  DashboardMenu: () => null,
}));

type SessionUser = Session["user"];

const ADMIN_SESSION: SessionUser = { id: "1", role: UserRole.ADMIN, name: "Admin User", image: "" };
const USER_SESSION:  SessionUser = { id: "2", role: UserRole.USER,  name: "Regular User", image: "" };

const mockSession = (data: SessionUser | null) =>
  vi.mocked(getUserSession).mockResolvedValue(data);

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
