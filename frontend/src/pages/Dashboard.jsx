import React, { useState, useEffect, useRef } from "react";
import { useSelector, useDispatch } from "react-redux";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { LogOut, Menu, Bell, X, Loader, Home, Users, UserPlus, DollarSign } from "lucide-react";
import { clearAuth } from "../features/auth/authSlice";
import { apiSlice } from "../features/api/apiSlice";
import { requestNotificationPermission, messaging } from "../firebase";
import { onMessage } from "firebase/messaging";
import { useGetNotificationsQuery, useDeleteNotificationMutation } from "../features/api/apiSlice";
import FriendsList from "../components/FriendsList";
import LoanList from "../components/LoanList";
import AddFriend from "../components/AddFriend";
import ErrorModal from "../components/ErrorModal";
import FloatingNotification from "../components/FloatingNotification";

const DashboardPage = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const token = useSelector((state) => state.auth.token);
  const username = useSelector((state) => state.auth.username);
  const [activeComponent, setActiveComponent] = useState("loans");
  const [error, setError] = useState(null);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [requestsCount, setRequestsCount] = useState(0);
  const { data: notifications, error: notificationsError, refetch: refetchNotifications } = useGetNotificationsQuery();
  const [deleteNotification] = useDeleteNotificationMutation();
  const [floatingNotification, setFloatingNotification] = useState(null);
  const dropdownRef = useRef(null);

  const unreadCount = notifications?.filter(n => !n.read)?.length || 0;

  useEffect(() => {
    if (notifications) {
      const requestNotificationsCount = notifications.filter(notification => 
        notification.title.includes("Request")
      ).length;
      setRequestsCount(requestNotificationsCount);
    }
  }, [notifications]);

  useEffect(() => {
    if (!token) {
      navigate("/login");
    }
  }, [token, navigate]);

  useEffect(() => {
    async function setupNotifications() {
      await requestNotificationPermission(token);
      onMessage(messaging, (payload) => {
        console.log("New message received. Payload:", payload);
        const newNotification = {
          id: Date.now(),
          title: payload.notification.title,
          body: payload.notification.body,
        };
        setFloatingNotification(newNotification);
        refetchNotifications();
      });
    }
    setupNotifications();
  }, [token, refetchNotifications]);

  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowDropdown(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleLogout = () => {
    dispatch(clearAuth());
    dispatch(apiSlice.util.resetApiState());
    navigate("/login");
  };

  const toggleDropdown = () => setShowDropdown(!showDropdown);

  const markAsRead = async (id) => {
    try {
      await deleteNotification(id).unwrap();
      refetchNotifications();
    } catch (err) {
      console.error("Failed to mark notification as read", err);
    }
  };

  const renderComponent = () => {
    switch (activeComponent) {
      case "friends": return <FriendsList />;
      case "addFriend": return <AddFriend />;
      case "loans":
      default: return <LoanList requestsCount={requestsCount} setRequestsCount={setRequestsCount} />;
    }
  };

  const markAllAsRead = async () => {
    try {
      const unreadNotifications = notifications.filter(n => !n.read);
      await Promise.all(unreadNotifications.map(notification => deleteNotification(notification._id).unwrap()));
      refetchNotifications();
    } catch (err) {
      console.error("Failed to mark all notifications as read", err);
    }
  };
  
  const navItems = [
    { id: "loans", label: "Loans", icon: DollarSign },
    { id: "friends", label: "Friends", icon: Users },
    { id: "addFriend", label: "Add Friend", icon: UserPlus }
  ];

  return (
    <div className="min-h-screen w-full bg-gray-900 text-gray-100 flex flex-col">
      <div className="flex-grow flex flex-col">
        <header className="p-4 md:p-6 bg-gray-800 shadow-xl">
          <div className="flex justify-between items-center mb-6">
            <motion.h1 
              className="text-3xl sm:text-4xl md:text-5xl font-extrabold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-500"
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              LendMaker
            </motion.h1>
            <div className="flex items-center space-x-2 sm:space-x-4">
              <motion.span 
                className="hidden md:inline text-lg font-semibold"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5, delay: 0.2 }}
              >
                {username}
              </motion.span>
              
              <div className="relative" ref={dropdownRef}>
                <motion.button
                  className="relative p-2 rounded-full hover:bg-gray-700 transition-colors duration-200"
                  onClick={toggleDropdown}
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <Bell size={20} className="text-gray-300" />
                  {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                      {unreadCount}
                    </span>
                  )}
                </motion.button>

                <AnimatePresence>
                  {showDropdown && (
                    <motion.div 
                      className="absolute right-0 mt-2 w-80 max-w-[90vw] bg-gray-800 border border-gray-700 rounded-lg shadow-xl z-50"
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      transition={{ duration: 0.2 }}
                    >
                      <div className="p-4 border-b border-gray-700 flex justify-between items-center">
                        <h3 className="font-semibold">Notifications</h3>
                        <div className="flex space-x-2">
                          {unreadCount > 0 && (
                            <button
                              onClick={markAllAsRead}
                              className="text-sm font-semibold text-blue-400 hover:text-blue-300 transition-colors"
                            >
                              Mark All as Read
                            </button>
                          )}
                          <button onClick={toggleDropdown} className="text-gray-400 hover:text-white">
                            <X size={16} />
                          </button>
                        </div>
                      </div>
                      <ul className="max-h-60 sm:max-h-80 overflow-y-auto">
                        {notifications?.length === 0 ? (
                          <li className="p-4 text-gray-400">No new notifications</li>
                        ) : (
                          notifications?.map((notification) => (
                            <motion.li
                              key={notification._id}
                              className={`p-4 ${notification.read ? "bg-gray-700" : "bg-gray-750"} hover:bg-gray-700 cursor-pointer transition-colors duration-200`}
                              onClick={() => markAsRead(notification._id)}
                              initial={{ opacity: 0, x: -20 }}
                              animate={{ opacity: 1, x: 0 }}
                              exit={{ opacity: 0, x: 20 }}
                              transition={{ duration: 0.2 }}
                            >
                              <h4 className="font-semibold mb-1">{notification.title}</h4>
                              <p className="text-sm text-gray-300">{notification.body}</p>
                            </motion.li>
                          ))
                        )}
                      </ul>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              <motion.button
                onClick={handleLogout}
                className="bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-3 sm:px-4 rounded-full transition-all duration-200 flex items-center shadow-lg text-xs sm:text-sm"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <LogOut className="mr-1 sm:mr-2" size={16} />
                <span className="hidden sm:inline">Logout</span>
              </motion.button>
              <motion.button
                className="md:hidden p-2 rounded-full hover:bg-gray-700 transition-colors duration-200"
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
              >
                <Menu size={24} />
              </motion.button>
            </div>
          </div>

          <nav className={`md:flex md:justify-start ${isMobileMenuOpen ? "block" : "hidden md:flex"}`}>
            {navItems.map((item, index) => (
              <motion.button
                key={item.id}
                onClick={() => {
                  setActiveComponent(item.id);
                  setIsMobileMenuOpen(false);
                }}
                className={`
                  w-full md:w-auto px-4 py-2 text-sm sm:text-base font-semibold tracking-wide
                  transition-all duration-200 rounded-md md:rounded-none md:border-b-2 mb-2 md:mb-0
                  flex items-center justify-center md:justify-start
                  ${
                    activeComponent === item.id
                      ? "bg-gray-700 text-white md:border-blue-500"
                      : "text-gray-300 hover:text-white md:border-transparent hover:bg-gray-700"
                  }
                `}
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: index * 0.1 }}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <item.icon size={18} className="mr-2" />
                {item.label}
              </motion.button>
            ))}
          </nav>
        </header>

        <main className="flex-grow p-4 md:p-8 overflow-y-auto bg-gray-900">
          <motion.div
            key={activeComponent}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            transition={{ duration: 0.3 }}
          >
            {renderComponent()}
          </motion.div>
        </main>
        <AnimatePresence>
          {floatingNotification && (
            <FloatingNotification
              notification={floatingNotification}
              onClose={() => setFloatingNotification(null)}
            />
          )}
        </AnimatePresence>
      </div>

      <AnimatePresence>
        {error && (
          <ErrorModal error={error} onClose={() => setError(null)} />
        )}
      </AnimatePresence>
    </div>
  );
};

export default DashboardPage;