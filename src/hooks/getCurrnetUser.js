import { useGlobalContext } from "../contexts/posContext";
import { useParams } from "react-router-dom";

const getCurrentUser = () => {
  let currentUser = "";
  const { User } = useGlobalContext();
  const { username } = useParams();
  if (
    typeof User === "string" &&
    typeof username === "string" &&
    User?.toLowerCase() != username?.toLowerCase()
  ) {
    currentUser = username;
  } else if (typeof User === "string") {
    currentUser = User;
  } else currentUser = username;

  return currentUser;
};

export default getCurrentUser;
