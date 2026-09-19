import { Navigate } from "react-router";

/** المسار القديم `/dashboard` ينقل الآن إلى داخل التطبيق. */
export default function Dashboard() {
  return <Navigate to="/app" replace />;
}
