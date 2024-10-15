import React, { useEffect, useState } from "react";
import { initializeApp, FirebaseApp } from "firebase/app";
import {
  getDatabase,
  ref as dbRef,
  onValue,
  Database,
} from "firebase/database";
import schoolLogo from "../../../assets/scclogo.png";
import dashboardlogo from "../../../assets/dashboardlogo.png";
import historyLogo from "../../../assets/reportslogo.png";
import borrowLogo from "../../../assets/borrowicon.png";
import faqLogo from "../../../assets/faqlogo.png";
import guidelinesLogo from "../../../assets/guidelineslogo.png";
import Modal from "./../Modal";
import { useNavigate } from "react-router-dom";

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
}

const UserTutoringAvailableTable: React.FC = () => {
  const [filter, setFilter] = useState<"Available" | "Not Available">(
    "Available"
  );
  const [tables, setTables] = useState<Table[]>([]);
  const [selectedRoomBookings, setSelectedRoomBookings] = useState<Booking[]>(
    []
  );
  const [isModalOpen, setIsModalOpen] = useState(false); // Modal open state
  const [currentRoomTitle, setCurrentRoomTitle] = useState("");
  const roomTitle = "Tutoring Room";
  const navigate = useNavigate();

  // Firebase configuration
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
    navigate("/UserTutoringBookTable", { state: { roomTitle, tableTitle } });
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
            <li className="mb-4">
              <a
                href="/UserDashboard"
                className="flex items-center p-2 hover:bg-gray-300 rounded-md"
              >
                <img src={dashboardlogo} alt="Dashboard" className="h-6 w-6" />
                <span className="ml-2 text-black font-bold">Dashboard</span>
              </a>
            </li>
            <li className="mb-4 bg-gray-200 border-2 border-gray-200 rounded-full p-1">
              <a
                href="/UserBookBorrow"
                className="flex items-center p-2 hover:bg-gray-300 rounded-md"
              >
                <img src={borrowLogo} alt="Dashboard" className="h-6 w-6" />
                <span className="ml-2 text-black font-bold">Book/Borrow</span>
              </a>
            </li>
            <li className="mb-4">
              <a
                href="/UserTransactionHistory"
                className="flex items-center p-2 hover:bg-gray-300 rounded-md"
              >
                <img src={historyLogo} alt="Dashboard" className="h-6 w-6" />
                <span className="ml-2 text-black font-bold">
                  Transaction History
                </span>
              </a>
            </li>
            <li className="mb-4">
              <a
                href="/UserFAQ"
                className="flex items-center p-2 hover:bg-gray-300 rounded-md"
              >
                <img src={faqLogo} alt="Dashboard" className="h-6 w-6" />
                <span className="ml-2 text-black font-bold">FAQ</span>
              </a>
            </li>
            <li className="mb-4">
              <a
                href="/UserGuidelinesAndPrivacy"
                className="flex items-center p-2 hover:bg-gray-300 rounded-md"
              >
                <img src={guidelinesLogo} alt="Dashboard" className="h-6 w-6" />
                <span className="ml-2 text-black font-bold">
                  Guidelines and Privacy
                </span>
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
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {filteredTables.map((table, index) => (
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

export default UserTutoringAvailableTable;
