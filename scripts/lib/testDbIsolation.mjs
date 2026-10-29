/**
 * Helper to ensure test and demo scripts run against an isolated test database.
 * Tests must NEVER run against the real/production database.
 * Refuses execution unless an explicit TEST_DATABASE_URI is set, and verifies
 * that TEST_DATABASE_URI does NOT point to the production database.
 */

export function deriveIsolatedTestUri() {
  const testUri = process.env.TEST_DATABASE_URI;

  if (!testUri) {
    throw new Error(
      "[TEST EXECUTION REFUSED] Tests are strictly prohibited from running against the application/real database.\n" +
      "An explicit TEST_DATABASE_URI environment variable (pointing to a separate test database) must be set."
    );
  }

  const rawUri = process.env.MONGODB_URI;
  const appDbName = extractDatabaseName(rawUri);
  const testDbName = extractDatabaseName(testUri);

  if (appDbName && testDbName && appDbName.toLowerCase() === testDbName.toLowerCase()) {
    throw new Error(
      `[TEST EXECUTION REFUSED] TEST_DATABASE_URI points to the exact same database ("${testDbName}") as MONGODB_URI!\n` +
      "Refusing to run tests to protect real database data."
    );
  }

  return { testUri, testDbName, appDbName };
}

export function extractDatabaseName(uri) {
  if (!uri) return "";
  try {
    const cleanUri = uri.split("?")[0];
    const lastSlash = cleanUri.lastIndexOf("/");
    if (lastSlash === -1) return "";
    return cleanUri.slice(lastSlash + 1).trim();
  } catch {
    return "";
  }
}
