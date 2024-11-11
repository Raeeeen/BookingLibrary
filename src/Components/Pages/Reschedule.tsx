import React, { useState, useEffect } from "react";
import { initializeApp } from "firebase/app";
import { getDatabase, ref, onValue, get, update } from "firebase/database";
import {
  getStorage,
  ref as storageRef,
  getDownloadURL,
} from "firebase/storage";
import schoolLogo from "../../assets/scclogo.png";
import dashboardlogo from "../../assets/dashboardlogo.png";
import roomslogo from "../../assets/roomslogo.png";
import equipmentslogo from "../../assets/equipmentslogo.png";
import reschedule from "../../assets/rescheduling.png";
import reportslogo from "../../assets/reportslogo.png";
import qrCode from "../../assets/qrcodelogo.png";
import searchLogo from "../../assets/searchlogo.png";
import loginHistoryLogo from "../../assets/loginhistory.png";
import coursesLogo from "../../assets/courses.png";
import Lottie from "lottie-react";
import loadingAnimation from "../../assets/loadinganimation2.json";
import { ToastContainer, toast } from "react-toastify";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import Modal from "./Modal";
import borrowLogo from "../../assets/borrowicon.png";
import managedataLogo from "../../assets/managelogo.png";

function Reschedule() {
  const [loading, setLoading] = useState(true);

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
  const storage = getStorage(app);

  const [bookRooms, setBookRooms] = useState<any[]>([]);
  const [bookEquipments, setBookEquipments] = useState<any[]>([]);
  const [qrCodeUrls, setQrCodeUrls] = useState<{ [key: string]: string }>({});
  const [searchTerm, setSearchTerm] = useState("");
  const [users, setUsers] = useState<{ id: string; name: string }[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState<any>(null);
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [date, setDate] = useState<Date | null>(null);
  const [startTime, setStartTime] = useState({
    hours: 0,
    minutes: 0,
    amPm: "AM",
  });
  const [endTime, setEndTime] = useState({
    hours: 0,
    minutes: 0,
    amPm: "AM",
  });
  const formatMinutes = (minutes: number) =>
    minutes.toString().padStart(2, "0");
  const formattedStartMinutes = formatMinutes(startTime.minutes);
  const formattedEndMinutes = formatMinutes(endTime.minutes);
  const [activeTab, setActiveTab] = useState("rooms");
  const handleDateChange = (date: any) => setDate(date);
  const [showAddOptions, setShowAddOptions] = useState(false);

  const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(event.target.value.toLowerCase());
  };

  useEffect(() => {
    const fetchUsers = async () => {
      const usersRef = ref(db, "users");
      const snapshot = await get(usersRef);
      const data = snapshot.val();
      const fetchedUsers: { id: string; name: string }[] = [];

      for (const key in data) {
        // Exclude user with specific email
        if (data[key].email !== "scclibrary3@gmail.com") {
          fetchedUsers.push({ id: key, name: data[key].name });
        }
      }

      setUsers(fetchedUsers);
    };

    fetchUsers();
  }, [db]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch bookrooms
        const bookRoomsRef = ref(db, "bookrooms");
        onValue(bookRoomsRef, async (snapshot) => {
          const data = snapshot.val();
          if (data) {
            const rooms = Object.keys(data).map((id) => ({ id, ...data[id] }));
            setBookRooms(rooms);

            // Fetch QR codes for bookrooms
            const qrUrls: { [key: string]: string } = {};
            for (const room of rooms) {
              const borrowedByArray = room.borrowedBy || [];
              const roomName = room.roomName || "Unknown Room";
              for (const userId of borrowedByArray) {
                const qrCodeRef = storageRef(
                  storage,
                  `QRCode/${userId}/${roomName}/${room.id}.png`
                );
                try {
                  const url = await getDownloadURL(qrCodeRef);
                  qrUrls[room.id] = url;
                } catch (error) {
                  console.error(
                    `Error fetching QR code URL for room ${room.id}:`,
                    error
                  );
                }
              }
            }
            setQrCodeUrls((prev) => ({ ...prev, ...qrUrls }));
          }
        });

        // Fetch bookequipments
        const bookEquipmentsRef = ref(db, "bookequipments");
        onValue(bookEquipmentsRef, async (snapshot) => {
          const data = snapshot.val();
          if (data) {
            const equipments = Object.keys(data).map((id) => ({
              id,
              ...data[id],
            }));
            setBookEquipments(equipments);

            // Fetch QR codes for bookequipments
            const qrUrls: { [key: string]: string } = {};
            for (const equipment of equipments) {
              const borrowedByArray = equipment.borrowedBy || [];
              const equipmentName =
                equipment.equipmentName || "Unknown Equipment";
              for (const userId of borrowedByArray) {
                const qrCodeRef = storageRef(
                  storage,
                  `QRCode/${userId}/${equipmentName}/${equipment.id}.png`
                );
                try {
                  const url = await getDownloadURL(qrCodeRef);
                  qrUrls[equipment.id] = url;
                } catch (error) {
                  console.error(
                    `Error fetching QR code URL for equipment ${equipment.id}:`,
                    error
                  );
                }
              }
            }
            setQrCodeUrls((prev) => ({ ...prev, ...qrUrls }));
          }
        });
      } catch (error) {
        console.error("Error fetching data:", error);
      } finally {
        setLoading(false);
      }
    };
    setLoading(false);
    fetchData();
  }, [db, storage]);

  const fetchBookingData = async (id: string, isRoom: boolean) => {
    const path = isRoom ? `bookrooms/${id}` : `bookequipments/${id}`;
    const dataRef = ref(db, path);

    try {
      const snapshot = await get(dataRef);
      if (snapshot.exists()) {
        return snapshot.val(); // Return the data from the database
      } else {
        console.log("No data available for the given ID.");
        return null;
      }
    } catch (error) {
      console.error("Error fetching booking data:", error);
      return null;
    }
  };

  const filteredRooms = bookRooms.filter((room) =>
    room.id.toLowerCase().includes(searchTerm)
  );

  const filteredEquipments = bookEquipments.filter((equipment) =>
    equipment.id.toLowerCase().includes(searchTerm)
  );

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    // Helper function to convert 24-hour time to 12-hour format with AM/PM
    const convertTo12HourFormat = (hours: number, minutes: number): string => {
      const period = hours >= 12 ? "PM" : "AM";
      const adjustedHours = hours % 12 || 12; // Convert 0 to 12 for 12 AM
      return `${adjustedHours.toString().padStart(2, "0")}:${minutes
        .toString()
        .padStart(2, "0")} ${period}`;
    };

    // Helper function to convert 12-hour time with AM/PM to 24-hour format
    const convertTo24HourFormat = (time: string): string => {
      const [timePart, period] = time.split(" ");
      let [hours, minutes] = timePart.split(":").map(Number);
      if (period === "PM" && hours < 12) hours += 12;
      if (period === "AM" && hours === 12) hours = 0;
      return `${hours.toString().padStart(2, "0")}:${minutes
        .toString()
        .padStart(2, "0")}`;
    };

    // Format start and end times for checking availability
    const formattedStartTimeForCheck = convertTo12HourFormat(
      startTime.hours,
      startTime.minutes
    );
    const formattedEndTimeForCheck = convertTo12HourFormat(
      endTime.hours,
      endTime.minutes
    );

    // Format start and end times for database (24-hour format)
    const formattedStartTimeForDB = convertTo24HourFormat(
      formattedStartTimeForCheck
    );
    const formattedEndTimeForDB = convertTo24HourFormat(
      formattedEndTimeForCheck
    );

    // Helper function to check if a time slot is available
    const isTimeSlotAvailable = async (
      path: string,
      startTime: string,
      endTime: string
    ) => {
      const dataRef = ref(db, path);

      try {
        const snapshot = await get(dataRef);
        const bookings = snapshot.val() || {};

        // Check for any overlap with the new start and end times
        return !Object.values(bookings).some((booking: any) => {
          const existingStartTime = booking.startTime;
          const existingEndTime = booking.endTime;

          // Check if the new times overlap with any existing bookings
          return startTime < existingEndTime && endTime > existingStartTime;
        });
      } catch (error) {
        console.error("Error checking time slot availability:", error);
        return false;
      }
    };

    if (!selectedBooking) {
      console.error("No booking selected");
      return;
    }

    // Determine the path to check based on whether it's a room or equipment
    const path = selectedBooking.isRoom ? `bookrooms` : `bookequipments`;

    // Check if the time slot is available
    const isAvailable = await isTimeSlotAvailable(
      path,
      formattedStartTimeForCheck,
      formattedEndTimeForCheck
    );

    if (isAvailable) {
      // Update the booking in the database with the new values
      const bookingPath = selectedBooking.isRoom
        ? `bookrooms/${selectedBooking.id}`
        : `bookequipments/${selectedBooking.id}`;

      const bookingRef = ref(db, bookingPath);

      try {
        await update(bookingRef, {
          ...selectedBooking, // Keep existing booking data
          startTime: formattedStartTimeForDB, // Save with 24-hour format
          endTime: formattedEndTimeForDB, // Save with 24-hour format
        });

        toast.success("Schedule updated successfully!");

        // Close the modal after successful update
        setIsModalOpen(false);
      } catch (error) {
        console.error("Error updating booking:", error);
      }
    } else {
      // Handle the case where the time slot is already booked
      toast.error(
        "The selected time slot is already taken. Please choose another time."
      );
    }
  };

  const handleRescheduleClick = async (id: string, isRoom: boolean) => {
    try {
      const bookingData = await fetchBookingData(id, isRoom);

      if (bookingData) {
        // Extract hours, minutes, and AM/PM for start time
        const [startHoursStr, startMinutesStr, startAmPm] = splitTime(
          bookingData.startTime
        );
        const startHours = parseInt(startHoursStr, 10);
        const startMinutes = parseInt(startMinutesStr, 10);

        // Extract hours, minutes, and AM/PM for end time
        const [endHoursStr, endMinutesStr, endAmPm] = splitTime(
          bookingData.endTime
        );
        const endHours = parseInt(endHoursStr, 10);
        const endMinutes = parseInt(endMinutesStr, 10);

        // Update state with fetched data
        setStartTime({
          hours: startHours,
          minutes: startMinutes,
          amPm: startAmPm,
        });

        setEndTime({
          hours: endHours,
          minutes: endMinutes,
          amPm: endAmPm,
        });

        // Update other states
        setSelectedBooking({
          ...bookingData,
          id,
          isRoom,
        });

        console.log("Booking Data:", bookingData);

        // Set date
        setDate(new Date(bookingData.date));

        // Set selected users
        setSelectedUsers(bookingData.borrowedBy || []);

        // Open modal
        setIsModalOpen(true);
      }
    } catch (error) {
      console.error("Error fetching booking data:", error);
      // Handle error appropriately, e.g., show a message to the user
    }
  };

  // Helper function to split time into hours, minutes, and AM/PM
  function splitTime(time: string) {
    const [hoursStr, minutesStr] = time.split(":");
    let hours = parseInt(hoursStr, 10);
    const minutes = parseInt(minutesStr, 10);

    const amPm = hours >= 12 ? "PM" : "AM";

    // Convert hours to 12-hour format
    if (hours === 0) {
      hours = 12; // Midnight case
    } else if (hours > 12) {
      hours -= 12;
    }

    // Format hours and minutes as two digits
    const formattedHours = hours.toString().padStart(2, "0");
    const formattedMinutes = minutes.toString().padStart(2, "0");

    return [formattedHours, formattedMinutes, amPm];
  }

  const handleStartTimeChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => setStartTime({ ...startTime, [e.target.name]: e.target.value });

  const handleEndTimeChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => setEndTime({ ...endTime, [e.target.name]: e.target.value });

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
            <li className="mb-4">
              <a
                href="/reports"
                className="flex items-center p-2 hover:bg-green-600 rounded-md"
              >
                <img src={reportslogo} alt="Reports" className="h-6 w-6" />
                <span className="ml-2 text-white font-bold">Transactions</span>
              </a>
            </li>
            <li className="mb-4 bg-green-800 border-2 border-green-600 rounded-full p-1">
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

      <main className="flex-1 p-6 bg-white">
        <div className="bg-white p-4 rounded-lg shadow-md">
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

          {/* Search Input */}
          <div className="relative mb-4">
            <img
              src={searchLogo}
              alt="Search"
              className="absolute left-3 top-1/2 transform -translate-y-1/2 h-6 w-6"
            />
            <input
              type="text"
              placeholder="Search..."
              value={searchTerm}
              onChange={handleSearchChange}
              className="w-full pl-12 p-2 rounded bg-white text-black font-bold placeholder-gray-500 border border-black focus:border-blue-500"
            />
          </div>

          {/* Conditional Rendering for Rooms or Equipments */}
          {activeTab === "rooms" && (
            <div>
              <h2 className="text-xl font-bold mb-2 text-black">Book Rooms</h2>
              <div className="space-y-4">
                {filteredRooms.map((room) => (
                  <div
                    key={room.id}
                    className="bg-white p-4 rounded-lg shadow-sm flex justify-between items-center border border-black"
                  >
                    <span className="font-semibold text-black">
                      Room ID: {room.id}
                    </span>
                    {qrCodeUrls[room.id] && (
                      <div className="flex items-center space-x-2">
                        <a
                          href={qrCodeUrls[room.id]}
                          download={`qrcode_${room.id}.png`}
                          className="bg-black text-white py-1 px-3 rounded-md text-center"
                        >
                          Download QR Code
                        </a>
                        <button
                          className="bg-blue-600 text-white py-1 px-3 rounded-md"
                          onClick={() => handleRescheduleClick(room.id, true)}
                        >
                          Reschedule
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === "equipments" && (
            <div className="mt-6">
              <h2 className="text-xl font-bold mb-2 text-black">
                Borrow Equipments
              </h2>
              <div className="space-y-4">
                {filteredEquipments.map((equipment) => (
                  <div
                    key={equipment.id}
                    className="bg-white p-4 rounded-lg shadow-sm flex justify-between items-center border border-black"
                  >
                    <span className="font-semibold text-black">
                      Equipment ID: {equipment.id}
                    </span>
                    {qrCodeUrls[equipment.id] && (
                      <div className="flex items-center space-x-2">
                        <a
                          href={qrCodeUrls[equipment.id]}
                          download={`qrcode_${equipment.id}.png`}
                          className="bg-black text-white py-1 px-3 rounded-md text-center"
                        >
                          Download QR Code
                        </a>
                        <button
                          className="bg-blue-600 text-white py-1 px-3 rounded-md"
                          onClick={() =>
                            handleRescheduleClick(equipment.id, false)
                          }
                        >
                          Reschedule
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {isModalOpen && selectedBooking && (
          <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)}>
            <main className="flex-1 p-6 bg-white h-screen overflow-y-auto">
              <div className="flex flex-col items-center justify-center">
                <div className="w-full max-w-xs">
                  <form
                    onSubmit={handleSubmit}
                    className="bg-white shadow-md rounded px-8 pt-6 pb-8 mb-4"
                  >
                    <h2 className="text-center text-2xl font-bold mb-6 text-black">
                      {selectedBooking?.roomName ||
                        selectedBooking?.equipmentName ||
                        selectedBooking?.title ||
                        "No Title Available"}
                    </h2>
                    <div className="mb-4">
                      <label
                        className="block text-black text-sm font-bold mb-2"
                        htmlFor="room-id"
                      >
                        {selectedBooking.isRoom ? "Room ID" : "Equipment ID"}
                      </label>
                      <input
                        id="room-id"
                        type="text"
                        value={selectedBooking.id}
                        readOnly
                        className="shadow appearance-none border bg-white rounded w-full py-2 px-3 text-black leading-tight focus:outline-none focus:shadow-outline"
                      />
                    </div>

                    <div className="mb-4">
                      <label
                        className="block text-black text-sm font-bold mb-2 mt-2"
                        htmlFor="borrowed-by"
                      >
                        Booked By:
                      </label>
                      {/* Show selected users */}
                      {selectedUsers.length > 0 && (
                        <ul className="mt-3">
                          {selectedUsers.map((user, index) => (
                            <li
                              key={index}
                              className="shadow appearance-none border bg-white rounded w-full py-2 px-3 text-black leading-tight focus:outline-none focus:shadow-outline mb-1"
                            >
                              {users.find((u) => u.id === user)?.name || user}
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>

                    <div className="mb-4">
                      <label
                        className="block text-black text-sm font-bold mb-2"
                        htmlFor="date"
                      >
                        Select Date
                      </label>
                      <DatePicker
                        id="date"
                        selected={date}
                        onChange={handleDateChange}
                        className="shadow appearance-none border bg-white rounded w-full py-2 px-3 text-black leading-tight focus:outline-none focus:shadow-outline"
                        dateFormat="yyyy-MM-dd"
                      />
                    </div>
                    <div className="mb-4">
                      <label
                        className="block text-black text-sm font-bold mb-2"
                        htmlFor="start-time"
                      >
                        Start Time
                      </label>
                      <div className="flex space-x-2">
                        <input
                          name="hours"
                          type="number"
                          min="1"
                          max="12"
                          value={startTime.hours}
                          onChange={handleStartTimeChange}
                          placeholder="HH"
                          className="shadow appearance-none border bg-white rounded w-1/3 py-2 px-3 text-black leading-tight focus:outline-none focus:shadow-outline"
                        />
                        <input
                          name="minutes"
                          type="number"
                          min="0"
                          max="59"
                          value={formattedStartMinutes}
                          onChange={handleStartTimeChange}
                          placeholder="MM"
                          className="shadow appearance-none border bg-white rounded w-1/3 py-2 px-3 text-black leading-tight focus:outline-none focus:shadow-outline"
                        />
                        <select
                          name="amPm"
                          value={startTime.amPm}
                          onChange={handleStartTimeChange}
                          className="shadow appearance-none border bg-white rounded w-1/3 py-2 px-3 text-black leading-tight focus:outline-none focus:shadow-outline"
                        >
                          <option value="AM">AM</option>
                          <option value="PM">PM</option>
                        </select>
                      </div>
                      <p className="text-xs text-gray-500 mt-2">
                        Time Format is 12 HR
                      </p>
                    </div>
                    <div className="mb-4">
                      <label
                        className="block text-black text-sm font-bold mb-2"
                        htmlFor="end-time"
                      >
                        End Time
                      </label>
                      <div className="flex space-x-2">
                        <input
                          name="hours"
                          type="number"
                          min="1"
                          max="12"
                          value={endTime.hours}
                          onChange={handleEndTimeChange}
                          placeholder="HH"
                          className="shadow appearance-none border bg-white rounded w-1/3 py-2 px-3 text-black leading-tight focus:outline-none focus:shadow-outline"
                        />
                        <input
                          name="minutes"
                          type="number"
                          min="0"
                          max="59"
                          value={formattedEndMinutes}
                          onChange={handleEndTimeChange}
                          placeholder="MM"
                          className="shadow appearance-none border bg-white rounded w-1/3 py-2 px-3 text-black leading-tight focus:outline-none focus:shadow-outline"
                        />
                        <select
                          name="amPm"
                          value={endTime.amPm}
                          onChange={handleEndTimeChange}
                          className="shadow appearance-none border bg-white rounded w-1/3 py-2 px-3 text-black leading-tight focus:outline-none focus:shadow-outline"
                        >
                          <option value="AM">AM</option>
                          <option value="PM">PM</option>
                        </select>
                      </div>
                      <p className="text-xs text-gray-500 mt-2">
                        Time Format is 12 HR
                      </p>
                    </div>
                    <div className="flex items-center justify-between">
                      <button
                        type="submit"
                        className="bg-black hover:bg-blue-400 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
                      >
                        Submit
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            </main>
          </Modal>
        )}
      </main>
      <ToastContainer />
    </div>
  );
}

export default Reschedule;
