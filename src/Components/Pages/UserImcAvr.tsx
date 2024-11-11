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
import historyLogo from "../../assets/reportslogo.png";
import borrowLogo from "../../assets/borrowicon.png";
import faqLogo from "../../assets/faqlogo.png";
import guidelinesLogo from "../../assets/guidelineslogo.png";
import { FirebaseApp, initializeApp } from "firebase/app";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { getAuth, User } from "firebase/auth";
import EquipmentSelection from "./EquipmentSelection";
import Lottie from "lottie-react";
import loadingAnimation from "../../assets/loadinganimation2.json";

const generateRandomRoomId = () => {
  return Math.floor(Math.random() * 10000) + 1; // Random number between 1 and 10000
};

const BookRoom: React.FC = () => {
  const location = useLocation();
  const roomTitle = location.state?.roomTitle || "Unknown Room";
  const [date, setDate] = useState<Date | null>(null);

  const [, setStudents] = useState<string[]>([]);

  const [, setStudentName] = useState<string>("");
  const [roomId] = useState(generateRandomRoomId());
  const [bookedSlots, setBookedSlots] = useState<{ start: Date; end: Date }[]>(
    []
  );
  const [user, setUser] = useState<User | null>(null);
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
  const [, setCurrentUserId] = useState<string | null>(null);
  const handleDateChange = (date: any) => setDate(date);
  const [equipments, setEquipments] = useState<
    { id: string; name: string; description: string }[]
  >([]); // New state
  const [selectedEquipments, setSelectedEquipments] = useState<string[]>([]);
  const [showEquipmentsSelection, setShowEquipmentsSelection] = useState(false);
  const [courses, setCourses] = useState<
    { id: string; name: string; description: string; department: string }[]
  >([]);
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [selectedCourse, setSelectedCourse] = useState<string>(""); // For current selection
  const departments = ["CCS", "COC", "CTEAS", "CBE"];
  const [filteredCourses, setFilteredCourses] = useState<any[]>([]); // Store filtered courses based on department

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
    const unsubscribe = auth.onAuthStateChanged((authUser) => {
      if (authUser) {
        setUser(authUser); // Save the authenticated user to the state
        setSelectedUsers([authUser.uid]); // Set the current user as the selected user
        setCurrentUserId(authUser.uid);
      } else {
        setUser(null); // Clear user state if no one is logged in
      }
      setLoading(false); // Stop loading once the user state is set
    });

    return () => unsubscribe(); // Clean up the listener
  }, []);

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

    // Perform validation checks (e.g., date, selectedEquipments, selectedCourse, etc.)
    if (!date) {
      toast.error("Please select a date.");
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

    if (startTimeDateUTC8 >= endTimeDateUTC8) {
      toast.error("End time must be after start time.");
      return;
    }

    // Step 1: Retrieve existing bookings
    const existingBookingsRef = dbRef(db, "bookrooms");
    const existingBookingsSnapshot = await get(existingBookingsRef);
    const existingBookings = existingBookingsSnapshot.val();

    // Step 2: Check for overlapping bookings
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

    if (isOverlapping) {
      toast.error("The selected time slot overlaps with an existing booking.");
      return;
    }

    // Step 3: Check if the time slot already exists for the room in bookrooms
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
        return;
      }
    }

    // Step 4: Check for overlapping in pendingRoomBookings
    const pendingBookingsRef = dbRef(db, "pendingRoomBookings");
    const pendingBookingsSnapshot = await get(pendingBookingsRef);
    const pendingBookings = pendingBookingsSnapshot.val();

    if (pendingBookings) {
      const isPendingTimeSlotTaken = Object.values(pendingBookings).some(
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

      if (isPendingTimeSlotTaken) {
        toast.error("This time slot is pending booking.");
        return;
      }
    }

    // Step 5: Check selectedEquipments against booked and pending equipment bookings
    const equipmentBookingsRef = dbRef(db, "bookequipments");
    const equipmentBookingsSnapshot = await get(equipmentBookingsRef);
    const equipmentBookings = equipmentBookingsSnapshot.val();

    const pendingEquipmentBookingsRef = dbRef(db, "pendingEquipmentBookings");
    const pendingEquipmentBookingsSnapshot = await get(
      pendingEquipmentBookingsRef
    );
    const pendingEquipmentBookings = pendingEquipmentBookingsSnapshot.val();

    const isEquipmentSlotTaken = selectedEquipments.some((equipmentId) => {
      const equipmentName = equipmentBookings?.[equipmentId]?.equipmentName;
      const isBooked =
        equipmentName &&
        Object.values(equipmentBookings).some(
          (booking: any) =>
            booking.equipmentName === equipmentName &&
            booking.date === startTimeDateUTC8.toISOString().split("T")[0] &&
            booking.startTime ===
              `${startHours24.toString().padStart(2, "0")}:${startMinutes24
                .toString()
                .padStart(2, "0")}` &&
            booking.endTime ===
              `${endHours24.toString().padStart(2, "0")}:${endMinutes24
                .toString()
                .padStart(2, "0")}`
        );

      const isPending =
        equipmentName &&
        Object.values(pendingEquipmentBookings).some(
          (booking: any) =>
            booking.equipmentName === equipmentName &&
            booking.date === startTimeDateUTC8.toISOString().split("T")[0] &&
            booking.startTime ===
              `${startHours24.toString().padStart(2, "0")}:${startMinutes24
                .toString()
                .padStart(2, "0")}` &&
            booking.endTime ===
              `${endHours24.toString().padStart(2, "0")}:${endMinutes24
                .toString()
                .padStart(2, "0")}`
        );

      return isBooked || isPending;
    });

    if (isEquipmentSlotTaken) {
      toast.error(
        "One or more selected equipments are already booked or pending during this time."
      );
      return;
    }

    // Format the date as YYYY-MM-DD
    const formattedDate = startTimeDateUTC8.toISOString().split("T")[0];

    // Booking details
    const bookingData = {
      roomName: roomTitle,
      roomId: roomId,
      equipments: selectedEquipments,
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
      course: Array.isArray(selectedCourse) ? selectedCourse : [selectedCourse],
      subject: subject,
      gender: gender,
    };

    // Reference to the bookrooms node
    const bookingRef = dbRef(db, `pendingRoomBookings/${roomId}`);

    try {
      // Save booking data to Firebase
      await set(bookingRef, bookingData);

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
      setGender("");
      setStartTime({ hours: "0", minutes: "00", amPm: "AM" });
      setEndTime({ hours: "0", minutes: "00", amPm: "AM" });
      setSelectedEquipments([]); // Reset equipments selection
    } catch (error) {
      console.error("Error booking room:", error);
      toast.error(
        "An error occurred while booking the room. Please try again."
      );
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

  const handleSelectEquipments = (selected: string[]) => {
    setSelectedEquipments(selected);
    setShowEquipmentsSelection(false);
  };

  const openEquipmentsModal = () => setShowEquipmentsSelection(true);

  // Calculate the minimum date for booking (3 days from today)
  const minBookingDate = new Date();
  minBookingDate.setDate(minBookingDate.getDate() + 3);

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
    <div className="min-h-screen flex flex-col md:flex-row text-white">
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
                <img src={borrowLogo} alt="Dashboard" className="h-6 w-6" />
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

      <main className="flex-1 p-6 bg-white h-screen overflow-y-auto">
        <div className="flex flex-col items-center justify-center h-full">
          <div className="w-full max-w-4xl my-8">
            <form
              onSubmit={handleSubmit}
              className="bg-white shadow-lg rounded px-8 pt-6 pb-8 mt-6 mb-6 border border-gray-200"
            >
              <h2 className="text-center text-2xl font-bold mb-6 text-black">
                {roomTitle}
              </h2>
              <div className="flex flex-wrap mb-4">
                {/* Use flexbox for arrangement */}
                <div className="w-full md:w-1/2 pr-2">
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
                      htmlFor="students"
                    >
                      Booked By:
                    </label>
                    {user ? (
                      <div className="shadow appearance-none border bg-white rounded w-full py-2 px-3 text-black leading-tight focus:outline-none focus:shadow-outline">
                        {user.displayName || user.email || user.uid}
                        {/* Display user's name, email, or UID */}
                      </div>
                    ) : (
                      <div className="shadow appearance-none border bg-white rounded w-full py-2 px-3 text-black leading-tight focus:outline-none focus:shadow-outline">
                        No user logged in.
                      </div>
                    )}
                  </div>

                  <div className="mb-4">
                    <label
                      className="block text-black text-sm font-bold mb-2 mt-2"
                      htmlFor="students"
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
                        {selectedEquipments.map((equipmentId, index) => (
                          <li
                            key={index}
                            className="shadow appearance-none border bg-white rounded w-full py-2 px-3 text-black leading-tight focus:outline-none focus:shadow-outline"
                          >
                            {equipments.find((u) => u.id === equipmentId)
                              ?.description || equipmentId}
                          </li>
                        ))}
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

export default BookRoom;
