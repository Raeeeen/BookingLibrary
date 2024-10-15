import { useState, useRef, ChangeEvent, useEffect } from "react";
import schoolLogo from "../../assets/scclogo.png";
import dashboardlogo from "../../assets/dashboardlogo.png";
import roomslogo from "../../assets/roomslogo.png";
import equipmentslogo from "../../assets/equipmentslogo.png";
import reschedule from "../../assets/rescheduling.png";
import reportslogo from "../../assets/reportslogo.png";
import coursesLogo from "../../assets/courses.png";
import qrCode from "../../assets/qrcodelogo.png";
import { ToastContainer, toast } from "react-toastify";
import QRScanner from "qr-scanner";
import Modal from "./Modal";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import loginHistoryLogo from "../../assets/loginhistory.png";
import Lottie from "lottie-react";
import loadingAnimation from "../../assets/loadinganimation2.json";
import { FirebaseApp, initializeApp } from "firebase/app";
import {
  Database,
  get,
  getDatabase,
  ref as dbRef,
  update,
} from "firebase/database";
import { useNavigate } from "react-router-dom";
import QRCode from "qrcode";
import { getStorage, ref, uploadString } from "firebase/storage";
import borrowLogo from "../../assets/borrowicon.png";
import managedataLogo from "../../assets/managelogo.png";

