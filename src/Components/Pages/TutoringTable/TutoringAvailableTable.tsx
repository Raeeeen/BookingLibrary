import React, { useEffect, useState } from "react";
import { initializeApp, FirebaseApp } from "firebase/app";
import {
  getDatabase,
  ref as dbRef,
  onValue,
  Database,
  ref,
} from "firebase/database";
import schoolLogo from "../../../assets/scclogo.png";
import dashboardlogo from "../../../assets/dashboardlogo.png";
import roomslogo from "../../../assets/roomslogo.png";
import equipmentslogo from "../../../assets/equipmentslogo.png";
import reschedule from "../../../assets/rescheduling.png";
import reportslogo from "../../../assets/reportslogo.png";
import qrCode from "../../../assets/qrcodelogo.png";
import borrowLogo from "../../../assets/borrowicon.png";
import managedataLogo from "../../../assets/managelogo.png";
import loginHistoryLogo from "../../../assets/loginhistory.png";
import coursesLogo from "../../../assets/courses.png";
import Modal from "./../Modal";
import { useNavigate } from "react-router-dom";

interface User {
  name: string;
}

// Define a type for the TableCard props
interface TableCardProps {
  title: string;
  image: string;
  onBook: () => void;
  onViewBookings: () => void;
  available: boolean; // New prop to indicate availability
}

interface Table {
  title: string;
  imageUrl: string;
  available: boolean;
  room: string;
}

interface Booking {
  date: string;
  startTime: string;
  endTime: string;
  borrowedBy: string[];
}

interface UsersData {
  [key: string]: User;
}

