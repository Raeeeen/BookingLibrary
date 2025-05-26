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
import UserSelection from "./BorrowedUserSelection";
import { getAuth, User } from "firebase/auth";
import EquipmentSelection from "./EquipmentSelection";
import Lottie from "lottie-react";
import loadingAnimation from "../../assets/loadinganimation2.json";

const generateRandomRoomId = () => {
  return Math.floor(Math.random() * 10000) + 1; // Random number between 1 and 10000
};

// Define the booking type based on your structure
type Booking = {
  date: string; // Assuming date is a string in YYYY-MM-DD format
  startTime: string; // Assuming startTime is in HH:mm format
  endTime: string; // Assuming endTime is in HH:mm format
  equipmentName?: string; // Optional, if applicable
  equipments?: string[]; // Add equipments as an array of IDs
};

const UserBookEquipments: React.FC = () => {
  const location = useLocation();
  const equipmentTitle = location.state?.equipmentTitle || "Unknown Equipments";
  const [date, setDate] = useState<Date | null>(null);

  const [, setStudents] = useState<string[]>([]);

  const [, setStudentName] = useState<string>("");
  const [equipmentId] = useState(generateRandomRoomId());
  const [bookedSlots, setBookedSlots] = useState<{ start: Date; end: Date }[]>(
    []
  );
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
    { id: string; name: string; description: string; department: string }[]
  >([]);
  const handleDateChange = (date: any) => setDate(date);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const [selectedCourse, setSelectedCourse] = useState<string>(""); // For current selection
  const departments = ["CCS", "COC", "CTEAS", "CBE"];
  const [filteredCourses, setFilteredCourses] = useState<any[]>([]); // Store filtered courses based on department

  // Firebase configuration
  const firebaseConfig = {

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

    // Validation checks
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

    if (!contact) {
      toast.error("Please enter the phone number.");
      return;
    }

    if (!locationField) {
      toast.error("Please enter a location.");
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

    // Check if the new booking overlaps with any existing bookings
    const isOverlapping = bookedSlots.some((slot) => {
      const slotStart = new Date(
        new Date(slot.start).getTime() -
          new Date(slot.start).getTimezoneOffset() * 60000 +
          8 * 3600000
      ); // Adjust slot.start to UTC+8
      const slotEnd = new Date(
        new Date(slot.end).getTime() -
          new Date(slot.end).getTimezoneOffset() * 60000 +
          8 * 3600000
      ); // Adjust slot.end to UTC+8

      // Overlapping condition: Start time before existing end time AND end time after existing start time
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
    // Retrieve bookings for the selected equipment from both bookequipments and pendingEquipmentBookings
    const existingBookingsRef1 = dbRef(db, "bookequipments");
    const pendingBookingsRef1 = dbRef(db, "pendingEquipmentBookings");

    const [existingBookingsSnapshot1, pendingBookingsSnapshot1] =
      await Promise.all([get(existingBookingsRef1), get(pendingBookingsRef1)]);

    const existingBookings1 = existingBookingsSnapshot1.val();
    const pendingBookings1 = pendingBookingsSnapshot1.val();

    // Combine bookings from bookequipments and pendingEquipmentBookings
    const allEquipmentBookings = [
      ...(existingBookings1 ? Object.values(existingBookings1) : []),
      ...(pendingBookings1 ? Object.values(pendingBookings1) : []),
    ];

    // Filter to get only bookings for the selected equipmentTitle
    const filteredEquipmentBookings = allEquipmentBookings.filter(
      (booking: any) => booking.equipmentName === equipmentTitle
    );

    // Check for time slot overlap
    const isTimeSlotTaken = filteredEquipmentBookings.some((booking: any) => {
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
    });

    if (isTimeSlotTaken) {
      toast.error(
        "This time slot is already booked for the selected equipment."
      );
      return;
    }

    // Fetch bookings data from Firebase
    const existingBookingsRef = dbRef(db, "bookequipments");
    const pendingBookingsRef = dbRef(db, "pendingEquipmentBookings");
    const equipmentsRef = dbRef(db, "equipments");
    const pendingRoomBookingsRef = dbRef(db, "pendingRoomBookings");

    const [
      existingBookingsSnapshot,
      pendingBookingsSnapshot,
      equipmentsSnapshot,
      pendingRoomBookingsSnapshot,
    ] = await Promise.all([
      get(existingBookingsRef),
      get(pendingBookingsRef),
      get(equipmentsRef),
      get(pendingRoomBookingsRef),
    ]);

    const existingBookings: Record<string, Booking> =
      existingBookingsSnapshot.val() || {};
    const pendingBookings: Record<string, Booking> =
      pendingBookingsSnapshot.val() || {};
    const equipmentsData: Record<string, { description: string }> =
      equipmentsSnapshot.val() || {};
    const pendingRoomBookings: Record<string, Booking> =
      pendingRoomBookingsSnapshot.val() || {};

    // Combine bookings for overlap check
    const allBookings: Booking[] = [
      ...Object.values(existingBookings),
      ...Object.values(pendingBookings),
      ...Object.values(pendingRoomBookings),
    ];

    // Loop over selectedEquipments to check for overlapping bookings
    const hasOverlap = selectedEquipments.some((equipmentId) => {
      const equipmentName = equipmentsData[equipmentId]?.description;
      if (!equipmentName) return false;

      const equipmentOverlap = allBookings.some((booking) => {
        const bookingDateUTC8 = new Date(
          new Date(booking.date).getTime() -
            new Date(booking.date).getTimezoneOffset() * 60000 +
            8 * 3600000
        )
          .toISOString()
          .split("T")[0];

        const bookingStartTime = new Date(
          `${booking.date}T${booking.startTime}:00Z`
        );
        const bookingEndTime = new Date(
          `${booking.date}T${booking.endTime}:00Z`
        );
        const startUTC8 = new Date(bookingStartTime.getTime() + 8 * 3600000);
        const endUTC8 = new Date(bookingEndTime.getTime() + 8 * 3600000);

        return (
          bookingDateUTC8 === formattedDate &&
          startTimeDateUTC8 < endUTC8 &&
          endTimeDateUTC8 > startUTC8 &&
          (booking.equipments?.includes(equipmentId) ||
            booking.equipmentName === equipmentName) // Check by equipmentName here
        );
      });

      return equipmentOverlap;
    });

    if (hasOverlap) {
      toast.error(
        "One or more selected equipments are already booked during this time."
      );
      return;
    }

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
      course: Array.isArray(selectedCourse) ? selectedCourse : [selectedCourse],
      equipments: selectedEquipments,
      subject: subject,
    };

    // Save the booking to pendingEquipmentBookings
    const bookingRef = dbRef(db, `pendingEquipmentBookings/${equipmentId}`);

    try {
      await set(bookingRef, bookingData);
      toast.success("Waiting for the Admin confirmation!");
      setTimeout(() => {
        navigate("/UserDashboard");
      }, 2000);

      // Clear form fields
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

  // Calculate the minimum date for booking (3 days from today)
  const minBookingDate = new Date();
  minBookingDate.setDate(minBookingDate.getDate() + 3);

  const openEquipmentsModal = () => setShowEquipmentsSelection(true);

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
        <div className="flex flex-col items-center justify-center h-full">
          <div className="w-full max-w-4xl my-8">
            <form
              onSubmit={handleSubmit}
              className="bg-white shadow-lg rounded px-8 pt-6 pb-8 mt-6 mb-6 border border-gray-200"
            >
              <h2 className="text-center text-2xl font-bold mb-6 text-black">
                {equipmentTitle}
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
                      Equipment ID
                    </label>
                    <input
                      id="room-id"
                      type="text"
                      value={equipmentId}
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
            equipments={equipments.filter(
              (equipment) => equipment.description !== equipmentTitle
            )} // Filter out equipments with the same description as equipmentTitle
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

export default UserBookEquipments;
