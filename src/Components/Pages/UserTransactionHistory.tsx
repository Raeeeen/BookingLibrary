import { useState, useEffect } from "react";
import { getDatabase, ref, onValue, remove } from "firebase/database";
import { getAuth, onAuthStateChanged } from "firebase/auth";
import schoolLogo from "../../assets/scclogo.png";
import dashboardlogo from "../../assets/dashboardlogo.png";
import borrowLogo from "../../assets/borrowicon.png";
import historyLogo from "../../assets/reportslogo.png";
import faqLogo from "../../assets/faqlogo.png";
import guidelinesLogo from "../../assets/guidelineslogo.png";
import { initializeApp } from "firebase/app";
import Lottie from "lottie-react";
import loadingAnimation from "../../assets/loadinganimation2.json";

// Define an interface for transactions
interface Transaction {
  id: string;
  type: "room" | "equipment";
  roomName?: string;
  equipmentName?: string;
  startTime: string;
  endTime: string;
  date: string;
}

function UserTransactionHistory() {
  const [activeTab, setActiveTab] = useState<"rooms" | "equipments">("rooms");
  const [roomTransactions, setRoomTransactions] = useState<Transaction[]>([]);
  const [equipmentTransactions, setEquipmentTransactions] = useState<
    Transaction[]
  >([]);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [loadingRooms, setLoadingRooms] = useState(true);
  const [loadingEquipments, setLoadingEquipments] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const firebaseConfig = {

  };

  const app = initializeApp(firebaseConfig);
  const auth = getAuth(app);
  const db = getDatabase(app);

  // Get the current user from Firebase Auth
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        console.log("Current User ID:", user.uid); // Log the current user ID
        setCurrentUserId(user.uid);
      } else {
        console.log("No user is currently logged in.");
        setCurrentUserId(null); // Set user ID to null if no user is logged in
      }
    });

    // Cleanup the listener on unmount
    return () => unsubscribe();
  }, [auth]);

  // Fetch room transactions from Firebase
  useEffect(() => {
    if (currentUserId) {
      console.log("Fetching room transactions for user:", currentUserId); // Log when fetching starts
      const roomsRef = ref(db, `TransactionHistory/${currentUserId}/rooms`);

      const roomsListener = onValue(roomsRef, (snapshot) => {
        const roomsData = snapshot.val();
        const fetchedRooms: Transaction[] = [];

        if (roomsData) {
          Object.keys(roomsData).forEach((key) => {
            fetchedRooms.push({
              id: key,
              type: "room",
              roomName: roomsData[key].roomName,
              startTime: roomsData[key].startTime,
              endTime: roomsData[key].endTime,
              date: roomsData[key].date,
            });
          });
          console.log("Fetched room transactions:", fetchedRooms); // Log fetched room transactions
        } else {
          console.log("No room transactions found."); // Log if no room data exists
        }

        setRoomTransactions(fetchedRooms);
        setLoadingRooms(false); // Set loading to false after fetching data
      });

      // Cleanup the listener on unmount
      return () => {
        roomsListener();
      };
    }
  }, [currentUserId]);

  // Fetch equipment transactions from Firebase
  useEffect(() => {
    if (currentUserId) {
      console.log("Fetching equipment transactions for user:", currentUserId); // Log when fetching starts
      const equipmentsRef = ref(
        db,
        `TransactionHistory/${currentUserId}/equipments`
      );

      const equipmentsListener = onValue(equipmentsRef, (snapshot) => {
        const equipmentsData = snapshot.val();
        const fetchedEquipments: Transaction[] = [];

        if (equipmentsData) {
          Object.keys(equipmentsData).forEach((key) => {
            fetchedEquipments.push({
              id: key,
              type: "equipment",
              equipmentName: equipmentsData[key].equipmentName,
              startTime: equipmentsData[key].startTime,
              endTime: equipmentsData[key].endTime,
              date: equipmentsData[key].date,
            });
          });
          console.log("Fetched equipment transactions:", fetchedEquipments); // Log fetched equipment transactions
        } else {
          console.log("No equipment transactions found."); // Log if no equipment data exists
        }

        setEquipmentTransactions(fetchedEquipments);
        setLoadingEquipments(false); // Set loading to false after fetching data
      });

      // Cleanup the listener on unmount
      return () => {
        equipmentsListener();
      };
    }
  }, [currentUserId]);

  const convertTo12HourFormat = (time: string): string => {
    const [hour, minute] = time.split(":").map(Number);
    const formattedHour = hour % 12 || 12; // Convert hour to 12-hour format
    const ampm = hour >= 12 ? "PM" : "AM"; // Determine AM or PM
    return `${formattedHour}:${minute.toString().padStart(2, "0")} ${ampm}`; // Format with leading zero for minutes
  };

  const clearTransactions = () => {
    if (currentUserId) {
      const path =
        activeTab === "rooms"
          ? `TransactionHistory/${currentUserId}/rooms`
          : `TransactionHistory/${currentUserId}/equipments`;
      const transactionsRef = ref(db, path);

      remove(transactionsRef)
        .then(() => {
          console.log(
            `Successfully cleared ${activeTab} transactions for user:`,
            currentUserId
          );
          // Optionally reset the state if you want to clear the displayed data
          activeTab === "rooms"
            ? setRoomTransactions([])
            : setEquipmentTransactions([]);
        })
        .catch((error) => {
          console.error("Error clearing transactions:", error);
        });
    } else {
      console.log("No user is currently logged in. Cannot clear transactions.");
    }
  };

  if (loadingRooms || loadingEquipments) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="w-16 h-16">
          <Lottie animationData={loadingAnimation} loop={true} />
        </div>
      </div>
    );
  }

  // Determine the current transactions based on the active tab
  const currentTransactions =
    activeTab === "rooms" ? roomTransactions : equipmentTransactions;

  return (
    <div className="min-h-screen flex flex-col md:flex-row">
      {/* Sidebar */}
      <aside className="w-full md:w-64 bg-green-800 p-4 h-screen overflow-y-auto scrollbar-hide">
        <div className="mb-8 flex justify-center">
          <img
            src={schoolLogo}
            alt="Logo"
            className="h-24 w-24 md:h-40 md:w-32 rounded-full" // Adjusted size for the logo
          />
        </div>
        <nav>
          <ul>
            <li className="mb-4">
              <a
                href="/UserDashboard"
                className="flex items-center p-2 hover:bg-green-600 rounded-md"
              >
                <img src={dashboardlogo} alt="Dashboard" className="h-6 w-6" />
                <span className="ml-2 text-white font-bold">Dashboard</span>
              </a>
            </li>
            <li className="mb-4">
              <a
                href="/UserBookBorrow"
                className="flex items-center p-2 hover:bg-green-600 rounded-md"
              >
                <img src={borrowLogo} alt="Dashboard" className="h-6 w-6" />
                <span className="ml-2 text-white font-bold">
                  Booking/Borrowing
                </span>
              </a>
            </li>
            <li className="mb-4 bg-green-800 border-2 border-green-600 rounded-full p-1">
              <a
                href="/UserTransactionHistory"
                className="flex items-center p-2 hover:bg-green-600 rounded-md"
              >
                <img src={historyLogo} alt="Dashboard" className="h-6 w-6" />
                <span className="ml-2 text-white font-bold">
                  Transaction History
                </span>
              </a>
            </li>
            <li className="mb-4">
              <a
                href="/UserFAQ"
                className="flex items-center p-2 hover:bg-green-600 rounded-md"
              >
                <img src={faqLogo} alt="Dashboard" className="h-6 w-6" />
                <span className="ml-2 text-white font-bold">FAQ</span>
              </a>
            </li>
            <li className="mb-4">
              <a
                href="/UserGuidelinesAndPrivacy"
                className="flex items-center p-2 hover:bg-green-600 rounded-md"
              >
                <img src={guidelinesLogo} alt="Dashboard" className="h-6 w-6" />
                <span className="ml-2 text-white font-bold">
                  Guidelines and Privacy
                </span>
              </a>
            </li>
          </ul>
        </nav>
      </aside>

      {/* Main content */}
      <main className="flex-1 p-6 bg-white text-black overflow-hidden">
        {/* Tabs */}
        <div className="tabs mb-4">
          <a
            onClick={() => setActiveTab("rooms")}
            className={`tab tab-bordered ${
              activeTab === "rooms"
                ? "tab-active bg-gray-300 border rounded-md content-center"
                : ""
            } text-xl font-bold text-black`}
          >
            Rooms
          </a>
          <a
            onClick={() => setActiveTab("equipments")}
            className={`tab tab-bordered ${
              activeTab === "equipments"
                ? "tab-active bg-gray-300 rounded-md content-center"
                : ""
            } text-xl font-bold text-black`}
          >
            Equipments
          </a>
        </div>

        {/* Trigger button for the modal */}
        <button
          onClick={() => setIsModalOpen(true)} // Open the modal
          className="py-2 px-4 bg-blue-500 text-white rounded hover:bg-blue-600 mb-4"
        >
          Clear Transaction History
        </button>

        {/* Transaction History Table */}
        <div
          className="overflow-y-auto"
          style={{ maxHeight: "calc(100vh - 200px)" }}
        >
          {currentTransactions.length > 0 ? (
            <table className="min-w-full bg-white border">
              <thead>
                <tr className="bg-gray-100">
                  <th className="py-2 px-4 border-b text-left">Date</th>
                  <th className="py-2 px-4 border-b text-left">Name</th>
                  <th className="py-2 px-4 border-b text-left">Start Time</th>
                  <th className="py-2 px-4 border-b text-left">End Time</th>
                </tr>
              </thead>
              <tbody>
                {currentTransactions.map((transaction) => (
                  <tr
                    key={transaction.id}
                    className="hover:bg-gray-50 text-black"
                  >
                    <td className="py-2 px-4 border-b">{transaction.date}</td>
                    <td className="py-2 px-4 border-b">
                      {transaction.type === "room"
                        ? transaction.roomName
                        : transaction.equipmentName}
                    </td>
                    <td className="py-2 px-4 border-b">
                      {convertTo12HourFormat(transaction.startTime)}
                    </td>
                    <td className="py-2 px-4 border-b">
                      {convertTo12HourFormat(transaction.endTime)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <p className="text-center text-gray-500">No transactions found.</p>
          )}
        </div>

        {/* Confirmation Modal */}
        {isModalOpen && (
          <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50 text-black">
            <div className="bg-white p-6 rounded-lg shadow-lg max-w-sm">
              <h2 className="text-lg font-bold mb-4">
                Do you want to clear login history?
              </h2>
              <p className="mb-4 text-gray-700">
                This action cannot be undone. Please confirm if you want to
                proceed.
              </p>
              <div className="flex justify-end">
                <button
                  onClick={() => {
                    clearTransactions(); // Call function to clear login history
                    setIsModalOpen(false); // Close modal after confirmation
                  }}
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
      </main>
    </div>
  );
}

export default UserTransactionHistory;