const TutoringAvailableTable: React.FC = () => {
  const [filter, setFilter] = useState<"Available" | "Not Available">(
    "Available"
  );
  const [tables, setTables] = useState<Table[]>([]);
  const [users, setUsers] = useState<any>({});
  const [selectedRoomBookings, setSelectedRoomBookings] = useState<Booking[]>(
    []
  );
  const [isModalOpen, setIsModalOpen] = useState(false); // Modal open state
  const [currentRoomTitle, setCurrentRoomTitle] = useState("");
  const roomTitle = "Tutoring Room";
  const navigate = useNavigate();
  const [showAddOptions, setShowAddOptions] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  // Firebase configuration
  const firebaseConfig = {
   
  };

  // Initialize Firebase
  const app: FirebaseApp = initializeApp(firebaseConfig);
  const db: Database = getDatabase(app);

  useEffect(() => {
    const tablesRef = dbRef(db, "tables");

    onValue(tablesRef, (snapshot) => {
      const data = snapshot.val();
      const tableArray: Table[] = [];

      for (const key in data) {
        const table = data[key];
        if (table.room === roomTitle) {
          // Filter for Collaboratory Room
          tableArray.push({
            title: table.description,
            imageUrl: table.imageUrl,
            available: table.availability,
            room: table.room, // Ensure room is captured
          });
        }
      }

      console.log("Fetched tables:", tableArray);
      setTables(tableArray);
    });
  }, [db, roomTitle]);

  useEffect(() => {
    const fetchUsers = () => {
      const usersRef = ref(db, "users");
      onValue(usersRef, (snapshot) => {
        const data = snapshot.val() as UsersData | null;
        setUsers(data || {});
      });
    };

    fetchUsers();
  }, [db]);

  // Helper function to format time to 12-hour format with AM/PM
  const formatTime = (time: string): string => {
    const [hourStr, minute] = time.split(":");
    let hour = parseInt(hourStr, 10);
    const amPm = hour >= 12 ? "PM" : "AM";
    hour = hour % 12;
    if (hour === 0) hour = 12;
    return `${hour.toString().padStart(2, "0")}:${minute} ${amPm}`;
  };

  const handleBookClick = (roomTitle: string, tableTitle: string) => {
    navigate("/TutoringBookTable", { state: { roomTitle, tableTitle } });
  };

  const handleViewBookingsClick = (tableTitle: string) => {
    const bookingsRef = dbRef(db, "bookrooms"); // Ensure you're referencing 'bookrooms'

    onValue(
      bookingsRef,
      (snapshot) => {
        const data = snapshot.val();
        const bookings: Booking[] = [];

        if (data) {
          for (const key in data) {
            const booking = data[key];
            // Check if both roomName and tables match
            if (
              booking.roomName === roomTitle &&
              booking.tables === tableTitle
            ) {
              bookings.push({
                date: booking.date,
                startTime: booking.startTime,
                endTime: booking.endTime,
                borrowedBy: Array.isArray(booking.borrowedBy)
                  ? booking.borrowedBy
                  : [], // Ensure borrowedBy is an array
              });
            }
          }
        }

        // Set the bookings in state and open the modal
        setSelectedRoomBookings(bookings);
        setCurrentRoomTitle(tableTitle); // Updated to tableTitle
        setIsModalOpen(true);
      },
      (error) => {
        console.error("Error fetching bookings:", error);
        // Optionally, display an error message to the user
      }
    );
  };

  // Function to close the modal
  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedRoomBookings([]);
  };

  // Update the TableCard component to use the defined types
  const TableCard: React.FC<TableCardProps> = ({
    title,
    image,
    onBook,
    onViewBookings,
    available,
  }) => (
    <div className="card bg-white shadow-xl">
      <figure>
        <img src={image} alt={title} />
      </figure>
      <div className="card-body">
        <h2 className="card-title text-black font-bold">{title}</h2>
        <div className="card-actions justify-end">
          <button
            onClick={onBook}
            className={`btn bg-black text-white ${
              available ? "" : "opacity-50 cursor-not-allowed"
            }`}
            disabled={!available} // Disable the button if not available
          >
            Book
          </button>
          <button onClick={onViewBookings} className="btn btn-accent">
            View Bookings
          </button>
        </div>
      </div>
    </div>
  );

  const filteredTables = tables.filter((table) =>
    filter === "Available" ? table.available : !table.available
  );

  // Filter `filteredEquipments` by the search term and availability
  const searchFilteredTables = filteredTables.filter((table) => {
    const matchesSearch = table.title
      .toLowerCase()
      .includes(searchTerm.toLowerCase());
    const matchesAvailability =
      filter === "Available" ? table.available : !table.available;
    return matchesSearch && matchesAvailability;
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
            className="h-24 w-24 md:h-40 md:w-32 rounded-full" // Adjusted logo size
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
                <img
                  src={dashboardlogo}
                  alt="Dashboard"
                  className="h-6 w-6 text-white"
                />
                <span className="ml-2 text-white font-bold">Dashboard</span>
              </a>
            </li>
            <li className="mb-4 bg-green-800 border-2 border-green-600 rounded-full p-1">
              <a
                href="/BookBorrow"
                className="flex items-center p-2 hover:bg-green-600 rounded-md"
              >
                <img
                  src={borrowLogo}
                  alt="Book/Borrow"
                  className="h-6 w-6 text-white"
                />
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
                  className="h-6 w-6 text-white"
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
                        <img
                          src={roomslogo}
                          alt="Rooms"
                          className="h-6 w-6 text-white"
                        />
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
                          className="h-6 w-6 text-white"
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
                          className="h-6 w-6 text-white"
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
                <img
                  src={reportslogo}
                  alt="Reports"
                  className="h-6 w-6 text-white"
                />
                <span className="ml-2 text-white font-bold">Transactions</span>
              </a>
            </li>
            <li className="mb-4">
              <a
                href="/Reschedule"
                className="flex items-center p-2 hover:bg-green-600 rounded-md"
              >
                <img
                  src={reschedule}
                  alt="Reschedule"
                  className="h-6 w-6 text-white"
                />
                <span className="ml-2 text-white font-bold">Reschedule</span>
              </a>
            </li>
            <li className="mb-4">
              <a
                href="/QrCode"
                className="flex items-center p-2 hover:bg-green-600 rounded-md"
              >
                <img src={qrCode} alt="QR" className="h-6 w-6 text-white" />
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
                  className="h-6 w-6 text-white"
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
                  className="h-6 w-6 text-white"
                />
                <span className="ml-2 text-white font-bold">Login History</span>
              </a>
            </li>
          </ul>
        </nav>
      </aside>

      <main className="flex-1 p-6 bg-white h-screen overflow-y-auto">
        <div className="container mx-auto p-4">
          <h1 className="text-2xl font-bold mb-4 text-black">
            Tutoring Room Tables
          </h1>
          <div className="mb-4 flex space-x-4">
            <input
              type="text"
              placeholder="Search Tables..."
              className="input input-bordered w-full max-w-xs"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <button
              className={`btn ${
                filter === "Available" ? "btn-accent text-white" : ""
              }`}
              onClick={() => setFilter("Available")}
            >
              Available
            </button>
            <button
              className={`btn ${
                filter === "Not Available" ? "btn-accent text-white" : ""
              }`}
              onClick={() => setFilter("Not Available")}
            >
              Not Available
            </button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {searchFilteredTables.map((table, index) => (
              <TableCard
                key={index}
                title={table.title}
                image={table.imageUrl}
                onBook={() => handleBookClick(roomTitle, table.title)}
                onViewBookings={() => handleViewBookingsClick(table.title)} // Pass the view bookings function
                available={table.available}
              />
            ))}
          </div>
        </div>
      </main>
      {/* Modal to show bookings */}
      <Modal isOpen={isModalOpen} onClose={handleCloseModal}>
        <h2 className="text-2xl font-bold mb-4 text-center text-black">
          {currentRoomTitle} Bookings
        </h2>
        {selectedRoomBookings.length > 0 ? (
          selectedRoomBookings.map((booking, index) => (
            <div
              key={index}
              className="bg-gray-100 p-4 rounded-lg shadow mb-4 border border-gray-300 "
            >
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="font-medium text-black">
                    <span className="font-bold text-black">Date:</span>{" "}
                    {booking.date}
                  </p>
                  <p className="font-medium text-black">
                    <span className="font-bold text-black">Start Time:</span>{" "}
                    {formatTime(booking.startTime)}
                  </p>
                  <p className="font-medium text-black">
                    <span className="font-bold text-black">End Time:</span>{" "}
                    {formatTime(booking.endTime)}
                  </p>
                </div>
                <div>
                  <p className="font-medium text-black">
                    <span className="font-bold text-black">Borrowed By:</span>{" "}
                    {booking.borrowedBy.length > 0
                      ? booking.borrowedBy
                          .map(
                            (userId: string) =>
                              users[userId]?.name || "Unknown User"
                          )
                          .join(", ")
                      : "No borrowers"}
                  </p>
                </div>
              </div>
            </div>
          ))
        ) : (
          <p className="text-center text-gray-500">
            No bookings found for this room.
          </p>
        )}
      </Modal>
    </div>
  );
};

export default TutoringAvailableTable;
