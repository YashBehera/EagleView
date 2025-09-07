import React from "react";
import { GoogleAuthProvider, signInWithPopup } from "firebase/auth";
import { auth, db } from "./firebase-config";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { toast } from "react-toastify";
import { useNavigate } from "react-router-dom";

function SignInWithGoogle({ onLoginSuccess }) {
  const navigate = useNavigate();
  const provider = new GoogleAuthProvider();

  const googleLogin = async () => {
    try {
      const result = await signInWithPopup(auth, provider);
      const user = result.user;

      // Check if the user already exists in Firestore
      const userDocRef = doc(db, "Users", user.uid);
      const userDoc = await getDoc(userDocRef);

      if (!userDoc.exists()) {
        // New user: Create a Firestore document
        await setDoc(userDocRef, {
          email: user.email,
          firstName: user.displayName?.split(" ")[0] || "",
          lastName: user.displayName?.split(" ").slice(1).join(" ") || "",
          photo: user.photoURL || "",
          phoneNumber: "",
          phoneVerified: false,
        });
      }

      // Check profile completion
      const userData = userDoc.exists() ? userDoc.data() : (await getDoc(userDocRef)).data();
      if (!userData.phoneNumber || !userData.phoneVerified) {
        navigate("/profile");
      } else {
        navigate("/");
      }

      toast.success("User logged in Successfully", {
        position: "top-center",
      });

      if (onLoginSuccess) {
        onLoginSuccess();
      }
    } catch (error) {
      console.error(error.message);
      toast.error(error.message, {
        position: "bottom-center",
      });
    }
  };

  return (
    <div>
      <p className="text-[12px] mt-2 text-center">--Or continue with--</p>
      <div
        style={{ display: "flex", justifyContent: "center", cursor: "pointer" }}
        onClick={googleLogin}
      >
        <img src={require("./google.png")} width={"60%"} alt="Google Sign-In" />
      </div>
    </div>
  );
}

export default SignInWithGoogle;