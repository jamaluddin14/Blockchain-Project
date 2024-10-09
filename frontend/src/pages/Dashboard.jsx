import React, { useState, useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";
import { useNavigate } from "react-router-dom";
import FriendsList from "../components/FriendsList";
import LoanList from "../components/LoanList";
import AddFriend from "../components/AddFriend";
import ErrorModal from "../components/ErrorModal";
import { clearAuth } from "../features/auth/authSlice";
import { LogOut, Menu } from "lucide-react";
import { apiSlice } from "../features/api/apiSlice";
import { requestNotificationPermission } from "../firebase";

const DashboardPage = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const token = useSelector((state) => state.auth.token);
  const [activeComponent, setActiveComponent] = useState("loans");
  const [error, setError] = useState(null);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const username = useSelector((state) => state.auth.username);
  const public_key = useSelector((state) => state.auth.publicKey);

  useEffect(() => {
    if (!token) {
      navigate("/login");
    }
  }, [token, navigate]);

  const handleLogout = () => {
    dispatch(clearAuth());
    dispatch(apiSlice.util.resetApiState());
    navigate("/login");
  };

  useEffect(()=>{
    async function requestPermission(){
    await requestNotificationPermission();
  }
  requestPermission();
  })

  const renderComponent = () => {
    switch (activeComponent) {
      case "friends":
        return <FriendsList />;
      case "addFriend":
        return <AddFriend />;
      case "loans":
      default:
        return <LoanList />;
    }
  };

  const navItems = ["loans", "friends", "addFriend"];

  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-gray-900 via-gray-800 to-gray-700 text-white flex flex-col">
      <div className="flex-grow flex flex-col">
        {/* Header Section */}
        <header className="p-4 md:p-8 bg-gray-900">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-3xl md:text-5xl font-extrabold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-600 animate-text">
              LendMaker
            </h1>
            <div className="flex items-center">
              <span className="mr-4 text-lg md:text-xl font-semibold">
                {username}
              </span>
              {public_key === null && (
                <button
                  onClick={() => navigate("/add-public-key")}
                  className="bg-gradient-to-r from-blue-500 to-blue-700 hover:from-blue-600 hover:to-blue-800 text-white font-bold py-2 px-4 md:px-6 rounded-full transition-all duration-200 transform hover:scale-105 shadow-md"
                >
                  Verify User
                </button>
              )}

              <button
                onClick={handleLogout}
                className="bg-gradient-to-r from-red-500 to-red-700 hover:from-red-600 hover:to-red-800 text-white font-bold py-2 px-4 md:px-6 rounded-full transition-all duration-200 transform hover:scale-105 flex items-center shadow-lg text-sm md:text-base"
              >
                <LogOut className="mr-2" size={16} />
                <span className="hidden md:inline">Logout</span>
              </button>
              <button
                className="ml-4 md:hidden"
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              >
                <Menu size={24} />
              </button>
            </div>
          </div>
          {/* Navigation Tabs */}
          <nav
            className={`md:flex md:justify-start border-b border-gray-600 ${
              isMobileMenuOpen ? "block" : "hidden md:flex"
            }`}
          >
            {navItems.map((tab) => (
              <button
                key={tab}
                onClick={() => {
                  setActiveComponent(tab);
                  setIsMobileMenuOpen(false);
                }}
                className={`
                  w-full md:w-auto px-4 py-2 text-base md:text-lg font-semibold tracking-wide
                  transition-all duration-200 
                  ${
                    activeComponent === tab
                      ? "bg-gray-800 text-white border-b-2 border-blue-500"
                      : "text-gray-400 hover:text-white"
                  }
                  ${tab === navItems[0] ? "rounded-tl-lg" : ""}
                  ${
                    tab === navItems[navItems.length - 1] ? "rounded-tr-lg" : ""
                  }
                `}
              >
                {tab === "addFriend"
                  ? "Add Friend"
                  : tab.charAt(0).toUpperCase() + tab.slice(1)}
              </button>
            ))}
          </nav>
        </header>

        {/* Main Content */}
        <main className="flex-grow p-4 md:p-8 overflow-y-auto">
          {renderComponent()}
        </main>
      </div>

      {/* Error Modal */}
      {error && <ErrorModal error={error} onClose={() => setError(null)} />}
    </div>
  );
};

export default DashboardPage;
