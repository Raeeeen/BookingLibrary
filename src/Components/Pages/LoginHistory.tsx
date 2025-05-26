import { useEffect, useState } from "react";
import { ref, get, getDatabase, remove } from "firebase/database";
import schoolLogo from "../../assets/scclogo.png";
import dashboardlogo from "../../assets/dashboardlogo.png";
import roomslogo from "../../assets/roomslogo.png";
import equipmentslogo from "../../assets/equipmentslogo.png";
import reportslogo from "../../assets/reportslogo.png";
import qrCode from "../../assets/qrcodelogo.png";
import reschedule from "../../assets/rescheduling.png";
import loginHistoryLogo from "../../assets/loginhistory.png";
import coursesLogo from "../../assets/courses.png";
import "react-toastify/dist/ReactToastify.css";
import { initializeApp } from "firebase/app";
import Lottie from "lottie-react";
import loadingAnimation from "../../assets/loadinganimation2.json";
import borrowLogo from "../../assets/borrowicon.png";
import managedataLogo from "../../assets/managelogo.png";

interface LoginHistoryEntry {
  userId: string;
  currentDate: string;
  currentTime: string;
}

interface User {
  email: string;
}

function LoginHistory() {
  const [loginHistory, setLoginHistory] = useState<LoginHistoryEntry[]>([]);
  const [users, setUsers] = useState<{ [key: string]: User }>({});
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false); // State to manage modal visibility
  const [showAddOptions, setShowAddOptions] = useState(false);

  const firebaseConfig = {

  };

  const app = initializeApp(firebaseConfig);
  const db = getDatabase(app);

  useEffect(() => {
    const fetchLoginHistory = async () => {
      try {
        const loginData: LoginHistoryEntry[] = [];

        const loginHistorySnapshot = await get(ref(db, `loginhistory`));
        if (loginHistorySnapshot.exists()) {
          const allLoginHistories = loginHistorySnapshot.val();

          for (const loginId in allLoginHistories) {
            const loginHistory = allLoginHistories[loginId];
            const { currentDate, currentTime, userid } = loginHistory;
            loginData.push({
              userId: userid,
              currentDate,
              currentTime,
            });
          }
        } else {
          console.log("No login history found in the database.");
        }

        setLoginHistory(loginData);
      } catch (error) {
        console.error("Error fetching login history:", error);
      } finally {
        setLoading(false);
      }
    };

    const fetchUsers = async () => {
      try {
        const usersSnapshot = await get(ref(db, "users"));
        if (usersSnapshot.exists()) {
          const allUsers = usersSnapshot.val();
          setUsers(allUsers);
        } else {
          console.log("No users found in the database.");
        }
      } catch (error) {
        console.error("Error fetching users:", error);
      }
    };

    setLoading(true);
    fetchUsers();
    fetchLoginHistory();
  }, []);

  // Function to clear login history
  const clearLoginHistory = async () => {
    try {
      const loginHistoryRef = ref(db, "loginhistory");
      await remove(loginHistoryRef);
      setLoginHistory([]);
      console.log("Login history cleared successfully.");
    } catch (error) {
      console.error("Error clearing login history:", error);
    } finally {
      setIsModalOpen(false); // Close modal after clearing history
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="w-16 h-16">
          <Lottie animationData={loadingAnimation} loop={true} />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col md:flex-row">
      <aside className="w-full md:w-64 bg-green-800 p-4 h-screen overflow-y-auto scrollbar-hide">
        {/* Set height for the sidebar */}
        <style>
          {`
      .scrollbar-hide {
        scrollbar-width: none; /* Firefox */
      }
      .scrollbar-hide::-webkit-scrollbar {
        display: none; /* Chrome, Safari, and Opera */
      }
    `}
        </style>
        <div className="mb-8 flex justify-center">
          <img
            src={schoolLogo}
            alt="Logo"
            className="h-24 w-24 md:h-40 md:w-32 rounded-full" // Adjusted size for the logo
          />
        </div>
        <nav className="h-full">
          <ul>
            {/* Existing Dashboard Link */}
            <li className="mb-4">
              <a
                href="/Dashboard"
                className="flex items-center p-2 hover:bg-green-600 rounded-md"
              >
                <img src={dashboardlogo} alt="Dashboard" className="h-6 w-6" />
                <span className="ml-2 text-white font-bold">Dashboard</span>
              </a>
            </li>
            <li className="mb-4">
              <a
                href="/BookBorrow"
                className="flex items-center p-2 hover:bg-green-600 rounded-md"
              >
                <img src={borrowLogo} alt="Book/Borrow" className="h-6 w-6" />
                <span className="ml-2 text-white font-bold">Book/Borrow</span>
              </a>
            </li>

            {/* Add option with dropdown */}
            <li className="mb-4">
              <button
                onClick={() => setShowAddOptions(!showAddOptions)} // Toggle add options
                className="flex items-center p-2 hover:bg-green-600 rounded-md w-full text-left"
              >
                <img
                  src={managedataLogo}
                  alt="Manage Data"
                  className="h-6 w-6"
                />
                <span className="ml-2 text-white font-bold">Manage Data</span>
                <svg
                  className={`ml-auto transition-transform ${
                    showAddOptions ? "transform rotate-180" : ""
                  }`}
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  width="1.5em"
                  height="1.5em"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 9l-7 7-7-7"
                  />
                </svg>
              </button>

              {/* Conditional rendering of the add options */}
              {showAddOptions && (
                <div className="pl-8 pt-3">
                  <ul>
                    <li className="mb-4">
                      <a
                        href="/Rooms"
                        className="flex items-center p-2 hover:bg-green-600 rounded-md"
                      >
                        <img src={roomslogo} alt="Rooms" className="h-6 w-6" />
                        <span className="ml-2 text-white font-bold">Rooms</span>
                      </a>
                    </li>
                    <li className="mb-4">
                      <a
                        href="/Equipments"
                        className="flex items-center p-2 hover:bg-green-600 rounded-md"
                      >
                        <img
                          src={equipmentslogo}
                          alt="Equipments"
                          className="h-6 w-6"
                        />
                        <span className="ml-2 text-white font-bold">
                          Equipments
                        </span>
                      </a>
                    </li>
                    <li className="mb-4">
                      <a
                        href="/Courses"
                        className="flex items-center p-2 hover:bg-green-600 rounded-md"
                      >
                        <img
                          src={coursesLogo}
                          alt="Courses"
                          className="h-6 w-6"
                        />
                        <span className="ml-2 text-white font-bold">
                          Courses
                        </span>
                      </a>
                    </li>
                  </ul>
                </div>
              )}
            </li>

            {/* Other navigation items */}
            <li className="mb-4">
              <a
                href="/reports"
                className="flex items-center p-2 hover:bg-green-600 rounded-md"
              >
                <img src={reportslogo} alt="Reports" className="h-6 w-6" />
                <span className="ml-2 text-white font-bold">Transactions</span>
              </a>
            </li>
            <li className="mb-4">
              <a
                href="/Reschedule"
                className="flex items-center p-2 hover:bg-green-600 rounded-md"
              >
                <img src={reschedule} alt="Reschedule" className="h-6 w-6" />
                <span className="ml-2 text-white font-bold">Reschedule</span>
              </a>
            </li>
            <li className="mb-4">
              <a
                href="/QrCode"
                className="flex items-center p-2 hover:bg-green-600 rounded-md"
              >
                <img src={qrCode} alt="QR" className="h-6 w-6" />
                <span className="ml-2 text-white font-bold">QR Code</span>
              </a>
            </li>
            <li className="mb-4">
              <a
                href="/ReportsTable"
                className="flex items-center p-2 hover:bg-green-600 rounded-md"
              >
                <img
                  src={reportslogo}
                  alt="Reports Table"
                  className="h-6 w-6"
                />
                <span className="ml-2 text-white font-bold">Reports Table</span>
              </a>
            </li>
            <li className="mb-4 bg-green-800 border-2 border-green-600 rounded-full p-1">
              <a
                href="/LoginHistory"
                className="flex items-center p-2 hover:bg-green-600 rounded-md"
              >
                <img
                  src={loginHistoryLogo}
                  alt="Login History"
                  className="h-6 w-6"
                />
                <span className="ml-2 text-white font-bold">Login History</span>
              </a>
            </li>
          </ul>
        </nav>
      </aside>

      <main className="flex-1 p-6 bg-white overflow-auto max-h-screen text-black">
        <h1 className="text-2xl font-bold mb-4 text-black">Login History</h1>
        <button
          onClick={() => setIsModalOpen(true)} // Open the modal on button click
          className="mb-4 bg-red-500 text-white py-1 px-3 rounded hover:bg-red-600"
        >
          Clear Login History
        </button>

        <table className="min-w-full bg-white border border-gray-200">
          <thead>
            <tr className="bg-gray-100 border-b">
              <th className="text-left p-4">Email</th>
              <th className="text-left p-4">Login Date</th>
              <th className="text-left p-4">Login Time</th>
            </tr>
          </thead>
          <tbody>
            {loginHistory.map((record, index) => (
              <tr key={index} className="border-b hover:bg-gray-50">
                <td className="p-4">
                  {users[record.userId]?.email || "Unknown"}{" "}
                </td>
                <td className="p-4">{record.currentDate}</td>
                <td className="p-4">{record.currentTime}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </main>

      {/* Confirmation Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50 text-black">
          <div className="bg-white p-6 rounded-lg shadow-lg max-w-sm">
            <h2 className="text-lg font-bold mb-4">
              Do you want to clear login history?
            </h2>
            <div className="flex justify-end">
              <button
                onClick={clearLoginHistory} // Call function to clear login history
                className="py-1 px-3 bg-black text-white rounded hover:bg-red-600 font-bold"
              >
                Confirm
              </button>
              <button
                onClick={() => setIsModalOpen(false)} // Close modal
                className="ml-4 py-1 px-3 bg-gray-300 rounded hover:bg-gray-400 font-bold"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default LoginHistory;
