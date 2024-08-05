import schoolLogo from "../../assets/scclogo.png";
import dashboardlogo from "../../assets/dashboardlogo.png";
import { getAuth, signOut } from "firebase/auth";
import { useNavigate } from "react-router-dom";
import { initializeApp } from "firebase/app";
import { useEffect, useState } from "react";
import Lottie from "lottie-react";
import loadingAnimation from "../../assets/loadinganimation2.json";

function UserBook() {
  const [loading, setLoading] = useState(true); // Loading state
  const userProfilePicture = localStorage.getItem("userProfilePicture") || "";
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

  const app = initializeApp(firebaseConfig);
  const auth = getAuth(app);

  useEffect(() => {
    // Simulate data loading with a timeout
    const loadData = async () => {
      // Simulate loading delay
      setTimeout(() => {
        setLoading(false);
      }, 1000); // Adjust delay as needed
    };

    loadData();
  }, []);

  const handleLogout = () => {
    signOut(auth)
      .then(() => {
        console.log("User logged out");
        // Navigate to SignIn page after successful logout
        navigate("/SignIn");
      })
      .catch((error) => {
        console.error("Error logging out:", error.message);
      });
  };

  const handleRoomsClick = () => {
    navigate("/UserAvailableRoom");
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="flex flex-col items-center">
          <Lottie
            animationData={loadingAnimation}
            loop={true}
            autoplay={true}
            style={{ height: 100, width: 100 }}
          />
          <p className="mt-4 text-gray-700">Loading, Please Wait...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col md:flex-row">
      <aside className="w-full md:w-64 bg-gray-100 p-4">
        <div className="mb-8 flex justify-center">
          <img
            src={schoolLogo}
            alt="Logo"
            className="h-18 w-16 md:h-18 md:w-18 rounded-full"
          />
        </div>
        <nav>
          <ul>
            <li className="mb-4 bg-gray-200 border-2 border-gray-200 rounded-full p-1">
              <a
                href="/UserBook"
                className="flex items-center p-2 hover:bg-gray-300 rounded-md"
              >
                <img src={dashboardlogo} alt="Dashboard" className="h-6 w-6" />
                <span className="ml-2 text-black font-bold">BOOK ROOM</span>
              </a>
            </li>
          </ul>
        </nav>
      </aside>
      <main className="flex-1 p-6 bg-white">
        <header className="mb-6 flex flex-col md:flex-row justify-between items-center">
          <h1 className="text-2xl font-bold text-black">Hi, Welcome back 👋</h1>
          <div className="flex items-center space-x-4 mt-4 md:mt-0">
            <button onClick={handleLogout} className="btn text-white font-bold">
              LOGOUT
            </button>
            <button className="btn btn-ghost btn-circle avatar">
              <img
                src={userProfilePicture}
                alt="Profile"
                className="rounded-full h-12 w-12 md:h-16 md:w-16"
              />
            </button>
          </div>
        </header>
        <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
          <div className="card bg-white shadow-md p-4">
            <h2 className="text-sm text-black mb-2">Book</h2>
            <p className="mb-4 text-black text-2xl font-bold">Rooms</p>
            <button
              onClick={handleRoomsClick}
              className="btn text-white font-bold mt-2 w-1/2"
            >
              Proceed
            </button>
          </div>
          <div className="card bg-white shadow-md p-4">
            <h2 className="text-sm text-black mb-2">Borrow</h2>
            <p className="mb-4 text-black text-2xl font-bold">Equipments</p>
            <button className="btn text-white font-bold mt-2 w-1/2">
              Proceed
            </button>
          </div>
        </section>
      </main>
    </div>
  );
}

export default UserBook;
