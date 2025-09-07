import React, { useState, useRef } from "react";
import { createUserWithEmailAndPassword, signOut } from "firebase/auth";
import { auth, db } from "./firebase-config";
import { setDoc, doc } from "firebase/firestore";
import { toast } from "react-toastify";
import Login from "./login";
import logo from "./logo1.jpg";
import SignUpGoogle from "./signInWithGoogle";
import login from "./Login.png";
import { useNavigate } from "react-router-dom";


function Register({ onRegisterSuccess }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fname, setFname] = useState("");
  const [lname, setLname] = useState("");
  const [showLogin, setShowLogin] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(true);
  const dropdownRef = useRef(null);
  const navigate = useNavigate();

  const handleRegister = async (e) => {
    e.preventDefault();
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      if (user) {
        await setDoc(doc(db, "Users", user.uid), {
          email: user.email,
          firstName: fname,
          lastName: lname,
          photo: "",
          phoneNumber: "",
          phoneVerified: false,
        });
      }

      toast.success("User Registered Successfully!!", {
        position: "top-center",
      });

      if (onRegisterSuccess) {
        onRegisterSuccess();
      }

      // Redirect to /profile
      navigate("/profile");
    } catch (error) {
      console.log(error.message);
      toast.error(error.message, {
        position: "bottom-center",
      });
    }
  };

  // Toggle to Login view
  const handleLoginClick = () => {
    setShowLogin(true);
  };

  return (
    <>
      {showLogin ? (
        <div>
          <Login />
        </div>
      ) : isDropdownOpen && (
        <div>
          <div
            ref={dropdownRef}
            className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-50 w-11/12 sm:w-3/4 md:w-1/2 lg:w-2/5"
          >
            <div
              className="bg-white rounded-3xl shadow-xl p-3 text-black animate-fade-in"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex flex-col sm:flex-row gap-4">
                <img
                  src={login}
                  alt="Login"
                  className="w-full sm:w-1/2 h-60 sm:h-80 rounded-lg object-cover"
                />
                <div className="bg-gray-100 h-[25rem] w-[19rem] text-black rounded-3xl shadow-xl shadow-gray-400 justify-center items-center">
                  <div className="flex mt-1 ml-10 w-60">
                    <span className="text-3xl font-bold text-black">EagleView</span>
                    <div>
                      <img src={logo} className="h-8 ml-2" />
                    </div>
                  </div>
                  <div>
                    <form onSubmit={handleRegister} className="flex flex-col items-center justify-center">
                      <h3 className="font-semibold text-lg mt-0">Sign Up</h3>

                      <div className="mb-1 gap-0 text-sm">
                        <label className="text-base font-medium">First name</label>
                        <br />
                        <input
                          type="text"
                          className="form-control border-2 border-solid rounded-lg px-1 w-48 focus:outline-none"
                          placeholder="First name"
                          onChange={(e) => setFname(e.target.value)}
                          required
                        />
                      </div>
                      <div className="mb-1 gap-0 text-sm">
                        <label className="text-base font-medium">Last name</label>
                        <br />
                        <input
                          type="text"
                          className="form-control border-2 border-solid rounded-lg px-1 w-48 focus:outline-none"
                          placeholder="Last name"
                          onChange={(e) => setLname(e.target.value)}
                        />
                      </div>

                      <div className="mb-1 gap-0 text-sm">
                        <label className="text-base font-medium">Email address</label>
                        <br />
                        <input
                          type="email"
                          className="form-control border-2 border-solid rounded-lg px-1 w-48 focus:outline-none"
                          placeholder="Enter email"
                          onChange={(e) => setEmail(e.target.value)}
                          required
                        />
                      </div>

                      <div className="mb-1 gap-0 text-sm">
                        <label className="text-base font-medium">Password</label>
                        <br />
                        <input
                          type="password"
                          className="form-control border-2 border-solid rounded-lg px-1 w-48 focus:outline-none"
                          placeholder="Enter password"
                          onChange={(e) => setPassword(e.target.value)}
                          required
                        />
                      </div>

                      <button className=" flex items-center justify-center h-7 w-48 bg-blue-600 rounded-lg text-white">
                        <div type="submit" className="btn btn-primary">
                          <span className="flex items-center justify-center">
                            Sign Up
                          </span>
                        </div>
                      </button>
                      <p className="forgot-password text-right text-xs mt-1">
                        Already registered?{" "}
                        <button
                          type="button"
                          className="text-blue-600"
                          onClick={handleLoginClick}
                        >
                          Login
                        </button>
                      </p>
                      <SignUpGoogle />
                    </form>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default Register;
