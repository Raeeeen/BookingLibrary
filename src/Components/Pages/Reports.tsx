import React, { useEffect, useState } from "react";
import {
  DataSnapshot,
  ref as dbRef,
  getDatabase,
  onValue,
  ref,
} from "firebase/database";
import schoolLogo from "../../assets/scclogo.png";
import dashboardlogo from "../../assets/dashboardlogo.png";
import roomslogo from "../../assets/roomslogo.png";
import equipmentslogo from "../../assets/equipmentslogo.png";
import reschedule from "../../assets/rescheduling.png";
import reportslogo from "../../assets/reportslogo.png";
import qrCode from "../../assets/qrcodelogo.png";
import coursesLogo from "../../assets/courses.png";
import loginHistoryLogo from "../../assets/loginhistory.png";
import { initializeApp } from "firebase/app";
import Lottie from "lottie-react";
import loadingAnimation from "../../assets/loadinganimation2.json";
import borrowLogo from "../../assets/borrowicon.png";
import managedataLogo from "../../assets/managelogo.png";

interface Transaction {
  id: string;
  date: string;
  startTime: string;
  endTime: string;
  roomName?: string;
  equipmentName?: string;
  equipmentDescription?: string;
  type: "room" | "equipment";
  borrowedBy: string; // Added borrowedBy field
  startTimeFormatted?: string; // Add this line
}

interface User {
  id: string;
  name: string;
  email: string;
  photoURL?: string;
}

interface Booking {
  id: string;
  roomName?: string;
  equipmentName?: string;
  equipmentDescription?: string;
  studentsSelected?: string[]; // Optional since it may not be used for IMC/AVR
  date: string;
  equipments?: string[]; // New field for equipment array
  equipments1?: string[]; // New field for equipment array
  startTime: string;
  tables?: string; // New field for tables
  endTime: string;
  borrowedBy: string;
}

