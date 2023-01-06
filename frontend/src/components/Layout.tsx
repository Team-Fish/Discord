import { Outlet } from "react-router-dom";
import { Navbar } from "./";
import { EmailModal, FriendRequestModal, RemoveFriendModal } from "./Modals";

const Layout: React.FC = () => {
  return (
    <div className="relative flex h-screen w-screen overflow-hidden">
      <Navbar />
      <Outlet />
      <EmailModal />
      <FriendRequestModal />
      <RemoveFriendModal />
    </div>
  );
};

export default Layout;