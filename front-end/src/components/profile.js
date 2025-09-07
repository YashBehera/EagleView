import React, { useState, useEffect } from "react";
import { auth, db, storage } from "./firebase-config";
import { RecaptchaVerifier, signInWithPhoneNumber } from "firebase/auth";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { toast } from "react-toastify";
import { useNavigate } from "react-router-dom";
import Navbar from "./Navbar";

// Default profile picture
const defaultProfilePic = "https://via.placeholder.com/100?text=User";

function Profile({ auth_token }) {
  // State management
  const [userDetails, setUserDetails] = useState(null);
  const [loading, setLoading] = useState(true);
  const [phoneNumber, setPhoneNumber] = useState("");
  const [verificationCode, setVerificationCode] = useState("");
  const [confirmationResult, setConfirmationResult] = useState(null);
  const [editMode, setEditMode] = useState({
    name: false,
    email: false,
    username: false,
    about: false,
    investingSince: false,
    profilePic: false,
  });
  const [editValues, setEditValues] = useState({
    name: "",
    email: "",
    username: "",
    about: "",
    investingSince: "",
    profilePic: null,
  });
  const [brokerLoading, setBrokerLoading] = useState(false);
  const [activeSection, setActiveSection] = useState("details"); // For tab navigation
  const navigate = useNavigate();

  // Fetch user data
  const fetchUserData = async () => {
    auth.onAuthStateChanged(async (user) => {
      if (user) {
        const docRef = doc(db, "Users", user.uid);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          const userData = docSnap.data();
          userData.uid = user.uid;
          setUserDetails(userData);
          setEditValues({
            name: userData.firstName || "",
            email: userData.email || "",
            username: `@${userData.firstName?.toLowerCase()}${userData.uid.slice(0, 4)}` || "",
            about: userData.about || "Tell us about yourself!",
            investingSince: userData.investingSince || "",
            profilePic: null,
          });
        } else {
          console.log("User data not found!");
          navigate("/");
        }
        setLoading(false);
      } else {
        console.log("User not logged in!");
        setLoading(false);
        navigate("/");
      }
    });
  };

  useEffect(() => {
    fetchUserData();
  }, [navigate]);

  // reCAPTCHA setup for phone verification
  const setupRecaptcha = () => {
    try {
      if (!auth || typeof auth !== "object" || !auth.app) {
        throw new Error("Firebase Auth is not initialized properly.");
      }
      const recaptchaContainer = document.getElementById("recaptcha-container");
      if (!recaptchaContainer) {
        throw new Error("reCAPTCHA container not found");
      }
      if (typeof window === "undefined" || !window.document) {
        throw new Error("reCAPTCHA requires a browser environment");
      }
      if (window.recaptchaVerifier) {
        window.recaptchaVerifier.clear();
        window.recaptchaVerifier = null;
      }
      window.recaptchaVerifier = new RecaptchaVerifier(auth, "recaptcha-container", {
        size: "invisible",
        callback: () => console.log("Recaptcha verified"),
        "expired-callback": () => {
          console.log("Recaptcha expired");
          toast.error("reCAPTCHA expired, please try again", {
            position: "bottom-center",
          });
          window.recaptchaVerifier = null;
        },
      });
    } catch (error) {
      console.error("Error setting up reCAPTCHA:", error);
      toast.error(`Failed to initialize reCAPTCHA: ${error.message}`, {
        position: "bottom-center",
      });
      window.recaptchaVerifier = null;
    }
  };

  // Phone verification handlers
  const handleSendCode = async (e) => {
    e.preventDefault();
    try {
      if (!window.recaptchaVerifier) {
        setupRecaptcha();
      }
      if (!window.recaptchaVerifier) {
        throw new Error("reCAPTCHA verifier is not initialized");
      }
      const formattedPhoneNumber = phoneNumber.startsWith("+") ? phoneNumber : `+91${phoneNumber}`;
      const appVerifier = window.recaptchaVerifier;
      const result = await signInWithPhoneNumber(auth, formattedPhoneNumber, appVerifier);
      setConfirmationResult(result);
      toast.success("Verification code sent", {
        position: "top-center",
      });
    } catch (error) {
      console.error("Error sending verification code:", error);
      toast.error(error.message, {
        position: "bottom-center",
      });
      window.recaptchaVerifier = null;
    }
  };

  const handleVerifyCode = async (e) => {
    e.preventDefault();
    try {
      const user = auth.currentUser;
      if (!user) throw new Error("No user logged in");
      if (!confirmationResult) throw new Error("No verification in progress");
      await confirmationResult.confirm(verificationCode);
      const userDocRef = doc(db, "Users", user.uid);
      await updateDoc(userDocRef, {
        phoneNumber: phoneNumber.startsWith("+") ? phoneNumber : `+91${phoneNumber}`,
        phoneVerified: true,
      });
      toast.success("Phone number verified", {
        position: "top-center",
      });
      // Refresh user data after verification
      fetchUserData();
    } catch (error) {
      console.error("Error verifying code:", error);
      toast.error(error.message, {
        position: "bottom-center",
      });
    }
  };

  // Auth and profile actions
  const handleLogout = async () => {
    try {
      await auth.signOut();
      setUserDetails(null);
      navigate("/");
    } catch (error) {
      console.error("Error logging out:", error.message);
    }
  };

  const handleEditToggle = (field) => {
    setEditMode((prev) => ({ ...prev, [field]: !prev[field] }));
    if (!editMode[field]) {
      setEditValues({
        ...editValues,
        name: userDetails.firstName || "",
        email: userDetails.email || "",
        username: `@${userDetails.firstName?.toLowerCase()}${userDetails.uid?.slice(0, 4)}` || "",
        about: userDetails.about || "Tell us about yourself!",
        investingSince: userDetails.investingSince || "",
      });
    }
  };

  const handleInputChange = (e, field) => {
    setEditValues({ ...editValues, [field]: e.target.value });
  };

  const handleProfilePicChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (!["image/jpeg", "image/png"].includes(file.type)) {
        toast.error("Please upload a JPEG or PNG image", { position: "bottom-center" });
        return;
      }
      if (file.size > 5 * 1024 * 1024) {
        toast.error("Image size must be less than 5MB", { position: "bottom-center" });
        return;
      }
      setEditValues({ ...editValues, profilePic: file });
    }
  };

  const handleSave = async (field) => {
    try {
      const user = auth.currentUser;
      if (!user) throw new Error("No user logged in");
      const userDocRef = doc(db, "Users", user.uid);
      let updates = {};

      if (field === "name" && editValues.name.trim()) {
        updates.firstName = editValues.name;
      } else if (field === "name") {
        toast.error("Name cannot be empty", { position: "bottom-center" });
        return;
      }

      if (field === "email" && editValues.email.trim() && /\S+@\S+\.\S+/.test(editValues.email)) {
        updates.email = editValues.email;
      } else if (field === "email") {
        toast.error("Invalid email address", { position: "bottom-center" });
        return;
      }

      if (field === "username" && editValues.username.trim()) {
        updates.username = editValues.username.replace(/^@/, "");
      } else if (field === "username") {
        toast.error("Username cannot be empty", { position: "bottom-center" });
        return;
      }

      if (field === "about") {
        updates.about = editValues.about || "Tell us about yourself!";
      }

      if (field === "investingSince" && editValues.investingSince) {
        updates.investingSince = editValues.investingSince;
      }

      if (field === "profilePic" && editValues.profilePic) {
        const storageRef = ref(storage, `profile_pics/${user.uid}`);
        await uploadBytes(storageRef, editValues.profilePic);
        const photoURL = await getDownloadURL(storageRef);
        updates.photo = photoURL;
      }

      if (Object.keys(updates).length > 0) {
        await updateDoc(userDocRef, updates);
        setUserDetails((prev) => ({ ...prev, ...updates }));
        toast.success(`Updated successfully`, {
          position: "top-center",
        });
      }

      setEditMode((prev) => ({ ...prev, [field]: false }));
      setEditValues((prev) => ({ ...prev, profilePic: null }));
    } catch (error) {
      console.error(`Error updating ${field}:`, error);
      toast.error(`Update failed: ${error.message}`, { position: "bottom-center" });
    }
  };

  const handleCancel = (field) => {
    setEditMode((prev) => ({ ...prev, [field]: false }));
    setEditValues((prev) => ({
      ...prev,
      name: userDetails.firstName || "",
      email: userDetails.email || "",
      username: `@${userDetails.firstName?.toLowerCase()}${userDetails.uid?.slice(0, 4)}` || "",
      about: userDetails.about || "Tell us about yourself!",
      investingSince: userDetails.investingSince || "",
      profilePic: null,
    }));
  };

  // Broker connection handlers
  const connectBroker = async (brokerName) => {
    try {
      setBrokerLoading(true);
      await new Promise((resolve) => setTimeout(resolve, 2000));
      const mockResponse = {
        brokerName,
        accessToken: `mock-token-${Date.now()}`,
        connectedAt: new Date().toISOString(),
      };

      const user = auth.currentUser;
      if (!user) throw new Error("No user logged in");
      const userDocRef = doc(db, "Users", user.uid);
      await updateDoc(userDocRef, {
        brokerConnection: mockResponse,
      });

      setUserDetails((prev) => ({ ...prev, brokerConnection: mockResponse }));
      toast.success(`Connected to ${brokerName}`, { position: "top-center" });
    } catch (error) {
      console.error("Error connecting broker:", error);
      toast.error(`Connection failed: ${error.message}`, { position: "bottom-center" });
    } finally {
      setBrokerLoading(false);
    }
  };

  const disconnectBroker = async () => {
    try {
      setBrokerLoading(true);
      const user = auth.currentUser;
      if (!user) throw new Error("No user logged in");
      const userDocRef = doc(db, "Users", user.uid);
      await updateDoc(userDocRef, {
        brokerConnection: null,
      });

      setUserDetails((prev) => ({ ...prev, brokerConnection: null }));
      toast.success("Broker disconnected", { position: "top-center" });
    } catch (error) {
      console.error("Error disconnecting broker:", error);
      toast.error(`Disconnection failed: ${error.message}`, { position: "bottom-center" });
    } finally {
      setBrokerLoading(false);
    }
  };

  // Loading state
  if (loading) {
    return (
      <div className="flex w-screen flex-col items-center justify-center bg-gray-50 min-h-screen">
        <div className="relative w-16 h-16">
          <div className="absolute inset-0 border-t-4 border-gray-800 rounded-full animate-spin"></div>
          <div className="absolute inset-2 border-t-4 border-gray-300 rounded-full"></div>
        </div>
        <p className="mt-4 text-sm font-medium text-gray-800">Loading...</p>
      </div>
    );
  }

  // Tabs for navigation
  const tabs = [
    { id: "details", label: "Profile Details" },
    { id: "security", label: "Security" },
    { id: "connections", label: "Connections" },
  ];

  return (
    <div className="bg-gray-50 w-screen min-h-screen text-gray-900">
      <Navbar token={auth_token} />

      <div className="max-w-4xl mx-auto px-4 py-12 sm:px-6 lg:px-8">
        {/* Header section */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-12">
          <div className="flex items-center space-x-4 mb-4 md:mb-0">
            <div className="relative">
              <img
                src={userDetails?.photo || defaultProfilePic}
                alt="Profile"
                className="w-20 h-20 rounded-full object-cover border border-gray-200 bg-white shadow-sm"
              />
              {editMode.profilePic ? (
                <button
                  onClick={() => handleCancel("profilePic")}
                  className="absolute -top-2 -right-2 bg-white rounded-full w-6 h-6 flex items-center justify-center shadow-sm border border-gray-200"
                >
                  <span className="text-gray-500 text-sm">×</span>
                </button>
              ) : (
                <button
                  onClick={() => handleEditToggle("profilePic")}
                  className="absolute bottom-0 right-0 bg-gray-800 rounded-full w-6 h-6 flex items-center justify-center shadow-sm text-white"
                >
                  <svg className="w-3 h-3" viewBox="0 0 20 20" fill="currentColor">
                    <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                  </svg>
                </button>
              )}
            </div>
            <div>
              <h1 className="text-2xl font-medium text-gray-900">{userDetails?.firstName || "User"}</h1>
              <p className="text-sm text-gray-500">@{userDetails?.firstName?.toLowerCase() + userDetails?.uid?.slice(0, 4)}</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 transition-all duration-150"
          >
            <svg className="w-4 h-4 mr-2" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M3 3a1 1 0 00-1 1v12a1 1 0 001 1h12a1 1 0 001-1V7.414l-5-5H3zm7 2a1 1 0 00-1 1v1H5a1 1 0 100 2h4v1a1 1 0 001 1h.414l-1.707 1.707a1 1 0 101.414 1.414l3-3a1 1 0 000-1.414l-3-3A1 1 0 0010 5zm-1 8v-1h-.5a1 1 0 000 2H9v-1z" clipRule="evenodd" />
            </svg>
            Sign Out
          </button>
        </div>

        {/* Navigation tabs */}
        <nav className="mb-8 border-b border-gray-200">
          <div className="flex space-x-8">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveSection(tab.id)}
                className={`pb-4 text-sm font-medium ${activeSection === tab.id
                    ? "text-gray-900 border-b-2 border-gray-900"
                    : "text-gray-500 hover:text-gray-700 hover:border-gray-300"
                  } transition-all duration-150`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </nav>

        {/* Profile verification alert */}
        {userDetails && !userDetails.phoneVerified && (
          <div className="mb-8 bg-gray-50 border border-gray-200 rounded-lg p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="flex-shrink-0 bg-yellow-100 rounded-full p-1">
                  <svg className="w-5 h-5 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-gray-900">Complete Your Profile</h3>
                  <p className="text-xs text-gray-500 mt-1">Verify your phone number to secure your account</p>
                </div>
              </div>
              <button
                onClick={() => document.getElementById("phone-section").scrollIntoView({ behavior: "smooth" })}
                className="text-xs font-medium text-gray-900 hover:text-gray-700 transition-colors duration-150"
              >
                Verify Now →
              </button>
            </div>
          </div>
        )}

        {/* Main content sections */}
        {activeSection === "details" && (
          <div className="space-y-6">
            {/* Profile Information Card */}
            <div className="bg-white rounded-lg shadow-sm overflow-hidden border border-gray-100">
              <div className="p-6">
                <h2 className="text-lg font-medium text-gray-900 mb-6">Profile Information</h2>

                {/* Name field */}
                <div className="mb-6">
                  <div className="flex items-center justify-between mb-2">
                    <label className="block text-xs font-medium text-gray-500">Name</label>
                    {!editMode.name && (
                      <button onClick={() => handleEditToggle("name")} className="text-xs text-gray-500 hover:text-gray-900">
                        Edit
                      </button>
                    )}
                  </div>
                  {editMode.name ? (
                    <div className="flex items-center space-x-2">
                      <input
                        type="text"
                        value={editValues.name}
                        onChange={(e) => handleInputChange(e, "name")}
                        className="flex-grow py-2 px-3 border border-gray-300 rounded-md shadow-sm focus:ring-gray-500 focus:border-gray-500 sm:text-sm transition-colors duration-150"
                        placeholder="Your name"
                      />
                      <div className="flex space-x-2">
                        <button
                          onClick={() => handleSave("name")}
                          className="inline-flex items-center px-3 py-2 border border-transparent text-xs font-medium rounded-md shadow-sm text-white bg-gray-900 hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 transition-colors duration-150"
                        >
                          Save
                        </button>
                        <button
                          onClick={() => handleCancel("name")}
                          className="inline-flex items-center px-3 py-2 border border-gray-300 text-xs font-medium rounded-md shadow-sm text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 transition-colors duration-150"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <p className="text-sm text-gray-900">{userDetails.firstName || "Not set"}</p>
                  )}
                </div>

                {/* Email field */}
                <div className="mb-6">
                  <div className="flex items-center justify-between mb-2">
                    <label className="block text-xs font-medium text-gray-500">Email</label>
                    {!editMode.email && (
                      <button onClick={() => handleEditToggle("email")} className="text-xs text-gray-500 hover:text-gray-900">
                        Edit
                      </button>
                    )}
                  </div>
                  {editMode.email ? (
                    <div className="flex items-center space-x-2">
                      <input
                        type="email"
                        value={editValues.email}
                        onChange={(e) => handleInputChange(e, "email")}
                        className="flex-grow py-2 px-3 border border-gray-300 rounded-md shadow-sm focus:ring-gray-500 focus:border-gray-500 sm:text-sm transition-colors duration-150"
                        placeholder="your.email@example.com"
                      />
                      <div className="flex space-x-2">
                        <button
                          onClick={() => handleSave("email")}
                          className="inline-flex items-center px-3 py-2 border border-transparent text-xs font-medium rounded-md shadow-sm text-white bg-gray-900 hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 transition-colors duration-150"
                        >
                          Save
                        </button>
                        <button
                          onClick={() => handleCancel("email")}
                          className="inline-flex items-center px-3 py-2 border border-gray-300 text-xs font-medium rounded-md shadow-sm text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 transition-colors duration-150"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <p className="text-sm text-gray-900">{userDetails.email || "Not set"}</p>
                  )}
                  <p className="text-xs text-gray-500 mt-1">Only visible to you</p>
                </div>

                {/* Username field */}
                <div className="mb-6">
                  <div className="flex items-center justify-between mb-2">
                    <label className="block text-xs font-medium text-gray-500">Username</label>
                    {!editMode.username && (
                      <button onClick={() => handleEditToggle("username")} className="text-xs text-gray-500 hover:text-gray-900">
                        Edit
                      </button>
                    )}
                  </div>
                  {editMode.username ? (
                    <div className="flex items-center space-x-2">
                      <input
                        type="text"
                        value={editValues.username}
                        onChange={(e) => handleInputChange(e, "username")}
                        className="flex-grow py-2 px-3 border border-gray-300 rounded-md shadow-sm focus:ring-gray-500 focus:border-gray-500 sm:text-sm transition-colors duration-150"
                        placeholder="@username"
                      />
                      <div className="flex space-x-2">
                        <button
                          onClick={() => handleSave("username")}
                          className="inline-flex items-center px-3 py-2 border border-transparent text-xs font-medium rounded-md shadow-sm text-white bg-gray-900 hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 transition-colors duration-150"
                        >
                          Save
                        </button>
                        <button
                          onClick={() => handleCancel("username")}
                          className="inline-flex items-center px-3 py-2 border border-gray-300 text-xs font-medium rounded-md shadow-sm text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 transition-colors duration-150"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <p className="text-sm text-gray-900">@{userDetails?.firstName?.toLowerCase() + userDetails?.uid?.slice(0, 4) || "username"}</p>
                  )}
                </div>

                {/* Phone number section */}
                <div className="mb-6" id="phone-section">
                  <div className="flex items-center justify-between mb-2">
                    <label className="block text-xs font-medium text-gray-500">Phone Number</label>
                    <span className={`text-xs font-medium ${userDetails.phoneVerified ? "text-green-600" : "text-amber-600"}`}>
                      {userDetails.phoneVerified ? "Verified" : "Not Verified"}
                    </span>
                  </div>
                  {userDetails.phoneVerified ? (
                    <p className="text-sm text-gray-900">{userDetails.phoneNumber || "Not set"}</p>
                  ) : (
                    <div>
                      <div id="recaptcha-container"></div>
                      {!confirmationResult ? (
                        <form onSubmit={handleSendCode} className="space-y-4 mt-2">
                          <div className="flex space-x-2">
                            <input
                              type="tel"
                              className="flex-grow py-2 px-3 border border-gray-300 rounded-md shadow-sm focus:ring-gray-500 focus:border-gray-500 sm:text-sm transition-colors duration-150"
                              placeholder="Enter phone number"
                              value={phoneNumber}
                              onChange={(e) => setPhoneNumber(e.target.value)}
                              required
                            />
                            <button
                              type="submit"
                              className="inline-flex items-center px-3 py-2 border border-transparent text-xs font-medium rounded-md shadow-sm text-white bg-gray-900 hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 transition-colors duration-150"
                            >
                              Send Code
                            </button>
                          </div>
                          <p className="text-xs text-gray-500">Use +91 prefix for Indian numbers if needed</p>
                        </form>
                      ) : (
                        <form onSubmit={handleVerifyCode} className="space-y-4 mt-2">
                          <div className="flex space-x-2">
                            <input
                              type="text"
                              className="flex-grow py-2 px-3 border border-gray-300 rounded-md shadow-sm focus:ring-gray-500 focus:border-gray-500 sm:text-sm transition-colors duration-150"
                              placeholder="Enter 6-digit code"
                              value={verificationCode}
                              onChange={(e) => setVerificationCode(e.target.value)}
                              required
                            />
                            <button
                              type="submit"
                              className="inline-flex items-center px-3 py-2 border border-transparent text-xs font-medium rounded-md shadow-sm text-white bg-gray-900 hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 transition-colors duration-150"
                            >
                              Verify
                            </button>
                          </div>
                        </form>
                      )}
                    </div>
                  )}
                  <p className="text-xs text-gray-500 mt-1">This is your unique ID on EagleView</p>
                </div>

                {/* Investment experience field */}
                <div className="mb-6">
                  <div className="flex items-center justify-between mb-2">
                    <label className="block text-xs font-medium text-gray-500">Investing Experience</label>
                    {!editMode.investingSince && (
                      <button onClick={() => handleEditToggle("investingSince")} className="text-xs text-gray-500 hover:text-gray-900">
                        Edit
                      </button>
                    )}
                  </div>
                  {editMode.investingSince ? (
                    <div className="flex items-center space-x-2">
                      <select
                        value={editValues.investingSince}
                        onChange={(e) => handleInputChange(e, "investingSince")}
                        className="flex-grow py-2 px-3 border border-gray-300 rounded-md shadow-sm focus:ring-gray-500 focus:border-gray-500 sm:text-sm transition-colors duration-150"
                      >
                        <option value="">Select experience level</option>
                        <option value="beginner">Beginner (0-2 years)</option>
                        <option value="intermediate">Intermediate (2-5 years)</option>
                        <option value="experienced">Experienced (5+ years)</option>
                        <option value="professional">Professional Investor</option>
                      </select>
                      <div className="flex space-x-2">
                        <button
                          onClick={() => handleSave("investingSince")}
                          className="inline-flex items-center px-3 py-2 border border-transparent text-xs font-medium rounded-md shadow-sm text-white bg-gray-900 hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 transition-colors duration-150"
                        >
                          Save
                        </button>
                        <button
                          onClick={() => handleCancel("investingSince")}
                          className="inline-flex items-center px-3 py-2 border border-gray-300 text-xs font-medium rounded-md shadow-sm text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 transition-colors duration-150"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <p className="text-sm text-gray-900">
                      {userDetails.investingSince ?
                        userDetails.investingSince.charAt(0).toUpperCase() + userDetails.investingSince.slice(1) :
                        "Not specified"}
                    </p>
                  )}
                </div>

                {/* About field */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="block text-xs font-medium text-gray-500">About</label>
                    {!editMode.about && (
                      <button onClick={() => handleEditToggle("about")} className="text-xs text-gray-500 hover:text-gray-900">
                        Edit
                      </button>
                    )}
                  </div>
                  {editMode.about ? (
                    <div className="space-y-3">
                      <textarea
                        value={editValues.about}
                        onChange={(e) => handleInputChange(e, "about")}
                        rows={4}
                        className="w-full py-2 px-3 border border-gray-300 rounded-md shadow-sm focus:ring-gray-500 focus:border-gray-500 sm:text-sm transition-colors duration-150"
                        placeholder="Tell us about yourself"
                      />
                      <div className="flex justify-end space-x-2">
                        <button
                          onClick={() => handleSave("about")}
                          className="inline-flex items-center px-3 py-2 border border-transparent text-xs font-medium rounded-md shadow-sm text-white bg-gray-900 hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 transition-colors duration-150"
                        >
                          Save
                        </button>
                        <button
                          onClick={() => handleCancel("about")}
                          className="inline-flex items-center px-3 py-2 border border-gray-300 text-xs font-medium rounded-md shadow-sm text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 transition-colors duration-150"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <p className="text-sm text-gray-900">{userDetails.about || "Tell us about yourself!"}</p>
                  )}
                </div>

                {/* Handle profile picture upload */}
                {editMode.profilePic && (
                  <div className="mt-6 p-4 border border-gray-200 rounded-md bg-gray-50">
                    <h3 className="text-sm font-medium text-gray-900 mb-3">Update Profile Picture</h3>
                    <div className="flex flex-col space-y-3">
                      <input
                        type="file"
                        accept="image/jpeg, image/png"
                        onChange={handleProfilePicChange}
                        className="text-sm text-gray-500"
                      />
                      {editValues.profilePic && (
                        <div className="relative w-24 h-24">
                          <img
                            src={URL.createObjectURL(editValues.profilePic)}
                            alt="Preview"
                            className="w-full h-full object-cover rounded-full"
                          />
                        </div>
                      )}
                      <div className="flex space-x-2">
                        <button
                          onClick={() => handleSave("profilePic")}
                          className="inline-flex items-center px-3 py-2 border border-transparent text-xs font-medium rounded-md shadow-sm text-white bg-gray-900 hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 transition-colors duration-150"
                          disabled={!editValues.profilePic}
                        >
                          Upload
                        </button>
                        <button
                          onClick={() => handleCancel("profilePic")}
                          className="inline-flex items-center px-3 py-2 border border-gray-300 text-xs font-medium rounded-md shadow-sm text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 transition-colors duration-150"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {activeSection === "security" && (
          <div className="space-y-6">
            {/* Password and Security Card */}
            <div className="bg-white rounded-lg shadow-sm overflow-hidden border border-gray-100">
              <div className="p-6">
                <h2 className="text-lg font-medium text-gray-900 mb-6">Security Settings</h2>

                {/* Password section */}
                <div className="mb-6">
                  <div className="flex items-center justify-between mb-2">
                    <label className="block text-xs font-medium text-gray-500">Password</label>
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-900">●●●●●●●●</p>
                      <p className="text-xs text-gray-500 mt-1">Last updated 30 days ago</p>
                    </div>
                    <button
                      className="text-xs font-medium text-gray-900 hover:text-gray-700 transition-colors duration-150"
                      onClick={() => {
                        toast.info("Password reset link sent to your email", { position: "top-center" });
                      }}
                    >
                      Reset Password
                    </button>
                  </div>
                </div>

                {/* Two-factor authentication */}
                <div className="mb-6">
                  <div className="flex items-center justify-between mb-2">
                    <label className="block text-xs font-medium text-gray-500">Two-Factor Authentication</label>
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-900">
                        {userDetails.phoneVerified ? "Enabled via SMS" : "Not enabled"}
                      </p>
                      <p className="text-xs text-gray-500 mt-1">Adds an extra layer of security to your account</p>
                    </div>
                    {!userDetails.phoneVerified ? (
                      <button
                        className="text-xs font-medium text-gray-900 hover:text-gray-700 transition-colors duration-150"
                        onClick={() => document.getElementById("phone-section").scrollIntoView({ behavior: "smooth" })}
                      >
                        Set Up
                      </button>
                    ) : (
                      <button
                        className="text-xs font-medium text-gray-900 hover:text-gray-700 transition-colors duration-150"
                        onClick={() => {
                          toast.info("Two-factor settings can be managed in the app settings", { position: "top-center" });
                        }}
                      >
                        Manage
                      </button>
                    )}
                  </div>
                </div>

                {/* Activity log */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="block text-xs font-medium text-gray-500">Recent Activity</label>
                  </div>
                  <div className="border border-gray-200 rounded-md overflow-hidden">
                    <ul className="divide-y divide-gray-200">
                      <li className="p-4 hover:bg-gray-50">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm font-medium text-gray-900">Profile updated</p>
                            <p className="text-xs text-gray-500 mt-1">Today at 10:30 AM</p>
                          </div>
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                            Success
                          </span>
                        </div>
                      </li>
                      <li className="p-4 hover:bg-gray-50">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm font-medium text-gray-900">Sign-in from new device</p>
                            <p className="text-xs text-gray-500 mt-1">Yesterday at 6:43 PM</p>
                          </div>
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                            New
                          </span>
                        </div>
                      </li>
                      <li className="p-4 hover:bg-gray-50">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm font-medium text-gray-900">Password changed</p>
                            <p className="text-xs text-gray-500 mt-1">30 days ago</p>
                          </div>
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                            Success
                          </span>
                        </div>
                      </li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeSection === "connections" && (
          <div className="space-y-6">
            {/* Connected Services Card */}
            <div className="bg-white rounded-lg shadow-sm overflow-hidden border border-gray-100">
              <div className="p-6">
                <h2 className="text-lg font-medium text-gray-900 mb-6">Connected Brokers</h2>

                {userDetails?.brokerConnection ? (
                  <div className="mb-6">
                    <div className="flex items-center space-x-4 p-4 border border-green-100 bg-green-50 rounded-md">
                      <div className="flex-shrink-0 w-10 h-10 bg-white rounded-full flex items-center justify-center">
                        <svg className="w-6 h-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      </div>
                      <div className="flex-grow">
                        <h3 className="text-sm font-medium text-gray-900">{userDetails.brokerConnection.brokerName}</h3>
                        <p className="text-xs text-gray-500 mt-1">
                          Connected on {new Date(userDetails.brokerConnection.connectedAt).toLocaleDateString()}
                        </p>
                      </div>
                      <button
                        onClick={disconnectBroker}
                        disabled={brokerLoading}
                        className="inline-flex items-center px-3 py-2 border border-gray-300 text-xs font-medium rounded-md shadow-sm text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 transition-colors duration-150"
                      >
                        {brokerLoading ? 'Disconnecting...' : 'Disconnect'}
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="mb-6">
                    <p className="text-sm text-gray-500 mb-4">
                      Connect your broker to access trading features and portfolio tracking
                    </p>

                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                      {/* Zerodha */}
                      <div className="relative rounded-lg border border-gray-200 bg-white p-6 shadow-sm flex flex-col hover:shadow-md transition-shadow duration-150">
                        <div className="flex items-center mb-4">
                          <div className="flex-shrink-0 h-12 w-12 bg-white rounded-md flex items-center justify-center">
                            <span className="text-xl font-bold text-gray-900">Z</span>
                          </div>
                          <div className="ml-4">
                            <h3 className="text-lg font-medium text-gray-900">Zerodha</h3>
                            <p className="text-xs text-gray-500">Popular discount broker</p>
                          </div>
                        </div>
                        <button
                          onClick={() => connectBroker('Zerodha')}
                          disabled={brokerLoading}
                          className="mt-auto inline-flex w-full justify-center items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-gray-900 hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 transition-colors duration-150"
                        >
                          {brokerLoading ? 'Connecting...' : 'Connect'}
                        </button>
                      </div>

                      {/* Upstox */}
                      <div className="relative rounded-lg border border-gray-200 bg-white p-6 shadow-sm flex flex-col hover:shadow-md transition-shadow duration-150">
                        <div className="flex items-center mb-4">
                          <div className="flex-shrink-0 h-12 w-12 bg-white rounded-md flex items-center justify-center">
                            <span className="text-xl font-bold text-gray-900">U</span>
                          </div>
                          <div className="ml-4">
                            <h3 className="text-lg font-medium text-gray-900">Upstox</h3>
                            <p className="text-xs text-gray-500">Easy trading platform</p>
                          </div>
                        </div>
                        <button
                          onClick={() => connectBroker('Upstox')}
                          disabled={brokerLoading}
                          className="mt-auto inline-flex w-full justify-center items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-gray-900 hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 transition-colors duration-150"
                        >
                          {brokerLoading ? 'Connecting...' : 'Connect'}
                        </button>
                      </div>

                      {/* Angel Broking */}
                      <div className="relative rounded-lg border border-gray-200 bg-white p-6 shadow-sm flex flex-col hover:shadow-md transition-shadow duration-150">
                        <div className="absolute top-0 right-0 p-1">
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                            Popular
                          </span>
                        </div>
                        <div className="flex items-center mb-4">
                          <div className="flex-shrink-0 h-12 w-12 bg-white rounded-md flex items-center justify-center">
                            <span className="text-xl font-bold text-gray-900">A</span>
                          </div>
                          <div className="ml-4">
                            <h3 className="text-lg font-medium text-gray-900">Angel One</h3>
                            <p className="text-xs text-gray-500">Full-service broker</p>
                          </div>
                        </div>
                        <button
                          onClick={() => connectBroker('Angel One')}
                          disabled={brokerLoading}
                          className="mt-auto inline-flex w-full justify-center items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-gray-900 hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 transition-colors duration-150"
                        >
                          {brokerLoading ? 'Connecting...' : 'Connect'}
                        </button>
                      </div>

                      {/* Groww */}
                      <div className="relative rounded-lg border border-gray-200 bg-white p-6 shadow-sm flex flex-col hover:shadow-md transition-shadow duration-150">
                        <div className="flex items-center mb-4">
                          <div className="flex-shrink-0 h-12 w-12 bg-white rounded-md flex items-center justify-center">
                            <span className="text-xl font-bold text-gray-900">G</span>
                          </div>
                          <div className="ml-4">
                            <h3 className="text-lg font-medium text-gray-900">Groww</h3>
                            <p className="text-xs text-gray-500">Stocks, funds, IPOs</p>
                          </div>
                        </div>
                        <button
                          onClick={() => connectBroker('Groww')}
                          disabled={brokerLoading}
                          className="mt-auto inline-flex w-full justify-center items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-gray-900 hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 transition-colors duration-150"
                        >
                          {brokerLoading ? 'Connecting...' : 'Connect'}
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                <h2 className="text-lg font-medium text-gray-900 mb-4 mt-8">Connected Apps</h2>
                <div className="border-t border-gray-200 pt-4">
                  <p className="text-sm text-gray-500">No third-party applications connected yet.</p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default Profile;