const Reports: React.FC = () => {
  const [recentBookings, setRecentBookings] = useState<Booking[]>([]);
  const [users, setUsers] = useState<{ [key: string]: User }>({});
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"rooms" | "equipments">("rooms");
  const [equipmentDescriptions, setEquipmentDescriptions] = useState<{
    [key: string]: string;
  }>({});
  const [tablesData, setTablesData] = useState<{ [key: string]: string }>({});
  const [showAddOptions, setShowAddOptions] = useState(false);
  const [currentTransactions, setCurrentTransactions] = useState<Transaction[]>(
    []
  );
  const [searchQuery, setSearchQuery] = useState("");

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
  const db = getDatabase(app);

  useEffect(() => {
    const transactionsRef = ref(db, "TransactionHistory");

    const fetchTransactions = () => {
      onValue(transactionsRef, (snapshot) => {
        const transactionsData: Transaction[] = [];
        snapshot.forEach((childSnapshot) => {
          const userTransactions = childSnapshot.val();

          // Process room transactions
          if (userTransactions.rooms) {
            Object.entries(userTransactions.rooms).forEach(
              ([id, transaction]) => {
                const roomTransaction = transaction as Record<string, any>;

                // Ensure all required fields are included
                const transactionData: Transaction = {
                  id,
                  borrowedBy: childSnapshot.key, // Store user ID from transaction path
                  type: "room",
                  startTime: roomTransaction.startTime || "N/A", // Provide a fallback value
                  endTime: roomTransaction.endTime || "N/A", // Provide a fallback value
                  date: roomTransaction.date || "N/A", // Provide a fallback value
                  startTimeFormatted: roomTransaction.startTime
                    ? formatTime(roomTransaction.startTime)
                    : "No Time Provided", // Format time if present
                };

                transactionsData.push(transactionData);
              }
            );
          }

          // Process equipment transactions
          if (userTransactions.equipments) {
            Object.entries(userTransactions.equipments).forEach(
              ([id, transaction]) => {
                const equipmentTransaction = transaction as Record<string, any>;

                // Ensure all required fields are included
                const transactionData: Transaction = {
                  id,
                  borrowedBy: childSnapshot.key, // Store user ID from transaction path
                  type: "equipment",
                  startTime: equipmentTransaction.startTime || "N/A", // Provide a fallback value
                  endTime: equipmentTransaction.endTime || "N/A", // Provide a fallback value
                  date: equipmentTransaction.date || "N/A", // Provide a fallback value
                  startTimeFormatted: equipmentTransaction.startTime
                    ? formatTime(equipmentTransaction.startTime)
                    : "No Time Provided", // Format time if present
                };

                transactionsData.push(transactionData);
              }
            );
          }
        });
        setCurrentTransactions(transactionsData);
      });
    };

    fetchTransactions();
  }, []);

  useEffect(() => {
    const usersRef = dbRef(db, "users");
    onValue(usersRef, (snapshot: DataSnapshot) => {
      const data = snapshot.val();
      const usersList: { [key: string]: User } = {};

      for (const key in data) {
        const userData = data[key];
        usersList[key] = {
          id: key,
          name: userData.name,
          email: userData.email,
          photoURL: userData.photoURL,
        };
      }

      setUsers(usersList);
    });

    const bookingsRef = dbRef(db, "bookrooms");
    const equipmentsRef = dbRef(db, "bookequipments");

    const handleNewData = (snapshot: DataSnapshot, isRoom: boolean) => {
      const data = snapshot.val();
      const bookingsList: Booking[] = [];

      for (const bookingId in data) {
        const booking = data[bookingId];
        bookingsList.push({
          id: bookingId,
          roomName: isRoom ? booking.roomName : undefined,
          equipmentName: !isRoom ? booking.equipmentName : undefined,
          equipmentDescription: !isRoom
            ? booking.equipmentDescription
            : undefined,
          studentsSelected: isRoom ? booking.studentsSelected : undefined,
          equipments: isRoom ? booking.equipments : undefined,
          equipments1: !isRoom ? booking.equipments : [],
          date: booking.date,
          startTime: booking.startTime || "N/A",
          endTime: booking.endTime || "N/A",
          tables: isRoom ? booking.tables || [] : [],
          borrowedBy: booking.borrowedBy || "",
        });
      }

      return bookingsList;
    };

    const updateBookings = () => {
      let allBookings: Booking[] = [];

      onValue(bookingsRef, (snapshot: DataSnapshot) => {
        const roomBookings = handleNewData(snapshot, true);
        allBookings = [...allBookings, ...roomBookings];
      });

      onValue(equipmentsRef, (snapshot: DataSnapshot) => {
        const equipmentBookings = handleNewData(snapshot, false);
        allBookings = [...allBookings, ...equipmentBookings];

        // Sort and update the state after fetching all data
        allBookings.sort(
          (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
        );
        setRecentBookings(allBookings);
        setLoading(false);
      });
    };

    updateBookings();

    return;
  }, [db, recentBookings]);

  useEffect(() => {
    const fetchTablesData = () => {
      const bookroomsRef = dbRef(db, "bookrooms");

      onValue(bookroomsRef, (snapshot: DataSnapshot) => {
        const data = snapshot.val();
        const tables: { [key: string]: string } = {};

        for (const bookingId in data) {
          const booking = data[bookingId];
          // Ensure tables is a string
          tables[bookingId] =
            typeof booking.tables === "string" ? booking.tables : "";
        }

        console.log("Tables Data:", tables); // Debug line
        setTablesData(tables);
      });
    };

    fetchTablesData();
  }, [db]);

  useEffect(() => {
    const fetchEquipmentDescriptions = () => {
      const equipmentsRef = dbRef(db, "equipments");

      onValue(equipmentsRef, (snapshot: DataSnapshot) => {
        const data = snapshot.val();
        const descriptions: { [key: string]: string } = {};

        for (const key in data) {
          descriptions[key] = data[key].description || "No Description";
        }

        console.log("Equipment Descriptions:", descriptions); // Debug line
        setEquipmentDescriptions(descriptions);
      });
    };

    fetchEquipmentDescriptions();
  }, [db]);

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

  const formatTime = (time: string): string => {
    const [hour, minute] = time.split(":").map(Number);
    const period = hour >= 12 ? "PM" : "AM";
    const adjustedHour = hour % 12 || 12;
    const formattedMinute = minute.toString().padStart(2, "0");

    return `${adjustedHour}:${formattedMinute} ${period}`;
  };

  // Filter bookings based on search query and activeTab
  const filteredBookings = recentBookings.filter((booking) => {
    const userName = users[booking.borrowedBy]?.name || "";
    const roomName = booking.roomName || "";
    const equipmentName = booking.equipmentName || "";

    // Check if the search query matches any relevant field depending on activeTab
    const matchesSearchQuery =
      userName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      roomName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      equipmentName.toLowerCase().includes(searchQuery.toLowerCase());

    // Filter based on activeTab
    if (activeTab === "rooms") {
      return roomName && matchesSearchQuery;
    } else if (activeTab === "equipments") {
      return equipmentName && matchesSearchQuery;
    }

    return false;
  });

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
                <span className="ml-2 text-white font-bold">
                  Booking/Borrowing
                </span>
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
            <li className="mb-4 bg-green-800 border-2 border-green-600 rounded-full p-1">
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
            <li className="mb-4">
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

      <main className="flex-1 p-6 bg-white overflow-auto max-h-screen">
        <div className="p-4">
          <div className="flex justify-between mb-4">
            <div className="tabs">
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
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div className="col-span-2">
              <div className="card shadow-lg p-4">
                <h2 className="card-title text-black font-bold mb-5">
                  {activeTab === "rooms"
                    ? "Room Transaction History"
                    : "Equipment Transaction History"}
                </h2>

                {/* Transaction History Table */}
                <div
                  className="overflow-y-auto text-black"
                  style={{ maxHeight: "calc(100vh - 200px)" }}
                >
                  {currentTransactions.length > 0 ? (
                    <table className="min-w-full bg-white border">
                      <thead>
                        <tr className="bg-gray-100">
                          <th className="py-2 px-4 border-b text-left">Date</th>
                          <th className="py-2 px-4 border-b text-left">Name</th>
                          <th className="py-2 px-4 border-b text-left">
                            Start Time
                          </th>
                          <th className="py-2 px-4 border-b text-left">
                            End Time
                          </th>
                          <th className="py-2 px-4 border-b text-left">
                            {activeTab === "rooms"
                              ? "Booked By"
                              : "Borrowed By"}
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {currentTransactions
                          .filter((transaction) =>
                            activeTab === "rooms"
                              ? transaction.type === "room"
                              : transaction.type === "equipment"
                          )
                          .map((transaction) => (
                            <tr
                              key={transaction.id}
                              className="hover:bg-gray-50 text-black"
                            >
                              <td className="py-2 px-4 border-b">
                                {transaction.date}
                              </td>
                              <td className="py-2 px-4 border-b">
                                {transaction.type === "room"
                                  ? transaction.roomName
                                  : transaction.equipmentName}
                              </td>
                              <td className="py-2 px-4 border-b">
                                {formatTime(transaction.startTime)}
                              </td>
                              <td className="py-2 px-4 border-b">
                                {formatTime(transaction.endTime)}
                              </td>
                              <td className="py-2 px-4 border-b">
                                {users[transaction.borrowedBy]?.name ||
                                  "Unknown User"}
                              </td>
                            </tr>
                          ))}
                      </tbody>
                    </table>
                  ) : (
                    <p className="text-center text-gray-500">
                      No transactions found.
                    </p>
                  )}
                </div>
              </div>
            </div>
            <div className="p-4">
              <div className="card shadow-lg p-4">
                <h2 className="card-title text-black font-bold text-xl mb-4">
                  {activeTab === "equipments" ? "Borrowings" : "Bookings"}
                </h2>

                {/* Search Bar */}
                <input
                  type="text"
                  placeholder={`Search ${
                    activeTab === "equipments" ? "Borrowings" : "Bookings"
                  }...`}
                  className="w-full pl-3 pr-3 py-2 rounded bg-white text-black font-bold placeholder-gray-500 border border-black focus:border-black focus:outline-none mb-5"
                  style={{ boxSizing: "border-box" }}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />

                {/* Scrollable list of bookings */}
                <ul
                  className="space-y-4 overflow-y-auto"
                  style={{ maxHeight: "calc(100vh - 250px)" }}
                >
                  {filteredBookings.map((booking) => (
                    <li
                      key={booking.id}
                      className="flex flex-col border-b pb-4"
                    >
                      <div className="flex items-center space-x-4 mb-2">
                        {users[booking.borrowedBy] ? (
                          <div className="flex items-center space-x-4">
                            {users[booking.borrowedBy].photoURL ? (
                              <img
                                src={users[booking.borrowedBy].photoURL}
                                alt={`${
                                  users[booking.borrowedBy].name
                                }'s profile`}
                                className="h-12 w-12 rounded-full border-2 border-gray-300"
                              />
                            ) : (
                              <div className="h-12 w-12 rounded-full bg-gray-200 flex items-center justify-center text-gray-500">
                                {users[booking.borrowedBy].name.charAt(0)}
                              </div>
                            )}
                            <div className="flex flex-col">
                              <p className="text-xl text-black font-extrabold">
                                {users[booking.borrowedBy].name}
                              </p>
                              <p className="text-sm text-black">
                                {users[booking.borrowedBy].email}
                              </p>
                            </div>
                          </div>
                        ) : (
                          <p>No user information available</p>
                        )}
                      </div>
                      <div className="flex flex-col ml-4">
                        <p className="text-xl text-black font-extrabold">
                          {booking.roomName ||
                            `${booking.equipmentName || "No equipment name"}${
                              booking.equipmentDescription
                                ? ` (${booking.equipmentDescription})`
                                : ""
                            }`}
                        </p>
                        <p className="text-xs text-gray-600">
                          {`${booking.date} ${formatTime(
                            booking.startTime
                          )} - ${formatTime(booking.endTime)}`}
                        </p>
                        <p className="text-xs text-black">
                          {activeTab === "rooms" ? (
                            booking.roomName === "IMC/AVR" &&
                            booking.equipments?.length ? (
                              <>
                                Equipments:{" "}
                                <span className="font-bold">
                                  {booking.equipments
                                    .map(
                                      (item) =>
                                        equipmentDescriptions[item] || item
                                    )
                                    .join(", ")}
                                </span>
                              </>
                            ) : (
                              <>
                                Students:{" "}
                                <span className="font-bold">
                                  {booking.studentsSelected
                                    ?.map(
                                      (studentId) =>
                                        users[studentId]?.name || studentId
                                    )
                                    .join(", ") || "N/A"}
                                </span>
                              </>
                            )
                          ) : (
                            <>
                              Equipments:{" "}
                              <span className="font-bold">
                                {booking.equipments1
                                  ?.map(
                                    (item) =>
                                      equipmentDescriptions[item] || item
                                  )
                                  .join(", ")}
                              </span>
                            </>
                          )}
                        </p>

                        {activeTab === "rooms" &&
                          booking.roomName === "Tutoring Room" && (
                            <div>
                              <p className="text-black text-xs">
                                Tables:{" "}
                                {tablesData[booking.id]
                                  ? tablesData[booking.id]
                                      .split(",")
                                      .map((table) => table.trim())
                                      .join(", ")
                                  : "No tables available"}
                              </p>
                            </div>
                          )}
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Reports;
