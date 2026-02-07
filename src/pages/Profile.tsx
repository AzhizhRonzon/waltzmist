import { useNavigate } from "react-router-dom";
import ProfileSetup from "../components/ProfileSetup";
import { useWaltzStore } from "../context/WaltzStore";

const ProfilePage = () => {
  const navigate = useNavigate();
  const { completeProfile } = useWaltzStore();

  return (
    <ProfileSetup
      onComplete={(data) => {
        completeProfile(data);
        navigate("/discover");
      }}
    />
  );
};

export default ProfilePage;
