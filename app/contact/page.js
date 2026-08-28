import LegalDocument from "../../components/legal/LegalDocument";
import { legalDocuments } from "../../lib/legalContent";

export const metadata = {
  title: "Contact CommitDiary",
  description: "Contact CommitDiary for product support, billing, privacy, and complaints.",
};

export default function ContactPage() {
  return <LegalDocument document={legalDocuments.contact} />;
}