function QrCode() {
  const [loading, setLoading] = useState(true);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [isScanning, setIsScanning] = useState<boolean>(false);
  const [qrScanner, setQrScanner] = useState<QRScanner | null>(null);
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [date, setDate] = useState<Date | null>(null);
  const [users, setUsers] = useState<{ id: string; name: string }[]>([]);
  const navigate = useNavigate();
  const [modalContent, setModalContent] = useState<{
    roomTitle?: string; // Optional now
    equipmentName?: string; // New property
    equipmentId?: number; // New property
    roomId?: number;
    borrowedBy?: string; // ID of the user
    date?: string;
    startTime?: {
      hours: number;
      minutes: number;
      amPm: "AM" | "PM";
    };
    endTime?: {
      hours: number;
      minutes: number;
      amPm: "AM" | "PM";
    };
  } | null>(null);
  const [showAddOptions, setShowAddOptions] = useState(false);

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
    const fetchUsers = async () => {
      const usersRef = dbRef(db, "users");
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
    if (modalContent && modalContent.date) {
      setDate(new Date(modalContent.date));
    }
    setLoading(false);
  }, [modalContent]);

  const handleDateChange = (selectedDate: Date | null) => {
    setDate(selectedDate);

    setModalContent((prevContent) => {
      if (prevContent) {
        return {
          ...prevContent,
          date: selectedDate
            ? selectedDate.toISOString().split("T")[0]
            : prevContent.date,
        };
      }
      return prevContent; // Handle the case where prevContent is null
    });
  };

  const handleFileChange = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      try {
        setUploadedImage(URL.createObjectURL(file)); // Set the uploaded image URL for preview
        const result = await QRScanner.scanImage(file);
        const parsedData = parseQRCodeData(result); // Pass the result directly as it's a string
        setModalContent(parsedData); // Set the parsed data for the modal
        setIsModalOpen(true);
      } catch (error) {
        console.error("Error decoding QR code:", error);
        setModalContent(null);
        setIsModalOpen(true);
      }
    }
  };

  const startScanning = async () => {
    if (videoRef.current) {
      setIsScanning(true);
      try {
        const scanner = new QRScanner(videoRef.current, (result) => {
          const parsedData = parseQRCodeData(result);
          setModalContent(parsedData); // Set the result for the modal
          scanner.stop();
          setIsScanning(false);
          setIsModalOpen(true);
        });
        setQrScanner(scanner);
        await scanner.start();
      } catch (error) {
        console.error("Error starting QR scanner:", error);
        setIsScanning(false);
      }
    }
  };

  const stopScanning = () => {
    if (qrScanner) {
      qrScanner.stop();
    }
    setIsScanning(false);
  };

  const handleClearUpload = () => {
    setUploadedImage(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = ""; // Clear the file input field
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!modalContent) {
      toast.error("No data to submit.");
      return;
    }

    const { startTime, endTime, date, roomId, equipmentId } = modalContent;

    if (!startTime || !endTime || !date) {
      toast.error("Start time, end time, or date is missing.");
      return;
    }

    // Function to convert 12-hour time format to 24-hour format
    const convertTo24HourFormat = (
      hours: number,
      minutes: number,
      amPm: "AM" | "PM" = "AM" // Default to AM if not specified
    ) => {
      let convertedHours = hours;
      if (amPm === "PM" && hours < 12) convertedHours += 12;
      if (amPm === "AM" && hours === 12) convertedHours = 0;
      console.log(
        `Converting ${hours}:${minutes} ${amPm} to 24-hour format: ${convertedHours}:${minutes}`
      );
      return { hours: convertedHours, minutes };
    };

    // Convert start and end times to 24-hour format
    const startHours24 = convertTo24HourFormat(
      startTime.hours,
      startTime.minutes,
      startTime.amPm
    ).hours;
    const startMinutes24 = convertTo24HourFormat(
      startTime.hours,
      startTime.minutes,
      startTime.amPm
    ).minutes;
    const endHours24 = convertTo24HourFormat(
      endTime.hours,
      endTime.minutes,
      endTime.amPm
    ).hours;
    const endMinutes24 = convertTo24HourFormat(
      endTime.hours,
      endTime.minutes,
      endTime.amPm
    ).minutes;

    const localDate = date ? new Date(date) : new Date();

    // Construct Date objects for start and end times
    const startTimeDate = new Date(
      localDate.getFullYear(),
      localDate.getMonth(),
      localDate.getDate(),
      startHours24,
      startMinutes24
    );
    const endTimeDate = new Date(
      localDate.getFullYear(),
      localDate.getMonth(),
      localDate.getDate(),
      endHours24,
      endMinutes24
    );

    // Adjust dates to UTC+8
    const startTimeDateUTC8 = new Date(startTimeDate.getTime() + 8 * 3600000);
    const endTimeDateUTC8 = new Date(endTimeDate.getTime() + 8 * 3600000);

    // Check if the start time is before the end time
    if (startTimeDateUTC8 >= endTimeDateUTC8) {
      toast.error("End time must be after start time.");
      return;
    }

    // Check if the booking duration is exactly one hour
    const duration =
      (endTimeDateUTC8.getTime() - startTimeDateUTC8.getTime()) / 60000; // duration in minutes
    if (duration !== 60) {
      toast.error("You can only book for 1 hour.");
      return;
    }

    const isRoomBooking = !!roomId;
    const bookingPath = isRoomBooking
      ? `bookrooms/${roomId}/`
      : `bookequipments/${equipmentId}/`;
    const qrCodeFileName = isRoomBooking
      ? `${roomId}.png`
      : `${equipmentId}.png`;

    const formatTime = (time: { hours: number; minutes: number }) => {
      if (!time || time.hours === undefined || time.minutes === undefined) {
        console.error("Invalid time object:", time);
        return "";
      }
      const hours = time.hours.toString().padStart(2, "0");
      const minutes = time.minutes.toString().padStart(2, "0");
      const formattedTime = `${hours}:${minutes}`;
      return formattedTime;
    };

    const startTimeDateUTC8Formatted = new Date(
      `${date} ${formatTime(startTime)} UTC+8`
    );
    const endTimeDateUTC8Formatted = new Date(
      `${date} ${formatTime(endTime)} UTC+8`
    );

    const parseTimeString = (timeStr: string) => {
      console.log("Parsing Time String:", timeStr);
      const [time, amPm] = timeStr.split(" ");
      const [hours, minutes] = time.split(":").map(Number);
      return { hours, minutes, amPm: amPm as "AM" | "PM" | undefined }; // Ensure amPm can be undefined
    };

    const checkOverlap = async (path: string) => {
      const bookingsRef = dbRef(db, path);
      const snapshot = await get(bookingsRef);
      const bookings = snapshot.val();

      if (bookings) {
        return Object.values(bookings).some((booking: any) => {
          console.log("Booking Data:", booking);
          const bookingStartTime = booking.startTime;
          const bookingEndTime = booking.endTime;

          // Convert booking times from string to object format
          const bookingStartTimeParsed = parseTimeString(bookingStartTime);
          const bookingEndTimeParsed = parseTimeString(bookingEndTime);

          const formattedStartTime = formatTime(bookingStartTimeParsed);
          const formattedEndTime = formatTime(bookingEndTimeParsed);

          const bookingStart = new Date(
            `${booking.date} ${formattedStartTime} UTC+8`
          );
          const bookingEnd = new Date(
            `${booking.date} ${formattedEndTime} UTC+8`
          );

          return (
            bookingStart.toDateString() ===
              startTimeDateUTC8Formatted.toDateString() &&
            startTimeDateUTC8Formatted < bookingEnd &&
            endTimeDateUTC8Formatted > bookingStart
          );
        });
      }

      return false;
    };

    try {
      // Check for overlapping bookings
      const isOverlapping = await checkOverlap(
        isRoomBooking ? `bookrooms` : `bookequipments`
      );

      if (isOverlapping) {
        toast.error(
          "The selected time slot overlaps with an existing booking."
        );
        return;
      }

      // Check if the time slot already exists in the database
      const existingBookingsRef = dbRef(
        db,
        isRoomBooking ? "bookrooms" : "bookequipments"
      );
      const existingBookingsSnapshot = await get(existingBookingsRef);
      const existingBookings = existingBookingsSnapshot.val();

      if (existingBookings) {
        const isTimeSlotTaken = Object.values(existingBookings).some(
          (booking: any) => {
            const bookingDateUTC8 = new Date(
              `${booking.date} ${formatTime(booking.startTime)} UTC+8`
            )
              .toISOString()
              .split("T")[0];
            const startTimeDateUTC8FormattedStr = startTimeDateUTC8Formatted
              .toISOString()
              .split("T")[0];

            return (
              bookingDateUTC8 === startTimeDateUTC8FormattedStr &&
              booking.startTime === formatTime(startTime) &&
              booking.endTime === formatTime(endTime)
            );
          }
        );

        if (isTimeSlotTaken) {
          toast.error("This time slot is already booked.");
          return;
        }
      }

      // Update booking data in the database
      await update(dbRef(db, bookingPath), {
        date: modalContent.date,
        startTime: formatTime(startTime),
        endTime: formatTime(endTime),
      });

      // Generate QR code
      const qrCodeData = isRoomBooking
        ? `Room Name: ${
            modalContent.roomTitle
          }, Room ID: ${roomId}, Date: ${date}, Start Time: ${formatTime(
            startTime
          )}, End Time: ${formatTime(endTime)}, Borrowed By: ${
            modalContent.borrowedBy
          }`
        : `Equipment ID: ${equipmentId}, Date: ${date}, Start Time: ${formatTime(
            startTime
          )}, End Time: ${formatTime(endTime)}`;

      const qrCodeUrl = await QRCode.toDataURL(qrCodeData);

      // Upload QR code to Firebase Storage
      const storage = getStorage(app);
      const qrCodeRef = ref(
        storage,
        `QRCode/${isRoomBooking ? roomId : equipmentId}/${qrCodeFileName}`
      );

      await uploadString(qrCodeRef, qrCodeUrl.split(",")[1], "base64");
      toast.success("Schedule updated successfully!");

      setTimeout(() => {
        navigate("/Reschedule");
      }, 2000);
    } catch (error) {
      console.error("Error in updating schedule:", error);
      toast.error("An error occurred while update .");
    }
  };

  const handleStartTimeChange = (
    event: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = event.target;

    setModalContent((prevContent) => {
      if (prevContent) {
        return {
          ...prevContent,
          startTime: {
            ...prevContent.startTime,
            hours: prevContent.startTime?.hours ?? 0,
            minutes: prevContent.startTime?.minutes ?? 0,
            amPm: prevContent.startTime?.amPm ?? "AM",
            [name]:
              name === "hours" || name === "minutes" ? parseInt(value) : value,
          },
        };
      }
      return prevContent;
    });
  };

  const handleEndTimeChange = (
    event: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = event.target;

    setModalContent((prevContent) => {
      if (prevContent) {
        return {
          ...prevContent,
          endTime: {
            ...prevContent.endTime,
            hours: prevContent.endTime?.hours ?? 0,
            minutes: prevContent.endTime?.minutes ?? 0,
            amPm: prevContent.endTime?.amPm ?? "AM",
            [name]:
              name === "hours" || name === "minutes" ? parseInt(value) : value,
          },
        };
      }
      return prevContent;
    });
  };

  const parseQRCodeData = (
    data: string
  ): {
    roomTitle?: string;
    equipmentName?: string;
    equipmentId?: number;
    roomId?: number;
    borrowedBy?: string; // ID of the user
    date?: string;
    startTime?: {
      hours: number;
      minutes: number;
      amPm: "AM" | "PM";
    };
    endTime?: {
      hours: number;
      minutes: number;
      amPm: "AM" | "PM";
    };
  } | null => {
    try {
      const parts = data.split(", ");

      const convert24To12 = (
        hour24: number
      ): { hours: number; amPm: "AM" | "PM" } => {
        if (hour24 === 0) return { hours: 12, amPm: "AM" };
        if (hour24 === 12) return { hours: 12, amPm: "PM" };
        if (hour24 > 12) return { hours: hour24 - 12, amPm: "PM" };
        return { hours: hour24, amPm: "AM" };
      };

      const getTimeObject = (timeString: string) => {
        const [hour24, minuteString] = timeString.split(":");
        const hour24Number = parseInt(hour24, 10);
        const minutes = parseInt(minuteString, 10);
        const { hours, amPm } = convert24To12(hour24Number);

        return {
          hours,
          minutes,
          amPm,
        };
      };

      const getPartValue = (prefix: string): string => {
        const part = parts.find((part) => part.startsWith(prefix));
        return part ? part.split(`${prefix} `)[1] : "";
      };

      const parsedData = {
        roomTitle: getPartValue("Room Name:"),
        equipmentName: getPartValue("Equipment Name:"),
        equipmentId: getPartValue("Equipment ID:")
          ? parseInt(getPartValue("Equipment ID:"), 10)
          : undefined,
        roomId: parseInt(getPartValue("Room ID:") || "0", 10),
        borrowedBy: getPartValue("Borrowed By:"),
        date: getPartValue("Date:") || "",
        startTime: getTimeObject(getPartValue("Start Time:") || ""),
        endTime: getTimeObject(getPartValue("End Time:") || ""),
      };

      if (parsedData.equipmentId === 0 && !parsedData.equipmentName) {
        console.warn("Equipment ID is 0 but no equipment name provided.");
      }

      return parsedData;
    } catch (error) {
      console.error("Error parsing QR code data:", error);
      return null;
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
            <li className="mb-4 bg-green-800 border-2 border-green-600 rounded-full p-1">
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

      <main className="flex-1 p-6 bg-white h-screen overflow-y-auto">
        <div className="flex flex-col md:flex-row gap-6">
          {/* QR Code Upload Box */}
          <div className="flex-1 bg-white p-6 rounded-lg shadow-md text-black font-bold">
            <h2 className="text-xl font-bold mb-4 text-black">
              Upload QR Code Image
            </h2>
            <input
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              className="mb-4"
              ref={fileInputRef}
            />
            {uploadedImage && (
              <div className="mt-4">
                <img
                  src={uploadedImage}
                  alt="Uploaded QR Code"
                  className="w-full h-auto border border-gray-300 rounded"
                />
                <button
                  onClick={handleClearUpload}
                  className="mt-4 px-4 py-2 bg-black text-white rounded"
                >
                  Clear Upload
                </button>
              </div>
            )}
          </div>

          {/* QR Code Camera Scan Box */}
          <div className="flex-1 bg-white p-6 rounded-lg shadow-md">
            <h2 className="text-xl font-bold mb-4 text-black">
              Scan QR Code with Camera
            </h2>
            <div
              className="relative"
              style={{ width: "100%", height: "400px" }}
            >
              <video
                ref={videoRef}
                style={{
                  width: "100%",
                  height: "100%",
                  objectFit: "cover",
                }}
              ></video>
            </div>
            <button
              onClick={isScanning ? stopScanning : startScanning}
              className="mt-4 px-4 py-2 bg-black text-white rounded font-bold"
            >
              {isScanning ? "Stop Scanning" : "Start Scanning"}
            </button>
          </div>
        </div>

        {/* Modal */}
        <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)}>
          <main className="flex-1 p-6 bg-white h-screen overflow-y-auto">
            <div className="flex flex-col items-center justify-center">
              <div className="w-full max-w-xs">
                <form
                  onSubmit={handleSubmit}
                  className="bg-white shadow-md rounded px-8 pt-6 pb-8 mb-4"
                >
                  <h2 className="text-center text-2xl font-bold mb-6 text-black">
                    {modalContent?.roomTitle ||
                      modalContent?.equipmentName ||
                      "Unknown Item"}
                  </h2>
                  <div className="mb-4">
                    <label
                      className="block text-black text-sm font-bold mb-2"
                      htmlFor="room-id"
                    >
                      {modalContent?.roomId ? "Room ID" : "Equipment ID"}
                    </label>
                    <input
                      id="room-id"
                      type="text"
                      value={
                        modalContent?.roomId ||
                        modalContent?.equipmentId ||
                        "Unknown Id"
                      }
                      readOnly
                      className="shadow appearance-none border bg-white rounded w-full py-2 px-3 text-black leading-tight focus:outline-none focus:shadow-outline"
                    />
                  </div>
                  <div className="mb-4">
                    <label
                      className="block text-black text-sm font-bold mb-2 mt-2"
                      htmlFor="students"
                    >
                      Booked By:
                    </label>
                    <input
                      id="borrowed-by"
                      type="text"
                      value={
                        users.find(
                          (user) => user.id === modalContent?.borrowedBy
                        )?.name || "Unknown User"
                      }
                      readOnly
                      className="shadow appearance-none border bg-white rounded w-full py-2 px-3 text-black leading-tight focus:outline-none focus:shadow-outline"
                    />
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
                      selected={date ? new Date(date) : null}
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
                        value={modalContent?.startTime?.hours || ""}
                        onChange={handleStartTimeChange}
                        placeholder="HH"
                        className="shadow appearance-none border bg-white rounded w-1/4 py-2 px-3 text-black leading-tight focus:outline-none focus:shadow-outline"
                      />
                      <input
                        name="minutes"
                        type="number"
                        min="0"
                        max="59"
                        value={
                          modalContent?.startTime?.minutes !== undefined
                            ? modalContent?.startTime?.minutes
                                .toString()
                                .padStart(2, "0")
                            : ""
                        }
                        onChange={handleStartTimeChange}
                        placeholder="MM"
                        className="shadow appearance-none border bg-white rounded w-1/4 py-2 px-3 text-black leading-tight focus:outline-none focus:shadow-outline"
                      />
                      <select
                        name="amPm"
                        value={modalContent?.startTime?.amPm || "AM"}
                        onChange={handleStartTimeChange}
                        className="shadow appearance-none border bg-white rounded w-1/4 py-2 px-3 text-black leading-tight focus:outline-none focus:shadow-outline"
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
                        value={modalContent?.endTime?.hours || ""}
                        onChange={handleEndTimeChange}
                        placeholder="HH"
                        className="shadow appearance-none border bg-white rounded w-1/4 py-2 px-3 text-black leading-tight focus:outline-none focus:shadow-outline"
                      />
                      <input
                        name="minutes"
                        type="number"
                        min="0"
                        max="59"
                        value={
                          modalContent?.endTime?.minutes !== undefined
                            ? modalContent?.endTime?.minutes
                                .toString()
                                .padStart(2, "0")
                            : ""
                        }
                        onChange={handleEndTimeChange}
                        placeholder="MM"
                        className="shadow appearance-none border bg-white rounded w-1/4 py-2 px-3 text-black leading-tight focus:outline-none focus:shadow-outline"
                      />
                      <select
                        name="amPm"
                        value={modalContent?.endTime?.amPm || "AM"}
                        onChange={handleEndTimeChange}
                        className="shadow appearance-none border bg-white rounded w-1/4 py-2 px-3 text-black leading-tight focus:outline-none focus:shadow-outline"
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
      </main>
      <ToastContainer />
    </div>
  );
}

export default QrCode;
