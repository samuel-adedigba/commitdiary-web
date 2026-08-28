import LegalDocument from "../../components/legal/LegalDocument";
import { legalDocuments } from "../../lib/legalContent";

export const metadata = {
  title: "Terms of Service",
  description: "The terms governing CommitDiary accounts, hosted features, and paid plans.",
};

export default function TermsPage() {
  return <LegalDocument document={legalDocuments.terms} />;
}
