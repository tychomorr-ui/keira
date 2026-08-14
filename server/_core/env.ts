export const ENV = {
  cookieSecret: process.env.JWT_SECRET ?? "",
  portalOwnerAccessToken: process.env.PORTAL_OWNER_ACCESS_TOKEN ?? "",
  databaseUrl: process.env.DATABASE_URL ?? "",
  isProduction: process.env.NODE_ENV === "production",
  forgeApiUrl: process.env.BUILT_IN_FORGE_API_URL ?? "",
  forgeApiKey: process.env.BUILT_IN_FORGE_API_KEY ?? "",
};
