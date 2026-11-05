import crypto from "crypto";
import { NextResponse } from "next/server";

export const GENERIC_PUBLIC_ERROR_TEXT =
  "Something went wrong on our side. Please try again in a moment. If it continues, contact RD Classes and quote this code.";

// Substrings that indicate technical or database implementation leaks
const TECHNICAL_LEAK_WORDS = [
  "e11000",
  "dup key",
  "objectid",
  "collection",
  "index",
  "mongo",
  "mongoose",
  "rdclasses",
  "sessions",
  "stack",
  "node_modules",
  "casterror",
  "validationerror",
  "typeerror",
  "referenceerror",
  "syntaxerror",
  "rangeerror",
  "querytxt",
  "buffering timed out",
  "timed out",
  "timeout",
  "econnrefused",
  "enotfound",
];

// Patterns representing intentional, safe user-facing feedback
const KNOWN_USER_PATTERNS = [
  /invalid (student id|login id|student|login|password|credentials|input|token|request|file|format|code|otp)/i,
  /account (has been|is) (deactivated|locked|blocked|inactive|suspended)/i,
  /deactivated/i,
  /locked for/i,
  /too many (failed )?attempts/i,
  /try again in/i,
  /please wait/i,
  /please open .* in (chrome|safari|browser)/i,
  /open in browser/i,
  /please enable cookies/i,
  /enable cookies/i,
  /private (browsing|mode)/i,
  /device was (replaced|removed)/i,
  /device .* (replaced|declined|rejected|removed)/i,
  /request .* (declined|rejected)/i,
  /registered on another device/i,
  /one phone and one laptop/i,
  /approving this device will log out/i,
  /device (is )?pending/i,
  /device (is )?declined/i,
  /device (was )?removed/i,
  /device request/i,
  /pending approval/i,
  /request has been sent/i,
  /not found/i,
  /already (exists|taken|enrolled)/i,
  /unauthorized/i,
  /forbidden/i,
  /session expired/i,
  /access denied/i,
  /passwords do not match/i,
  /required/i,
  /upload a (valid|supported|csv|xlsx)/i,
  /ye naya device hai/i,
  /approval ke baad dobara login karein/i,
  /this page was updated/i,
];

/**
 * Generate a short, human-readable reference code like ERR-7K3Q9
 */
export function generateReferenceCode() {
  const chars = "23456789ABCDEFGHJKLMNPQRSTUVWXYZ";
  const bytes = crypto.randomBytes(5);
  let code = "ERR-";
  for (let i = 0; i < 5; i++) {
    code += chars[bytes[i] % chars.length];
  }
  return code;
}

/**
 * Checks whether a message contains any forbidden technical terms
 */
export function containsTechnicalLeak(str) {
  if (!str || typeof str !== "string") return false;
  const lower = str.toLowerCase();
  for (const word of TECHNICAL_LEAK_WORDS) {
    if (lower.includes(word)) return true;
  }
  return false;
}

/**
 * Determines whether a message is known, safe, user-facing feedback
 */
export function isKnownUserMessage(message) {
  if (!message || typeof message !== "string") return false;
  if (containsTechnicalLeak(message)) return false;
  for (const pattern of KNOWN_USER_PATTERNS) {
    if (pattern.test(message)) return true;
  }
  return false;
}

/**
 * Extracts the first stack frame from an error object.
 */
function extractFirstStackFrame(err) {
  if (!err || typeof err !== "object" || !err.stack) return "unknown";
  const lines = String(err.stack).split("\n");
  for (let i = 1; i < lines.length; i++) {
    const trimmed = lines[i].trim();
    if (trimmed.startsWith("at ")) {
      return trimmed.replace(/^at\s+/, "");
    }
  }
  return "unknown";
}

/**
 * Centralized error formatter: turns unexpected or technical errors into generic text + reference code
 */
