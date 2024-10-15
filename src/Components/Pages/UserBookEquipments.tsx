import React, { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import {
  getDatabase,
  ref as dbRef,
  set,
  Database,
  get,
  onValue,
} from "firebase/database";
import schoolLogo from "../../assets/scclogo.png";
import dashboardlogo from "../../assets/dashboardlogo.png";
import historyLogo from "../../assets/reportslogo.png";
import borrowLogo from "../../assets/borrowicon.png";
import faqLogo from "../../assets/faqlogo.png";
import guidelinesLogo from "../../assets/guidelineslogo.png";
import { FirebaseApp, initializeApp } from "firebase/app";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import UserSelection from "./BorrowedUserSelection";
import CourseSelection from "./CourseSelection";
import { getAuth } from "firebase/auth";
import EquipmentSelection from "./EquipmentSelection";

const generateRandomRoomId = () => {
  return Math.floor(Math.random() * 10000) + 1; // Random number between 1 and 10000
};

const UserBookEquipments: React.FC = () => {
  const location = useLocation();
  const equipmentTitle = location.state?.equipmentTitle || "Unknown Equipments";
  const [date, setDate] = useState<Date | null>(null);

  const [, setStudents] = useState<string[]>([]);

  const [, setStudentName] = useState<string>("");
  const [equipmentId] = useState(generateRandomRoomId());
  const [, setBookedSlots] = useState<{ start: Date; end: Date }[]>([]);
  const [users, setUsers] = useState<{ id: string; name: string }[]>([]);
  const [purpose, setPurpose] = useState<string>("");
  const [locationField, setlocation] = useState<string>("");
  const [contact, setcontact] = useState<string>("");
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
  const [selectedStudents, setSelectedStudents] = useState<string[]>([]);
  const [showBorrowedBySelection, setShowBorrowedBySelection] = useState(false);
  const [showStudentsSelection, setShowStudentsSelection] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [selectedEquipments, setSelectedEquipments] = useState<string[]>([]);
  const [showEquipmentsSelection, setShowEquipmentsSelection] = useState(false);
  const [equipments, setEquipments] = useState<
    { id: string; name: string; description: string }[]
  >([]); // New state
  const [courses, setCourses] = useState<
    { id: string; name: string; description: string }[]
  >([]); // New state
  const [selectedCourses, setSelectedCourses] = useState<string[]>([]);
  const [showCourseSelection, setShowCourseSelection] = useState(false);
  const handleDateChange = (date: any) => setDate(date);
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
  const auth = getAuth(app);

  useEffect(() => {
    // Fetch the current logged-in user ID
    const user = auth.currentUser;
    if (user) {
      setCurrentUserId(user.uid);
      setSelectedUsers([user.uid]); // Set the current user as the selected user
    }
  }, [auth]);

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
      }[] = [];

      for (const key in data) {
        if (data[key].availability === true) {
          fetchCourses.push({
            id: key,
            name: data[key].name,
            description: data[key].description || "",
          });
        }
      }

      setCourses(fetchCourses);
    };

    fetchCourses();
  }, [db]);

  useEffect(() => {
    // Fetch booked slots
    const fetchBookedSlots = async () => {
      const bookingsRef = dbRef(db, "bookequipments");
      const snapshot = await get(bookingsRef);
      const data = snapshot.val();
      const slots: { start: Date; end: Date }[] = [];

      for (const key in data) {
        if (data[key].equipmentName === equipmentTitle) {
          const start = new Date(data[key].date + "T" + data[key].time);
          const end = new Date(start.getTime() + 60 * 60 * 1000); // 1 hour booking
          slots.push({ start, end });
        }
      }

      setBookedSlots(slots);
    };

    fetchBookedSlots();
  }, [db, equipmentTitle]);

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

    if (selectedCourses.length === 0) {
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

    if (!date) {
      toast.error("Please select a date.");
      return;
    }

    if (!contact) {
      toast.error("Please enter the phone number.");
      return;
    }

    if (!locationField) {
      toast.error("Please enter a location.");
      return;
    }

    // Ensure no undefined values in selectedCourses
    const validCourses = selectedCourses.filter(
      (course) => course !== undefined && course !== null
    );
    if (validCourses.length === 0) {
      toast.error("One or more courses are invalid.");
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

    // Format the date as YYYY-MM-DD
    const formattedDate = startTimeDateUTC8.toISOString().split("T")[0];

    // Booking details
    const bookingData = {
      equipmentName: equipmentTitle,
      equipmentId: equipmentId,
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
      location: locationField,
      contact: contact,
      department: department,
      course: validCourses,
      equipments: selectedEquipments,
      subject: subject,
    };

    // Reference to the bookrooms node
    const bookingRef = dbRef(db, `pendingEquipmentBookings/${equipmentId}`);

    try {
      // Save booking data to Firebase
      await set(bookingRef, bookingData);

      changeAvailabilityToFalse(equipmentTitle);

      toast.success("Waiting for the Admin confirmation!");
      setTimeout(() => {
        navigate("/UserDashboard");
      }, 2000);

      // Clear form fields after successful submission
      setDate(null);
      setStudents([]);
      setStudentName("");
      setSelectedUsers([]);
      setPurpose("");
      setDepartment("");
      setCourses([]);
      setSubject("");
      setStartTime({ hours: "0", minutes: "00", amPm: "AM" });
      setEndTime({ hours: "0", minutes: "00", amPm: "AM" });
    } catch (error) {
      console.error("Error booking equipment:", error);
      toast.error(
        "An error occurred while booking the equipment. Please try again."
      );
    }
  };

  // Function to get the equipment key by matching description
  const getEquipmentKeyByDescription = async (
    db: Database,
    description: string
  ): Promise<string | null> => {
    return new Promise((resolve) => {
      const equipmentsRef = dbRef(db, "equipments");

      onValue(equipmentsRef, (snapshot) => {
        const data = snapshot.val();
        let foundKey: string | null = null;

        for (const key in data) {
          const equipment = data[key];
          if (equipment.description === description) {
            foundKey = key;
            break;
          }
        }

        if (foundKey) {
          resolve(foundKey);
        } else {
          resolve(null);
        }
      });
    });
  };

  // Usage of the function to change availability
  const changeAvailabilityToFalse = async (description: string) => {
    const db = getDatabase();

    try {
      const equipmentKey = await getEquipmentKeyByDescription(db, description);

      if (equipmentKey) {
        const availabilityRef = dbRef(
          db,
          `equipments/${equipmentKey}/availability`
        );
        await set(availabilityRef, false);
        console.log(`Availability for "${description}" has been set to false.`);
      } else {
        console.log(`Equipment with description "${description}" not found.`);
      }
    } catch (error) {
      console.error("Error updating availability:", error);
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

  const handleSelectStudents = (selected: string[]) => {
    setSelectedStudents(selected);
    setShowStudentsSelection(false);
  };

  const handleSelectEquipments = (selected: string[]) => {
    setSelectedEquipments(selected);
    setShowEquipmentsSelection(false);
  };

  const handleSelectCourses = (selected: string[]) => {
    setSelectedCourses(selected);
    setShowCourseSelection(false);
  };

  // Calculate the minimum date for booking (3 days from today)
  const minBookingDate = new Date();
  minBookingDate.setDate(minBookingDate.getDate() + 3);

  const openEquipmentsModal = () => setShowEquipmentsSelection(true);
  const openCourseModal = () => setShowCourseSelection(true);
  const openUserModal = () => setShowBorrowedBySelection(true);

  return (
    <div className="min-h-screen flex flex-col md:flex-row text-white">
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
                className="flex items-center p-2 hover:bg-gray-200 rounded-md"
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
        <div className="flex flex-col items-center justify-center min-h-screen">
          <div className="w-full max-w-xs">
            <form
              onSubmit={handleSubmit}
              className="bg-white shadow-md rounded px-8 pt-6 pb-8 mb-4"
            >
              <h2 className="text-center text-2xl font-bold mb-6 text-black">
                {equipmentTitle}
              </h2>
              <div className="mb-4">
                <label
                  className="block text-black text-sm font-bold mb-2"
                  htmlFor="room-id"
                >
                  Equipment ID
                </label>
                <input
                  id="room-id"
                  type="text"
                  value={equipmentId}
                  readOnly
                  className="shadow appearance-none border bg-white rounded w-full py-2 px-3 text-black leading-tight focus:outline-none focus:shadow-outline"
                />
              </div>
              <div>
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
                  <option value="CCS">CCS</option>
                  <option value="CTEAS">CTEAS</option>
                  <option value="CBE">CBE</option>
                  <option value="COC">COC</option>
                </select>
              </div>
              <div>
                <label
                  htmlFor="course"
                  className="block text-black text-sm font-bold mb-2 mt-2"
                >
                  Course:
                </label>
                <button
                  type="button"
                  onClick={openCourseModal}
                  className="p-2 bg-black text-white rounded"
                >
                  Select Course
                </button>
                {selectedCourses.length > 0 && (
                  <ul className="mt-3">
                    {selectedCourses.map((coursesId, index) => {
                      return (
                        <li
                          key={index}
                          className="shadow appearance-none border bg-white rounded w-full py-2 px-3 text-black leading-tight focus:outline-none focus:shadow-outline"
                        >
                          {courses.find((u) => u.id === coursesId)
                            ?.description || coursesId}
                        </li>
                      );
                    })}
                  </ul>
                )}
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
              <div>
                <label
                  htmlFor="purpose"
                  className="block text-black text-sm font-bold mb-2 mt-2"
                >
                  Purpose:
                </label>
                <input
                  type="text"
                  id="purpose"
                  value={purpose}
                  onChange={(e) => setPurpose(e.target.value)}
                  className="shadow appearance-none border bg-white rounded w-full py-2 px-3 text-black leading-tight focus:outline-none focus:shadow-outline"
                />
              </div>

              <div>
                <label
                  htmlFor="location"
                  className="block text-black text-sm font-bold mb-2 mt-2"
                >
                  Location:
                </label>
                <input
                  type="text"
                  id="location"
                  value={locationField}
                  onChange={(e) => setlocation(e.target.value)}
                  className="shadow appearance-none border bg-white rounded w-full py-2 px-3 text-black leading-tight focus:outline-none focus:shadow-outline"
                />
              </div>
              <div>
                <label
                  htmlFor="contact"
                  className="block text-black text-sm font-bold mb-2 mt-2"
                >
                  Phone Number:
                </label>
                <input
                  type="text"
                  id="contact"
                  value={contact}
                  onChange={(e) => {
                    let value = e.target.value;

                    // Remove non-numeric characters
                    value = value.replace(/\D/g, "");

                    // Ensure the number starts with "09" and is exactly 11 digits long
                    if (value.startsWith("09")) {
                      if (value.length > 11) {
                        value = value.slice(0, 11); // Trim to 11 digits
                      }
                    } else {
                      // Automatically prepend "09" if not present
                      value = `09${value}`.slice(0, 11); // Prepend "09" and trim to 11 digits
                    }

                    setcontact(value);
                  }}
                  maxLength={11} // Maximum length of the input
                  placeholder="09xxxxxxxxx" // Hint for the user
                  className="shadow appearance-none border bg-white rounded w-full py-2 px-3 text-black leading-tight focus:outline-none focus:shadow-outline"
                />
              </div>

              <div className="mb-4">
                <label
                  className="block text-black text-sm font-bold mb-2 mt-2"
                  htmlFor="students"
                >
                  Borrowed By:
                </label>
                <button
                  type="button"
                  onClick={openUserModal}
                  className="p-2 bg-black text-white rounded"
                >
                  Select Borowed By
                </button>
                {selectedUsers.length > 0 && (
                  <ul className="mt-3">
                    {selectedUsers.map((userId) => {
                      const user = users.find((u) => u.id === userId);
                      return (
                        <li
                          key={userId}
                          className="shadow appearance-none border bg-white rounded w-full py-2 px-3 text-black leading-tight focus:outline-none focus:shadow-outline"
                        >
                          {user ? user.name : userId}{" "}
                          {/* Fallback to user ID if name not found */}
                        </li>
                      );
                    })}
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
            users={[users.find((user) => user.id === currentUserId)!]} // Pass only the current user
            selectedUsers={selectedUsers}
            onSelect={handleSelectBorrowedBy}
            onCancel={() => setShowBorrowedBySelection(false)}
          />
        </div>
      )}
      {showStudentsSelection && (
        <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
          <UserSelection
            users={users}
            selectedUsers={selectedStudents}
            onSelect={handleSelectStudents}
            onCancel={() => setShowStudentsSelection(false)}
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
      {showCourseSelection && (
        <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
          <CourseSelection
            courses={courses}
            selectedCourses={selectedCourses}
            onSelect={handleSelectCourses}
            onCancel={() => setShowCourseSelection(false)}
          />
        </div>
      )}

      <ToastContainer />
    </div>
  );
};

export default UserBookEquipments;
