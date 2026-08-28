const POLICY_VERSION = "2026-08-28";
const DEFAULT_SUPPORT_EMAIL = "support@commitdiary.com";

function readPublicValue(name, fallback = "") {
  return String(process.env[name] || fallback).trim();
}

export const legalConfig = Object.freeze({
  legalName: readPublicValue("NEXT_PUBLIC_LEGAL_ENTITY_NAME"),
  legalAddress: readPublicValue("NEXT_PUBLIC_LEGAL_ENTITY_ADDRESS"),
  supportEmail: readPublicValue("NEXT_PUBLIC_SUPPORT_EMAIL", DEFAULT_SUPPORT_EMAIL),
  privacyEmail: readPublicValue("NEXT_PUBLIC_PRIVACY_EMAIL", DEFAULT_SUPPORT_EMAIL),
  policyVersion: POLICY_VERSION,
  effectiveDate: "28 August 2026",
});

export const legalIdentityConfigured = Boolean(
  legalConfig.legalName && legalConfig.legalAddress,
);
