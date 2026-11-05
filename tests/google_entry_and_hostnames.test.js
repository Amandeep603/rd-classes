import { describe, it, expect } from "vitest";
import { middleware } from "../src/middleware.js";
import { isInAppBrowser } from "../src/server/auth/deviceIdentity.js";
import { COOKIE_NAMES } from "../src/server/auth/cookies.js";
import { publicError } from "../src/lib/publicError.js";

describe("Google Entry & Hostnames Verification Test Suite", () => {
  describe("1. Hostname Canonical 308 Redirection", () => {
    it("redirects apex domain rd-classes.in to https://www.rd-classes.in preserving path and query with 308 and no Set-Cookie", () => {
      const mockReq = {
        nextUrl: {
          pathname: "/student-login",
          search: "?next=/student/courses&ref=google",
        },
        headers: new Headers({
          host: "rd-classes.in",
        }),
        method: "GET",
        url: "http://rd-classes.in/student-login?next=/student/courses&ref=google",
        cookies: {
          get: () => undefined,
        },
      };

      const res = middleware(mockReq);
      expect(res.status).toBe(308);
      expect(res.headers.get("location")).toBe(
        "https://www.rd-classes.in/student-login?next=/student/courses&ref=google"
      );
      expect(res.headers.get("set-cookie")).toBeNull();
    });

    it("redirects rd-classes-sandy.vercel.app to https://www.rd-classes.in preserving path", () => {
      const mockReq = {
        nextUrl: {
          pathname: "/courses/accountancy",
          search: "",
        },
        headers: new Headers({
          host: "rd-classes-sandy.vercel.app",
        }),
        method: "GET",
        url: "http://rd-classes-sandy.vercel.app/courses/accountancy",
        cookies: {
          get: () => undefined,
        },
      };

      const res = middleware(mockReq);
      expect(res.status).toBe(308);
      expect(res.headers.get("location")).toBe("https://www.rd-classes.in/courses/accountancy");
      expect(res.headers.get("set-cookie")).toBeNull();
    });

    it("bypasses redirection on localhost, 127.0.0.1, and Vercel preview environments", () => {
      const localReq = {
        nextUrl: { pathname: "/", search: "" },
        headers: new Headers({ host: "localhost:3000" }),
        method: "GET",
        url: "http://localhost:3000/",
        cookies: { get: () => undefined },
      };
      const localRes = middleware(localReq);
      expect(localRes.status).toBe(200);

      const previewReq = {
        nextUrl: { pathname: "/", search: "" },
        headers: new Headers({ host: "rd-classes-git-feature-preview.vercel.app" }),
        method: "GET",
        url: "https://rd-classes-git-feature-preview.vercel.app/",
        cookies: { get: () => undefined },
      };
      const previewRes = middleware(previewReq);
      expect(previewRes.status).toBe(200);
    });

    it("applies Cache-Control: no-store and noindex to student-login page", () => {
      const loginReq = {
        nextUrl: { pathname: "/student-login", search: "" },
        headers: new Headers({ host: "www.rd-classes.in" }),
        method: "GET",
        url: "https://www.rd-classes.in/student-login",
        cookies: { get: () => undefined },
      };
      const res = middleware(loginReq);
      expect(res.headers.get("Cache-Control")).toContain("no-store");
      expect(res.headers.get("X-Robots-Tag")).toBe("noindex, nofollow");
    });
  });

  describe("2. In-App Browser Detection Matrix", () => {
    it("detects Google App on iOS (GSA) as in-app browser", () => {
      const gsaUA =
        "Mozilla/5.0 (iPhone; CPU iPhone OS 17_4 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) GSA/310.0.620000000 Mobile/15E148 Safari/605.1";
      expect(isInAppBrowser(gsaUA)).toBe(true);
    });

    it("detects Instagram, WhatsApp, and Facebook as in-app browsers", () => {
      const igUA =
        "Mozilla/5.0 (iPhone; CPU iPhone OS 16_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148 Instagram 287.0.0.25.77";
      expect(isInAppBrowser(igUA)).toBe(true);

      const waUA =
        "Mozilla/5.0 (iPhone; CPU iPhone OS 17_3 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148 WhatsApp/2.24.4.73";
      expect(isInAppBrowser(waUA)).toBe(true);

      const fbUA =
        "Mozilla/5.0 (iPhone; CPU iPhone OS 16_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148 [FBAN/FBIOS;FBAV/425.0.0.28.112]";
      expect(isInAppBrowser(fbUA)).toBe(true);
    });

    it("detects Android WebView (with ; wv token)", () => {
      const webviewUA =
        "Mozilla/5.0 (Linux; U; Android 13; en-us; SM-S908U Build/TP1A.220624.014; wv) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/108.0.5359.128 Mobile Safari/537.36";
      expect(isInAppBrowser(webviewUA)).toBe(true);
    });

    it("does NOT block Android Chrome Custom Tabs or regular mobile browsers", () => {
      const chromeCustomTabUA =
        "Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.6367.82 Mobile Safari/537.36";
      expect(isInAppBrowser(chromeCustomTabUA)).toBe(false);

      const safariMobileUA =
        "Mozilla/5.0 (iPhone; CPU iPhone OS 17_4_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.4.1 Mobile/15E148 Safari/604.1";
      expect(isInAppBrowser(safariMobileUA)).toBe(false);

      const desktopChromeUA =
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36";
      expect(isInAppBrowser(desktopChromeUA)).toBe(false);
    });

    it("fails open when user agent is empty or unrecognized", () => {
      expect(isInAppBrowser("")).toBe(false);
      expect(isInAppBrowser(null)).toBe(false);
      expect(isInAppBrowser("CustomBot/1.0")).toBe(false);
    });
  });

  describe("3. Cookie Test & Attributes", () => {
    it("defines rd_cookie_test cookie name constant", () => {
      expect(COOKIE_NAMES.TEST).toBe("rd_cookie_test");
    });
  });

  describe("4. Error Masking & Reference Codes", () => {
    it("masks internal database errors with ERR-XXXXX reference code", () => {
      const dbErr = new Error("E11000 duplicate key error collection: rdclasses.sessions");
      const masked = publicError(dbErr, { route: "login" });
      expect(masked.refCode).toMatch(/^ERR-[A-Z0-9]{5}$/);
      expect(masked.userMessage).toContain("Something went wrong on our side");
      expect(masked.userMessage).toContain(masked.refCode);
    });

    it("leaves safe user-facing validation errors unmasked", () => {
      const safe = publicError("Invalid student ID or password.", { route: "login" });
      expect(safe.refCode).toBeNull();
      expect(safe.userMessage).toBe("Invalid student ID or password.");
      expect(safe.isKnown).toBe(true);
    });

    it("maps stale server action errors to a friendly refresh message", () => {
      const stale = publicError(new Error("Failed to find Server Action. This request might be from an older deployment."), { route: "login" });
      expect(stale.refCode).toBeNull();
      expect(stale.userMessage).toBe("This page was updated. Please refresh and try again.");
      expect(stale.isStaleAction).toBe(true);
    });
  });
});