export function formatPublicError(err, { loginId, route } = {}) {
  const errName = err?.name || "";
  const rawMessage = typeof err === "string" ? err : err?.message || "";
  const errCode = err?.code;

  // Stale deploy server action error mapping: friendly notice instead of masked code
  if (
    rawMessage.includes("Failed to find Server Action") ||
    rawMessage.includes("An unexpected response was received from the server")
  ) {
    return {
      userMessage: "This page was updated. Please refresh and try again.",
      refCode: null,
      isKnown: true,
      isStaleAction: true,
    };
  }

  // Technical error types that must ALWAYS be masked
  const isTechnicalType =
    errName.includes("Mongo") ||
    errName === "CastError" ||
    errName === "ValidationError" ||
    errName === "TypeError" ||
    errName === "ReferenceError" ||
    errName === "SyntaxError" ||
    errName === "RangeError" ||
    errCode === 11000 ||
    errCode === "ECONNREFUSED" ||
    errCode === "ETIMEDOUT";

  const hasLeak = containsTechnicalLeak(rawMessage) || containsTechnicalLeak(errName);

  if (!isTechnicalType && !hasLeak && isKnownUserMessage(rawMessage)) {
    return {
      userMessage: rawMessage,
      refCode: null,
      isKnown: true,
    };
  }

  // Unexpected or technical error: generate reference code and mask
  const refCode = generateReferenceCode();
  const safeLoginId = loginId && typeof loginId === "string" ? loginId.trim() : null;
  const safeRoute = route && typeof route === "string" ? route.trim() : "unknown_route";
  const firstStackFrame = extractFirstStackFrame(err);
  const realErrName = errName || "Error";
  const realErrCode = errCode !== undefined && errCode !== null ? String(errCode) : "NONE";

  // Requirement 4: server log entry must always contain:
  // the reference code, the route, the real error name and code, the first stack frame, and the loginId (nothing else)
  console.error(
    `[MASKED_ERROR] ref=${refCode} route=${safeRoute} errorName=${realErrName} errorCode=${realErrCode} stackFrame="${firstStackFrame}" loginId=${safeLoginId || "NONE"}`
  );

  return {
    userMessage: `${GENERIC_PUBLIC_ERROR_TEXT} (${refCode})`,
    refCode,
    isKnown: false,
  };
}

/**
 * Wraps a Server Action to ensure unexpected errors are never returned raw
 */
export function withActionErrorHandling(actionFn, { getLoginId, route = "server_action" } = {}) {
  return async (...args) => {
    try {
      const result = await actionFn(...args);
      // If action returned an object with error property, sanitize it as well
      if (result && typeof result === "object" && result.error && typeof result.error === "string") {
        if (containsTechnicalLeak(result.error) || !isKnownUserMessage(result.error)) {
          const loginId = typeof getLoginId === "function" ? getLoginId(...args) : undefined;
          const { userMessage, refCode } = formatPublicError(new Error(result.error), { loginId, route });
          return {
            ...result,
            success: false,
            error: userMessage,
            errorCode: refCode,
            ref: refCode,
          };
        }
      }
      return result;
    } catch (err) {
      const loginId = typeof getLoginId === "function" ? getLoginId(...args) : undefined;
      const { userMessage, refCode } = formatPublicError(err, { loginId, route });
      return {
        success: false,
        error: userMessage,
        errorCode: refCode,
        ref: refCode,
      };
    }
  };
}

/**
 * Wraps an API route handler to ensure unexpected errors are never returned raw
 */
export function withRouteErrorHandling(handlerFn, { getLoginId, route } = {}) {
  return async (req, context) => {
    const determinedRoute = route || req?.nextUrl?.pathname || req?.url || "api_route";
    try {
      const response = await handlerFn(req, context);
      return response;
    } catch (err) {
      const loginId = typeof getLoginId === "function" ? getLoginId(req, context) : undefined;
      const { userMessage, refCode } = formatPublicError(err, { loginId, route: determinedRoute });
      return NextResponse.json(
        {
          success: false,
          error: userMessage,
          reference: refCode,
          code: refCode,
        },
        { status: 500 }
      );
    }
  };
}

export const withErrorHandling = withRouteErrorHandling;
export { formatPublicError as publicError };
export default formatPublicError;

