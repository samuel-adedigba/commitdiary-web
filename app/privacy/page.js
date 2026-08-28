import LegalDocument from "../../components/legal/LegalDocument";
import { legalDocuments } from "../../lib/legalContent";

export const metadata = {
  title: "Privacy Notice",
  description: "How CommitDiary handles account, Git, work-journal, and billing-related data.",
};

export default function PrivacyPage() {
  return <LegalDocument document={legalDocuments.privacy} />;
}
