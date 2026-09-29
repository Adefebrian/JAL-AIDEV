// packages/facts - the verified facts of the business, defined once.
//
// Pure data and pure functions: no db, no env, no app code, no side effects
// at import. apps/web/src (client copy, build-time generator) and
// apps/web/server (route-table copy, head) both read facts from here, so the
// runtime image copies this package and never apps/web/src.
export * from "./placeholder";
export * from "./lang";
export * from "./business";
export * from "./rates";
export * from "./press";
export * from "./positioning";
export * from "./differentiators";
export * from "./pageDates";
export * from "./forbidden";
export * from "./derived";
