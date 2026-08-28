import LegalDocument from "../../components/legal/LegalDocument";
import { legalDocuments } from "../../lib/legalContent";

export const metadata = {
  title: "Cookie Policy",
  description: "The necessary cookies CommitDiary uses for secure sign-in and session continuity.",
};

export default function CookiesPage() {
  return <LegalDocument document={legalDocuments.cookies} />;
}
