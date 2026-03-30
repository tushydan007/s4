import { Navigate, useLocation } from "react-router-dom";
import { useAppSelector } from "@/store";
import { useGetProfileQuery } from "@/store/api/authApi";
import { FullPageSpinner } from "@/components/ui/Spinner";

interface ProtectedRouteProps {
  children: React.ReactNode;
  requireNIN?: boolean;
}

export default function ProtectedRoute({
  children,
  requireNIN = false,
}: ProtectedRouteProps) {
  const { isAuthenticated } = useAppSelector((state) => state.auth);
  const location = useLocation();
  const {
    data: user,
    isLoading,
    isError,
  } = useGetProfileQuery(undefined, {
    skip: !isAuthenticated,
  });

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (isLoading) {
    return <FullPageSpinner />;
  }

  if (isError) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (requireNIN && user && !user.nin_verified) {
    return <Navigate to="/profile" replace />;
  }

  return <>{children}</>;
}
