import React, { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import {
  getDatabase,
  ref as dbRef,
  set,
  Database,
  get,
} from "firebase/database";
import schoolLogo from "../../assets/scclogo.png";
import dashboardlogo from "../../assets/dashboardlogo.png";
import roomslogo from "../../assets/roomslogo.png";
import equipmentslogo from "../../assets/equipmentslogo.png";
import reschedule from "../../assets/rescheduling.png";
import reportslogo from "../../assets/reportslogo.png";
import qrCode from "../../assets/qrcodelogo.png";
import { FirebaseApp, initializeApp } from "firebase/app";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import DatePicker from "react-datepicker";
import coursesLogo from "../../assets/courses.png";
import loginHistoryLogo from "../../assets/loginhistory.png";
import "react-datepicker/dist/react-datepicker.css";
import UserSelection from "./BorrowedUserSelection";
import EquipmentSelection from "./EquipmentSelection";
import QRCode from "qrcode";
import { getStorage, ref, uploadString } from "firebase/storage";
import borrowLogo from "../../assets/borrowicon.png";
import managedataLogo from "../../assets/managelogo.png";

const generateRandomRoomId = () => {
  return Math.floor(Math.random() * 10000) + 1; // Random number between 1 and 10000
};

export interface Equipment {
  id: string;
  name: string;
  description: string;
  availability: boolean;
}

const imcAvr: React.FC = () => {
  const location = useLocation();
  const roomTitle = location.state?.roomTitle || "Unknown Room";
  const [date, setDate] = useState<Date | null>(null);

  const [, setStudents] = useState<string[]>([]);

  const [, setStudentName] = useState<string>("");
  const [roomId] = useState(generateRandomRoomId());
  const [bookedSlots, setBookedSlots] = useState<{ start: Date; end: Date }[]>(
    []
  );
  const [users, setUsers] = useState<{ id: string; name: string }[]>([]);
  const [purpose, setPurpose] = useState<string>("");
  const [gender, setGender] = useState<string>("");
  const [department, setDepartment] = useState<string>("");
  const [subject, setSubject] = useState<string>("");
  const [startTime, setStartTime] = useState({
    hours: "0",
    minutes: "00",
    amPm: "AM",
  });
  const [endTime, setEndTime] = useState({
    hours: "0",
    minutes: "00",
    amPm: "AM",
  });
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [selectedStudents] = useState<string[]>([]);
  const [showBorrowedBySelection, setShowBorrowedBySelection] = useState(false);
  const [equipments, setEquipments] = useState<
    { id: string; name: string; description: string }[]
  >([]); // New state
  const [selectedEquipments, setSelectedEquipments] = useState<string[]>([]);
  const [showEquipmentsSelection, setShowEquipmentsSelection] = useState(false);
  const [courses, setCourses] = useState<
    { id: string; name: string; description: string; department: string }[]
  >([]);
  const handleDateChange = (date: any) => setDate(date);
  const navigate = useNavigate();
  const [showAddOptions, setShowAddOptions] = useState(false);
  const [selectedCourse, setSelectedCourse] = useState<string>(""); // For current selection
  const departments = ["CCS", "COC", "CTEAS", "CBE"];
  const [filteredCourses, setFilteredCourses] = useState<any[]>([]); // Store filtered courses based on department

  // Firebase configuration
  const firebaseConfig = {

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
    const fetchEquipments = async () => {
      const equipmentsRef = dbRef(db, "equipments");
      const snapshot = await get(equipmentsRef);
      const data = snapshot.val();
      const fetchedEquipments: {
        id: string;
        name: string;
        description: string;
      }[] = [];

      for (const key in data) {
        if (data[key].availability === true) {
          fetchedEquipments.push({
            id: key,
            name: data[key].name,
            description: data[key].description || "",
          });
        }
      }

      setEquipments(fetchedEquipments);
    };

    fetchEquipments();
  }, [db]);

  useEffect(() => {
    const fetchCourses = async () => {
      const coursesRef = dbRef(db, "courses");
      const snapshot = await get(coursesRef);
      const data = snapshot.val();

      const fetchCourses: {
        id: string;
        name: string;
        description: string;
        department: string;
      }[] = [];

      // Loop through departments and courses
      for (const dept in data) {
        if (departments.includes(dept)) {
          const departmentCourses = data[dept];

          // Loop through courses in the department
          for (const key in departmentCourses) {
            const course = departmentCourses[key];

            // Only push courses that are available
            if (course.availability === true) {
              fetchCourses.push({
                id: key,
                name: course.name || "", // Add name if available in the data
                description: course.description || "",
                department: dept,
              });
            }
          }
        }
      }

      setCourses(fetchCourses); // Store all fetched courses
    };

    fetchCourses();
  }, []);

  // Filter courses when department changes
  useEffect(() => {
    if (department) {
      const filtered = courses.filter(
        (course) => course.department === department
      );
      setFilteredCourses(filtered); // Set filtered courses
    } else {
      setFilteredCourses(courses); // Show all courses if no department is selected
    }
  }, [department, courses]);

  useEffect(() => {
    // Fetch booked slots
    const fetchBookedSlots = async () => {
      const bookingsRef = dbRef(db, "bookrooms");
      const snapshot = await get(bookingsRef);
      const data = snapshot.val();
      const slots: { start: Date; end: Date }[] = [];

      for (const key in data) {
        if (data[key].roomName === roomTitle) {
          const start = new Date(data[key].date + "T" + data[key].time);
          const end = new Date(start.getTime() + 60 * 60 * 1000); // 1 hour booking
          slots.push({ start, end });
        }
      }

      setBookedSlots(slots);
    };

    fetchBookedSlots();
  }, [db, roomTitle]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!date) {
      toast.error("Please select a date.");
      return;
    }

    if (selectedUsers.length === 0) {
      toast.error("Please select at least one students.");
      return;
    }

    if (selectedCourse.length === 0) {
      toast.error("Please select at least one Course.");
      return;
    }

    if (!purpose) {
      toast.error("Please enter the purpose.");
      return;
    }

    if (!department) {
      toast.error("Please select a department.");
      return;
    }

    if (!subject) {
      toast.error("Please enter the subject.");
      return;
    }

    if (!gender) {
      toast.error("Please select gender.");
      return;
    }

    if (!date) {
      toast.error("Please select a date.");
      return;
    }

    if (
      !startTime ||
      !startTime.hours ||
      !startTime.minutes ||
      !startTime.amPm
    ) {
      toast.error("Please select a valid start time.");
      return;
    }

    if (!endTime || !endTime.hours || !endTime.minutes || !endTime.amPm) {
      toast.error("Please select a valid end time.");
      return;
    }

    // Convert local time to UTC+8 before saving
    const localDate = new Date(date);

    // Convert start time to 24-hour format
    const { hours: startHours24, minutes: startMinutes24 } =
      convertTo24HourFormat(
        parseInt(startTime.hours),
        parseInt(startTime.minutes),
        startTime.amPm
      );
    const startTimeDate = new Date(
      localDate.getFullYear(),
      localDate.getMonth(),
      localDate.getDate(),
      startHours24,
      startMinutes24
    );

    // Convert end time to 24-hour format
    const { hours: endHours24, minutes: endMinutes24 } = convertTo24HourFormat(
      parseInt(endTime.hours),
      parseInt(endTime.minutes),
      endTime.amPm
    );
    const endTimeDate = new Date(
      localDate.getFullYear(),
      localDate.getMonth(),
      localDate.getDate(),
      endHours24,
      endMinutes24
    );

    // Adjust the dates to UTC+8
    const startTimeDateUTC8 = new Date(
      startTimeDate.getTime() -
        startTimeDate.getTimezoneOffset() * 60000 +
        8 * 3600000
    );
    const endTimeDateUTC8 = new Date(
      endTimeDate.getTime() -
        endTimeDate.getTimezoneOffset() * 60000 +
        8 * 3600000
    );

    // Check if the start time is before the end time
    if (startTimeDateUTC8 >= endTimeDateUTC8) {
      toast.error("End time must be after start time.");
      return;
    }

    // Check if the new booking overlaps with any existing bookings
    // Check if the time slot already exists in the database
    const existingBookingsRef = dbRef(db, "bookrooms");
    const existingBookingsSnapshot = await get(existingBookingsRef);
    const existingBookings = existingBookingsSnapshot.val();

    // Check if the new booking overlaps with any existing bookings
    const isOverlapping = bookedSlots.some((slot) => {
      const slotStart = new Date(
        new Date(slot.start).getTime() -
          new Date(slot.start).getTimezoneOffset() * 60000 +
          8 * 3600000
      );
      const slotEnd = new Date(
        new Date(slot.end).getTime() -
          new Date(slot.end).getTimezoneOffset() * 60000 +
          8 * 3600000
      );

      return (
        slotStart.toDateString() === startTimeDateUTC8.toDateString() &&
        startTimeDateUTC8 < slotEnd &&
        endTimeDateUTC8 > slotStart
      );
    });

    // Log and return if overlapping
    if (isOverlapping) {
      toast.error("The selected time slot overlaps with an existing booking.");
      return;
    }

    // Step 1: Retrieve names for all selected equipment IDs
    const equipmentNamesPromises = selectedEquipments.map(
      async (equipmentId) => {
        const equipmentRef = dbRef(db, `equipments/${equipmentId}/description`);
        const equipmentSnapshot = await get(equipmentRef);
        return equipmentSnapshot.val(); // This should return the equipment name
      }
    );

    // Wait for all promises to resolve
    const equipmentNames = await Promise.all(equipmentNamesPromises);
    console.log("Equipment Names from Selected Equipments:", equipmentNames); // Log names for debugging

    // Check if the time slot already exists for the room
    if (existingBookings) {
      const isTimeSlotTaken = Object.values(existingBookings).some(
        (booking: any) => {
          const bookingDateUTC8 = new Date(
            new Date(booking.date).getTime() -
              new Date(booking.date).getTimezoneOffset() * 60000 +
              8 * 3600000
          )
            .toISOString()
            .split("T")[0];
          return (
            bookingDateUTC8 === startTimeDateUTC8.toISOString().split("T")[0] &&
            booking.startTime ===
              `${startHours24.toString().padStart(2, "0")}:${startMinutes24
                .toString()
                .padStart(2, "0")}` &&
            booking.endTime ===
              `${endHours24.toString().padStart(2, "0")}:${endMinutes24
                .toString()
                .padStart(2, "0")}`
          );
        }
      );

      if (isTimeSlotTaken) {
        toast.error("This time slot is already booked.");
        return; // Exit if the time slot is taken
      }
    }

    // Step 3: Check selected equipments against the booked equipment
    const equipmentBookingsRef = dbRef(db, "bookequipments");
    const equipmentBookingsSnapshot = await get(equipmentBookingsRef);
    const equipmentBookings = equipmentBookingsSnapshot.val();

    if (equipmentBookings) {
      console.log("Equipment Bookings from Database:", equipmentBookings); // Log the fetched equipment bookings

      const isTimeSlotTakenForEquipments = equipmentNames.some(
        (equipmentName) => {
          console.log("Checking availability for equipment:", equipmentName); // Log each equipment being checked

          const filteredEquipmentBookings = Object.values(
            equipmentBookings
          ).filter((booking: any) => booking.equipmentName === equipmentName);

          // Check if any booking overlaps with the desired time slot
          return filteredEquipmentBookings.some((booking: any) => {
            const bookingDateUTC8 = new Date(
              new Date(booking.date).getTime() -
                new Date(booking.date).getTimezoneOffset() * 60000 +
                8 * 3600000
            )
              .toISOString()
              .split("T")[0];

            return (
              bookingDateUTC8 ===
                startTimeDateUTC8.toISOString().split("T")[0] &&
              booking.startTime ===
                `${startHours24.toString().padStart(2, "0")}:${startMinutes24
                  .toString()
                  .padStart(2, "0")}` &&
              booking.endTime ===
                `${endHours24.toString().padStart(2, "0")}:${endMinutes24
                  .toString()
                  .padStart(2, "0")}`
            );
          });
        }
      );

      if (isTimeSlotTakenForEquipments) {
        toast.error(
          "One or more selected equipments are already booked during this time."
        );
        return; // Exit if any equipment is booked
      }
    }

    // Format the date as YYYY-MM-DD
    const formattedDate = startTimeDateUTC8.toISOString().split("T")[0];

    // Booking details
    const bookingData = {
      roomName: roomTitle,
      roomId: roomId,
      studentsSelected: selectedStudents,
      date: formattedDate,
      startTime: `${startHours24.toString().padStart(2, "0")}:${startMinutes24
        .toString()
        .padStart(2, "0")}`,
      endTime: `${endHours24.toString().padStart(2, "0")}:${endMinutes24
        .toString()
        .padStart(2, "0")}`,
      borrowedBy: selectedUsers,
      purpose: purpose,
      department: department,
      course: Array.isArray(selectedCourse) ? selectedCourse : [selectedCourse], // Convert to array
      subject: subject,
      equipments: selectedEquipments, // Save selected equipments
      gender: gender,
    };

    // Reference to the bookrooms node
    const bookingRef = dbRef(db, `bookrooms/${roomId}`);

    // Generate booking data for each equipment
    const selectedequipmentNamesPromises = selectedEquipments.map(
      async (equipmentId) => {
        const equipmentRef = dbRef(db, `equipments/${equipmentId}/description`);
        const equipmentSnapshot = await get(equipmentRef);
        return { id: equipmentId, name: equipmentSnapshot.val() };
      }
    );

    // Wait for all promises to resolve
    const equipmentData = await Promise.all(selectedequipmentNamesPromises);

    try {
      // Loop through each equipment in selectedEquipments
      for (const { name: equipmentName } of equipmentData) {
        const randomId = Math.floor(1000 + Math.random() * 9000).toString();

        // Define booking data specific to each equipment
        const selectedEquipmentsData = {
          equipmentName,
          studentsSelected: selectedStudents,
          date: formattedDate,
          startTime: `${startHours24
            .toString()
            .padStart(2, "0")}:${startMinutes24.toString().padStart(2, "0")}`,
          endTime: `${endHours24.toString().padStart(2, "0")}:${endMinutes24
            .toString()
            .padStart(2, "0")}`,
          borrowedBy: selectedUsers,
          purpose,
          department,
          course: Array.isArray(selectedCourse)
            ? selectedCourse
            : [selectedCourse],
          subject,
        };

        // Reference to bookequipments node for this specific equipment
        const equipmentBookingRef = dbRef(db, `bookequipments/${randomId}`);

        // Save booking data to Firebase for each equipment
        await set(equipmentBookingRef, selectedEquipmentsData);
        await incrementEquipmentUsed(equipmentName);
      }

      // Save booking data to Firebase
      await set(bookingRef, bookingData);

      // Generate QR code
      const qrCodeData = `Room Name: ${roomTitle}, Room ID: ${roomId}, Students Selected: ${selectedStudents.join(
        ", "
      )}, Equipments: ${selectedEquipments}
      Date: ${formattedDate}, Start Time: ${bookingData.startTime}, End Time: ${
        bookingData.endTime
      }, Borrowed By: ${selectedUsers.join(
        ", "
      )}, Purpose: ${purpose}, Department: ${department}, Course: ${
        Array.isArray(selectedCourse)
          ? selectedCourse
          : [selectedCourse].join(", ")
      }, Subject: ${subject}, Gender: ${gender}`;

      const qrCodeUrl = await QRCode.toDataURL(qrCodeData);

      const userid = selectedUsers.join(", ");
      // Upload QR code to Firebase Storage
      const storage = getStorage(app);
      const qrCodeRef = ref(
        storage,
        `QRCode/${userid}/${roomTitle}/${roomId}.png`
      );
      await uploadString(qrCodeRef, qrCodeUrl.split(",")[1], "base64", {
        contentType: "image/png",
      });

      // Call incrementEquipmentUsed for each selected equipment ID
      await Promise.all(
        selectedEquipments.map(async (equipmentId) => {
          console.log(
            `Attempting to increment count for equipment ID: ${equipmentId}`
          );
          await incrementEquipmentUsed(equipmentId);
          console.log(
            `Successfully incremented count for equipment ID: ${equipmentId}`
          );
        })
      );

      toast.success("Room booked successfully!");
      setTimeout(() => {
        navigate("/Dashboard");
      }, 2000);

      // Clear form fields after successful submission
      setDate(null);
      setStudents([]);
      setStudentName("");
      setSelectedUsers([]);
      setPurpose("");
      setDepartment("");
      setCourses([]);
      setGender("");
      setSubject("");
      setSelectedEquipments([]); // Reset equipments selection
      setStartTime({ hours: "0", minutes: "00", amPm: "AM" });
      setEndTime({ hours: "0", minutes: "00", amPm: "AM" });
    } catch (error) {
      console.error("Error booking room:", error);
      toast.error(
        "An error occurred while booking the room. Please try again."
      );
    }
  };

  // Function to increment equipmentUsed count by equipment ID
  const incrementEquipmentUsed = async (equipmentId: string) => {
    const db = getDatabase();

    console.log(`Fetching equipment details for ID: ${equipmentId}`);

    const equipmentRef = dbRef(db, `equipments/${equipmentId}`);

    try {
      const equipmentSnapshot = await get(equipmentRef);
      const equipmentData = equipmentSnapshot.val();

      if (equipmentData) {
        const { description } = equipmentData;
        const currentCount = equipmentData.equipmentUsed || 0; // Default to 0 if undefined
        const newCount = currentCount + 1; // Increment the count

        // Update the equipment entry in the database
        await set(equipmentRef, {
          ...equipmentData,
          equipmentUsed: newCount,
        });

        console.log(
          `Equipment used count for "${description}" (ID: ${equipmentId}) updated to ${newCount}.`
        );
      } else {
        console.error(`No equipment found with ID: "${equipmentId}"`);
      }
    } catch (error) {
      console.error("Error incrementing equipmentUsed count:", error);
    }
  };

  const convertTo24HourFormat = (
    hours: number,
    minutes: number,
    amPm: string
  ): { hours: number; minutes: number } => {
    let convertedHours = hours;

    if (amPm === "PM" && hours !== 12) {
      convertedHours += 12;
    } else if (amPm === "AM" && hours === 12) {
      convertedHours = 0;
    }

    return { hours: convertedHours, minutes };
  };

  const handleStartTimeChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => setStartTime({ ...startTime, [e.target.name]: e.target.value });

  const handleEndTimeChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => setEndTime({ ...endTime, [e.target.name]: e.target.value });

  // Functions to handle user selection
  const handleSelectBorrowedBy = (selected: string[]) => {
    setSelectedUsers(selected);
    setShowBorrowedBySelection(false);
  };

  const handleSelectEquipments = (selected: string[]) => {
    setSelectedEquipments(selected);
    setShowEquipmentsSelection(false);
  };

  // Handle show modals
  const openBorrowedByModal = () => setShowBorrowedBySelection(true);
  const openEquipmentsModal = () => setShowEquipmentsSelection(true);

  // Set the minimum date for booking to the current date
  const minBookingDate = new Date();

  return (
    <div className="min-h-screen flex flex-col md:flex-row text-white">
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
            <li className="mb-4 bg-green-800 border-2 border-green-600 rounded-full p-1">
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

      <main className="flex-1 p-6 bg-white h-screen overflow-y-auto">
        <div className="flex flex-col items-center justify-center min-h-screen">
          <div className="w-full max-w-4xl my-8">
            <form
              onSubmit={handleSubmit}
              className="bg-white shadow-lg rounded px-8 pt-6 pb-8 mt-6 mb-6 border border-gray-200"
            >
              <h2 className="text-center text-2xl font-bold mb-6 text-black">
                {roomTitle}
              </h2>
              <div className="flex flex-wrap mb-4">
                {" "}
                {/* Use flexbox for arrangement */}
                <div className="w-full md:w-1/2 pr-2">
                  {" "}
                  {/* Left side */}
                  <div className="mb-4">
                    <label
                      className="block text-black text-sm font-bold mb-2"
                      htmlFor="room-id"
                    >
                      Room ID
                    </label>
                    <input
                      id="room-id"
                      type="text"
                      value={roomId}
                      readOnly
                      className="shadow appearance-none border bg-gray-200 rounded w-full py-2 px-3 text-black leading-tight focus:outline-none focus:shadow-outline"
                    />
                  </div>
                  <div className="mb-4">
                    <label
                      htmlFor="department"
                      className="block text-black text-sm font-bold mb-2"
                    >
                      Department:
                    </label>
                    <select
                      id="department"
                      value={department}
                      onChange={(e) => setDepartment(e.target.value)}
                      className="shadow appearance-none border bg-white rounded w-full py-2 px-3 text-black leading-tight focus:outline-none focus:shadow-outline"
                    >
                      <option value="">Select a department</option>
                      {departments.map((dept) => (
                        <option key={dept} value={dept}>
                          {dept}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label
                      htmlFor="course"
                      className="block text-black text-sm font-bold mb-2 mt-2"
                    >
                      Program:
                    </label>
                    <select
                      id="course"
                      value={selectedCourse} // This should hold the ID of the selected course
                      onChange={(e) => setSelectedCourse(e.target.value)} // Update the selected course ID
                      className="shadow appearance-none border bg-white rounded w-full py-2 px-3 text-black leading-tight focus:outline-none focus:shadow-outline"
                    >
                      <option value="">Select a Program</option>
                      {filteredCourses.map((course) => (
                        <option key={course.id} value={course.id}>
                          {course.description}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label
                      htmlFor="subject"
                      className="block text-black text-sm font-bold mb-2 mt-2"
                    >
                      Subject:
                    </label>
                    <input
                      type="text"
                      id="subject"
                      value={subject}
                      onChange={(e) => setSubject(e.target.value)}
                      className="shadow appearance-none border bg-white rounded w-full py-2 px-3 text-black leading-tight focus:outline-none focus:shadow-outline"
                    />
                  </div>
                </div>
                <div className="w-full md:w-1/2 pl-2">
                  {" "}
                  {/* Right side */}
                  <div className="mb-4">
                    <label
                      htmlFor="purpose"
                      className="block text-black text-sm font-bold mb-2 mt-2"
                    >
                      Purpose:
                    </label>
                    <select
                      id="purpose"
                      value={purpose}
                      onChange={(e) => setPurpose(e.target.value)}
                      className="shadow appearance-none border bg-white rounded w-full py-2 px-3 text-black leading-tight focus:outline-none focus:shadow-outline"
                    >
                      <option value="">Select Purpose</option>
                      <option value="Meetings">Meetings</option>
                      <option value="Discussions">Discussions</option>
                      <option value="Workshops">Workshops</option>
                      <option value="Presentations">Presentations</option>
                      <option value="Training">Training</option>
                      <option value="Reporting">Reporting</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                  <div>
                    <label
                      htmlFor="gender"
                      className="block text-black text-sm font-bold mb-2 mt-2"
                    >
                      Gender:
                    </label>
                    <select
                      id="gender"
                      value={gender} // Consider renaming `purpose` to `gender` for clarity
                      onChange={(e) => setGender(e.target.value)}
                      className="shadow appearance-none border bg-white rounded w-full py-2 px-3 text-black leading-tight focus:outline-none focus:shadow-outline"
                    >
                      <option value="">Select Gender</option>
                      <option value="male">Male</option>
                      <option value="female">Female</option>
                    </select>
                  </div>
                  <div className="mb-4">
                    <label
                      className="block text-black text-sm font-bold mb-2 mt-2"
                      htmlFor="borrowed-by"
                    >
                      Booked By:
                    </label>
                    <button
                      type="button"
                      onClick={openBorrowedByModal}
                      className="p-2 bg-black text-white rounded"
                    >
                      Select Students
                    </button>
                    {selectedUsers.length > 0 && (
                      <ul className="mt-3">
                        {selectedUsers.map((user, index) => (
                          <li
                            key={index}
                            className="shadow appearance-none border bg-white rounded w-full py-2 px-3 text-black leading-tight focus:outline-none focus:shadow-outline"
                          >
                            {users.find((u) => u.id === user)?.name || user}
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                  <div className="mb-4">
                    <label
                      className="block text-black text-sm font-bold mb-2 mt-2"
                      htmlFor="equipments"
                    >
                      Add Equipments:
                    </label>
                    <button
                      type="button"
                      onClick={openEquipmentsModal}
                      className="p-2 bg-black text-white rounded"
                    >
                      Select Equipments
                    </button>
                    {selectedEquipments.length > 0 && (
                      <ul className="mt-3">
                        {selectedEquipments.map((equipmentId, index) => {
                          return (
                            <li
                              key={index}
                              className="shadow appearance-none border bg-white rounded w-full py-2 px-3 text-black leading-tight focus:outline-none focus:shadow-outline"
                            >
                              {equipments.find((u) => u.id === equipmentId)
                                ?.description || equipmentId}
                            </li>
                          );
                        })}
                      </ul>
                    )}
                  </div>
                </div>
              </div>

              {/* Date, Start Time, and End Time in the Same Line */}
              <div className="flex flex-wrap mb-4 items-center">
                {/* Flex container for alignment */}
                <div className="w-full md:w-1/3 pr-2">
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
                      minDate={minBookingDate} // Set the minimum selectable date
                      className="shadow appearance-none border bg-white rounded w-full py-2 px-3 text-black leading-tight focus:outline-none focus:shadow-outline"
                      dateFormat="yyyy-MM-dd"
                    />
                  </div>
                </div>
                <div className="w-full md:w-1/3 px-2">
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
                        className="shadow appearance-none border bg-white rounded w-1/4 py-2 px-3 text-black leading-tight focus:outline-none focus:shadow-outline"
                      />
                      <input
                        name="minutes"
                        type="number"
                        min="0"
                        max="59"
                        value={startTime.minutes}
                        onChange={handleStartTimeChange}
                        placeholder="MM"
                        className="shadow appearance-none border bg-white rounded w-1/4 py-2 px-3 text-black leading-tight focus:outline-none focus:shadow-outline"
                      />
                      <select
                        name="amPm"
                        value={startTime.amPm}
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
                </div>
                <div className="w-full md:w-1/3 pl-2">
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
                        className="shadow appearance-none border bg-white rounded w-1/4 py-2 px-3 text-black leading-tight focus:outline-none focus:shadow-outline"
                      />
                      <input
                        name="minutes"
                        type="number"
                        min="0"
                        max="59"
                        value={endTime.minutes}
                        onChange={handleEndTimeChange}
                        placeholder="MM"
                        className="shadow appearance-none border bg-white rounded w-1/4 py-2 px-3 text-black leading-tight focus:outline-none focus:shadow-outline"
                      />
                      <select
                        name="amPm"
                        value={endTime.amPm}
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
                </div>
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
      {/* User selection modals */}
      {showBorrowedBySelection && (
        <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
          <UserSelection
            users={users}
            selectedUsers={selectedUsers}
            onSelect={handleSelectBorrowedBy}
            onCancel={() => setShowBorrowedBySelection(false)}
          />
        </div>
      )}
      {showEquipmentsSelection && (
        <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
          <EquipmentSelection
            equipments={equipments}
            selectedEquipments={selectedEquipments}
            onSelect={handleSelectEquipments}
            onCancel={() => setShowEquipmentsSelection(false)}
          />
        </div>
      )}

      <ToastContainer />
    </div>
  );
};

export default imcAvr;
