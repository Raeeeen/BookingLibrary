import { useState } from "react";
import GoogleIcon from "../assets/googleicon.png";
import columbanBackground from "../assets/columbanBackgroundFinal.png";
import schoolLogo from "../assets/scclogo.png";
import { initializeApp } from "firebase/app";
import { getDatabase, ref, set } from "firebase/database";
import { getAuth, GoogleAuthProvider, signInWithPopup } from "firebase/auth";
import {
  getStorage,
  ref as storageRef,
  uploadBytes,
  getDownloadURL,
} from "firebase/storage";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { useNavigate } from "react-router-dom";
import Lottie from "lottie-react";
import loadingAnimation from "../assets/loadinganimation2.json"; // Path to your Lottie JSON file

function SignIn() {
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const firebaseConfig = {
    apiKey: "AIzaSyCHdD3lqfVXCO00zQcaWpZFpAqKfIIVnk8",
    authDomain: "library-7feb9.firebaseapp.com",
    databaseURL: "https://library-7feb9-default-rtdb.firebaseio.com",
    projectId: "library-7feb9",
    storageBucket: "library-7feb9.appspot.com",
    messagingSenderId: "977659880455",
    appId: "1:977659880455:web:f1c2a95baaace7f2caf6a2",
  };

  // Initialize Firebase
  const app = initializeApp(firebaseConfig);
  const auth = getAuth(app);
  const db = getDatabase(app);
  const storage = getStorage(app);

  const handleGoogleLogin = async () => {
    try {
      const provider = new GoogleAuthProvider();
      provider.setCustomParameters({ hd: "sccpag.edu.ph" });
      const userCredential = await signInWithPopup(auth, provider);
      const user = userCredential.user;

      const userName = user.displayName || "Unknown";
      const userId = user.uid;
      const userPhotoURL = user.photoURL || ""; // Get profile picture URL

      // Set loading to true before starting async tasks
      setLoading(true);

      // If the user has a profile picture
      if (userPhotoURL) {
        // Fetch the image blob from the URL
        const response = await fetch(userPhotoURL);
        const blob = await response.blob();

        // Create a reference to store the profile picture
        const profilePicRef = storageRef(
          storage,
          `users/${userId}/profile.jpg`
        );
        await uploadBytes(profilePicRef, blob);

        // Get the download URL of the uploaded image
        const downloadURL = await getDownloadURL(profilePicRef);

        // Save user data including the profile picture URL to the Realtime Database
        await set(ref(db, `users/${userId}`), {
          name: userName,
          email: user.email,
          photoURL: downloadURL, // Save profile picture URL
        });

        // Store profile picture URL in local storage
        localStorage.setItem("userProfilePicture", downloadURL);

        toast.success("Login with Gsuite successful!");

        // Simulate a delay to show the loading animation
        setTimeout(() => {
          setLoading(false);
          if (user.email === "scclibrary3@gmail.com") {
            navigate("/Dashboard");
          } else {
            navigate("/UserBook");
          }
        }, 2000); // Adjust the timeout as needed
      } else {
        // Handle case where there is no profile picture URL
        await set(ref(db, `users/${userId}`), {
          name: userName,
          email: user.email,
          photoURL: "", // No profile picture URL
        });

        toast.success("Login with Gsuite successful!");

        // Simulate a delay to show the loading animation
        setTimeout(() => {
          setLoading(false);
          if (user.email === "scclibrary3@gmail.com") {
            navigate("/Dashboard");
          } else {
            navigate("/UserBook");
          }
        }, 3000); // Adjust the timeout as needed
      }
    } catch (error: any) {
      console.error("Error signing in with Gsuite:", error.message);
      toast.error("Error signing in with Gsuite. Please try again.");
    }
  };

  return (
    <div className="flex flex-col min-h-screen md:flex-row">
      <div
        className="w-full md:w-3/5 bg-cover bg-center relative"
        style={{ backgroundImage: `url(${columbanBackground})` }}
      >
        {/* Left Side with Background Image */}
        <div className="absolute top-4 left-4 md:top-8 md:left-8 flex items-center">
          <img
            src={schoolLogo}
            alt="School Logo"
            className="w-8 h-10 md:w-12 md:h-14 mr-2 md:mr-4"
          />
          <span className="text-white text-lg md:text-xl font-bold leading-none">
            SAINT COLUMBAN COLLEGE
          </span>
        </div>
      </div>
      <div className="w-full md:w-2/5 flex items-center justify-center p-8 md:p-16 bg-black">
        {loading ? (
          <div className="flex flex-col items-center">
            <Lottie
              animationData={loadingAnimation}
              loop
              autoplay
              style={{ height: 100, width: 100 }}
            />
            <p className="mt-4 text-gray-700">Redirecting to Dashboard...</p>
          </div>
        ) : (
          <div className="bg-black p-6 md:p-10 rounded-lg shadow-lg w-full max-w-md">
            <h1 className="text-xl md:text-2xl font-bold mb-4 md:mb-6 text-center text-white">
              LOGIN
            </h1>
            <button
              className="btn btn-outline w-full flex items-center justify-center"
              onClick={handleGoogleLogin}
            >
              <img
                src={GoogleIcon}
                alt="Google Icon"
                className="w-4 h-4 md:w-5 md:h-5 mr-2"
              />
              LOGIN GSUITE ACCOUNT
            </button>
            <p className="text-gray-500 mt-4 text-center text-sm md:text-base">
              By clicking login, you agree to our Terms of Service and Privacy
              Policy.
            </p>
          </div>
        )}
        <ToastContainer />
      </div>
    </div>
  );
}

export default SignIn;
