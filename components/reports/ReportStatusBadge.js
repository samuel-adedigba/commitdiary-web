import { Badge } from "react-bootstrap";
import { CheckCircle, Clock, AlertCircle } from "react-feather";

const ReportStatusBadge = ({ status }) => {
  switch (status) {
    case "completed":
      return (
        <Badge bg="success">
          <CheckCircle size={12} className="me-1" /> Completed
        </Badge>
      );
    case "pending":
    case "processing":
      return (
        <Badge bg="warning">
          <Clock size={12} className="me-1" /> Processing
        </Badge>
      );
    case "failed":
      return (
        <Badge bg="danger">
          <AlertCircle size={12} className="me-1" /> Failed
        </Badge>
      );
    default:
      return <Badge bg="secondary">No Report</Badge>;
  }
};

export default ReportStatusBadge;

