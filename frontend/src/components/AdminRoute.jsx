import { Navigate } from "react-router-dom";
import { canModifyReports } from "../utils/roles";

/**
 * Blocks non-admin users from edit routes.
 */
export default function AdminRoute({ children, redirectTo = "/dashboard" }) {
  if (!canModifyReports()) {
    return <Navigate to={redirectTo} replace />;
  }
  return children;
}
