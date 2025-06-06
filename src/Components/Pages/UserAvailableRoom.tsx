import React, { useEffect, useState } from "react";
import { initializeApp, FirebaseApp } from "firebase/app";
import {
  getDatabase,
  ref as dbRef,
  onValue,
  Database,
} from "firebase/database";
import schoolLogo from "../../assets/scclogo.png";
import dashboardlogo from "../../assets/dashboardlogo.png";
import historyLogo from "../../assets/reportslogo.png";
import borrowLogo from "../../assets/borrowicon.png";
import faqLogo from "../../assets/faqlogo.png";
import guidelinesLogo from "../../assets/guidelineslogo.png";
import Modal from "./Modal";
import { useNavigate } from "react-router-dom";

// Define a type for the RoomCard props
interface RoomCardProps {
  title: string;
  image: string;
  onBook: () => void;
  onViewBookings?: () => void; // Make this prop optional
  available: boolean; // New prop to indicate availability
  extraDescription: string; // New prop
}

interface Room {
  title: string;
  imageUrl: string;
  available: boolean;
  extraDescription: string; // New prop
}

interface Booking {
  date: string;
  startTime: string;
  endTime: string;
}

const UserAvailableRoom: React.FC = () => {
  const [filter, setFilter] = useState<"Available" | "Not Available">(
    "Available"
  );
  const [rooms, setRooms] = useState<Room[]>([]);
  const [selectedRoomBookings, setSelectedRoomBookings] = useState<Booking[]>(
    []
  );
  const [isModalOpen, setIsModalOpen] = useState(false); // Modal open state
  const [currentRoomTitle, setCurrentRoomTitle] = useState("");
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState("");

  // Firebase configuration
  const firebaseConfig = {

  };

  // Initialize Firebase
  const app: FirebaseApp = initializeApp(firebaseConfig);
  const db: Database = getDatabase(app);

  useEffect(() => {
    const roomsRef = dbRef(db, "rooms");

    onValue(roomsRef, (snapshot) => {
      const data = snapshot.val();
      const roomArray: Room[] = [];

      for (const key in data) {
        const room = data[key];
        roomArray.push({
          title: room.description,
          imageUrl: room.imageUrl,
          available: room.availability,
          extraDescription: room.extraDescription || "",
        });
      }

      console.log("Fetched rooms:", roomArray);
      setRooms(roomArray);
    });
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

  const handleBookClick = (roomTitle: string) => {
    // Use a regular expression to match "IMC/AVR" regardless of slashes
    if (/IMC\/?AVR/.test(roomTitle)) {
      navigate("/UserImcAvr", { state: { roomTitle } });
    } else if (/Tutoring Room/.test(roomTitle)) {
      navigate("/UserTutoringAvailableTable", { state: { roomTitle } });
    } else {
      navigate("/UserBookRoom", { state: { roomTitle } });
    }
  };

  // Function to handle "View Bookings" click
  const handleViewBookingsClick = (roomTitle: string) => {
    // Fetch booking data for the given roomTitle from Firebase
    const bookingsRef = dbRef(db, "bookrooms");
    onValue(bookingsRef, (snapshot) => {
      const data = snapshot.val();
      const bookings: Booking[] = [];

      for (const key in data) {
        const booking = data[key];
        if (booking.roomName === roomTitle) {
          bookings.push({
            date: booking.date,
            startTime: booking.startTime,
            endTime: booking.endTime,
          });
        }
      }

      // Set the bookings in state and open the modal
      setSelectedRoomBookings(bookings);
      setCurrentRoomTitle(roomTitle);
      setIsModalOpen(true);
    });
  };

  // Function to close the modal
  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedRoomBookings([]);
  };

  // Helper function to determine if "View Bookings" should be shown
  const shouldShowViewBookings = (roomTitle: string): boolean => {
    const excludedRooms = ["Tutoring Room"];
    return !excludedRooms.includes(roomTitle);
  };

  // Update the RoomCard component to use the defined types
  const RoomCard: React.FC<RoomCardProps> = ({
    title,
    image,
    onBook,
    onViewBookings,
    available,
    extraDescription,
  }) => (
    <div className="card bg-white shadow-xl">
      <figure>
        <img src={image} alt={title} />
      </figure>
      <div className="card-body">
        <h2 className="card-title text-black font-bold">{title}</h2>

        {/* Conditionally render extraDescription */}
        {extraDescription && extraDescription !== "0" && (
          <p className="text-gray-600 mb-2">
            Description:{" "}
            <span className="font-semibold text-blue-600">
              {extraDescription}
            </span>
          </p>
        )}

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
          {/* Conditionally render the "View Bookings" button */}
          {onViewBookings && (
            <button onClick={onViewBookings} className="btn btn-accent">
              View Bookings
            </button>
          )}
        </div>
      </div>
    </div>
  );

  const filteredRooms = rooms.filter((room) =>
    filter === "Available" ? room.available : !room.available
  );

  // Filter `filteredEquipments` by the search term and availability
  const searchFilteredRooms = filteredRooms.filter((room) => {
    const matchesSearch = room.title
      .toLowerCase()
      .includes(searchTerm.toLowerCase());
    const matchesAvailability =
      filter === "Available" ? room.available : !room.available;
    return matchesSearch && matchesAvailability;
  });

  return (
    <div className="min-h-screen flex flex-col md:flex-row">
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
            <li className="mb-4 bg-green-800 border-2 border-green-600 rounded-full p-1">
              <a
                href="/UserBookBorrow"
                className="flex items-center p-2 hover:bg-green-600 rounded-md"
              >
                <img src={borrowLogo} alt="Borrow" className="h-6 w-6" />
                <span className="ml-2 text-white font-bold">
                  Booking/Borrowing
                </span>
              </a>
            </li>
            <li className="mb-4">
              <a
                href="/UserTransactionHistory"
                className="flex items-center p-2 hover:bg-green-600 rounded-md"
              >
                <img
                  src={historyLogo}
                  alt="Transaction History"
                  className="h-6 w-6"
                />
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
                <img src={faqLogo} alt="FAQ" className="h-6 w-6" />
                <span className="ml-2 text-white font-bold">FAQ</span>
              </a>
            </li>
            <li className="mb-4">
              <a
                href="/UserGuidelinesAndPrivacy"
                className="flex items-center p-2 hover:bg-green-600 rounded-md"
              >
                <img
                  src={guidelinesLogo}
                  alt="Guidelines and Privacy"
                  className="h-6 w-6"
                />
                <span className="ml-2 text-white font-bold">
                  Guidelines and Privacy
                </span>
              </a>
            </li>
          </ul>
        </nav>
      </aside>

      <main className="flex-1 p-6 bg-white h-screen overflow-y-auto">
        <div className="container mx-auto p-4">
          <h1 className="text-2xl font-bold mb-4 text-black">Rooms</h1>
          <div className="mb-4 flex space-x-4">
            <input
              type="text"
              placeholder="Search Rooms..."
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
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {searchFilteredRooms.map((room, index) => (
              <RoomCard
                key={index}
                title={room.title}
                image={room.imageUrl}
                onBook={() => handleBookClick(room.title)}
                onViewBookings={
                  shouldShowViewBookings(room.title)
                    ? () => handleViewBookingsClick(room.title)
                    : undefined
                }
                available={room.available} // Pass the availability prop
                extraDescription={room.extraDescription}
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

export default UserAvailableRoom;
