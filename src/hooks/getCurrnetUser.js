import { useGlobalContext } from "../contexts/posContext";
import { useParams } from "react-router-dom";

const getCurrentUser = () => {
  let currentUser = "";
  const { user } = useGlobalContext();
  const { username } = useParams() || {};

  if (
    typeof user === "string" &&
    typeof username === "string" &&
    user?.toLowerCase() != username?.toLowerCase()
  ) {
    currentUser = username;
  } else if (typeof user === "string") {
    currentUser = user;
  } else currentUser = username || "";

  return currentUser;
};

export default getCurrentUser;
