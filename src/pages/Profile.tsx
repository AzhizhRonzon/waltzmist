import { useNavigate } from "react-router-dom";
import ProfileSetup from "../components/ProfileSetup";
import { useWaltz } from "../App";

const ProfilePage = () => {
  const navigate = useNavigate();
  const { completeProfile } = useWaltz();

  return (
    <ProfileSetup
      onComplete={() => {
        completeProfile();
        navigate("/discover");
      }}
    />
  );
};

export default ProfilePage;
