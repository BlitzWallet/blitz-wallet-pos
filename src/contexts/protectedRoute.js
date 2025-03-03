import { Navigate, useLocation } from "react-router-dom";
import { useGlobalContext } from "./posContext";
import getCurrentUser from "../hooks/getCurrnetUser";

export const ProtectedRoute = ({ children }) => {
  const { currentUserSession } = useGlobalContext();
  const location = useLocation();
  const currentUser = getCurrentUser();

  // If the user has no account and is not on /:username, redirect
  if (!currentUserSession.account && location.pathname !== `/${currentUser}`) {
    return <Navigate to={`/${currentUser}`} replace />;
  }

  return children;
};
