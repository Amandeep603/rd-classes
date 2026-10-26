/**
 * Helper to ensure test and demo scripts run against an isolated test database.
 * Derives MONGODB_URI_TEST or replaces the database name in MONGODB_URI with "<name>_test".
 * Refuses execution if the resolved test database equals the production/application database.
 */

export function deriveIsolatedTestUri(rawUri = process.env.MONGODB_URI) {
  if (process.env.MONGODB_URI_TEST) {
    const testUri = process.env.MONGODB_URI_TEST.trim();
    const appDbName = extractDatabaseName(rawUri);
    const testDbName = extractDatabaseName(testUri);
    if (appDbName && testDbName && appDbName.toLowerCase() === testDbName.toLowerCase()) {
      throw new Error(
        `[TEST ISOLATION REFUSAL] MONGODB_URI_TEST uses the same database name ("${testDbName}") as MONGODB_URI! Refusing to run to protect application data.`
      );
    }
    return { testUri, testDbName, appDbName };
  }

  if (!rawUri) {
    throw new Error("[TEST ISOLATION ERROR] Neither MONGODB_URI nor MONGODB_URI_TEST is configured.");
  }

  const appDbName = extractDatabaseName(rawUri) || "rdclasses";
  const testDbName = `${appDbName}_test`;

  // Parse and replace database name in connection string
  let testUri = rawUri;
  const questionMarkIdx = rawUri.indexOf("?");
  const queryParams = questionMarkIdx !== -1 ? rawUri.slice(questionMarkIdx) : "";
  const beforeQuery = questionMarkIdx !== -1 ? rawUri.slice(0, questionMarkIdx) : rawUri;

  const lastSlashIdx = beforeQuery.lastIndexOf("/");
  if (lastSlashIdx !== -1) {
    const prefix = beforeQuery.slice(0, lastSlashIdx + 1);
    testUri = `${prefix}${testDbName}${queryParams}`;
  } else {
    testUri = `${beforeQuery}/${testDbName}${queryParams}`;
  }

  if (testDbName.toLowerCase() === appDbName.toLowerCase()) {
    throw new Error(
      `[TEST ISOLATION REFUSAL] Derived test database ("${testDbName}") is identical to the application database. Refusing to run.`
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
