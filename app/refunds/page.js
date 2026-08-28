import LegalDocument from "../../components/legal/LegalDocument";
import { legalDocuments } from "../../lib/legalContent";

export const metadata = {
  title: "Refund Policy",
  description: "CommitDiary cancellation, refund, and billing support policy.",
};

export default function RefundsPage() {
  return <LegalDocument document={legalDocuments.refunds} />;
}
