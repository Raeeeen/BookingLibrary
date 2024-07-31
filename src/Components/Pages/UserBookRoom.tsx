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
import { FirebaseApp, initializeApp } from "firebase/app";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import UserSelection from "./UserSelection";
import { getAuth } from "firebase/auth";

const generateRandomRoomId = () => {
  return Math.floor(Math.random() * 10000) + 1; // Random number between 1 and 10000
};

const UserBookRoom: React.FC = () => {
  const location = useLocation();
  const roomTitle = location.state?.roomTitle || "Unknown Room";
  const [date, setDate] = useState<Date | null>(null);

  const [students, setStudents] = useState<string[]>([]);
  const [studentName, setStudentName] = useState<string>("");
  const [roomId] = useState(generateRandomRoomId());
  const [bookedSlots, setBookedSlots] = useState<{ start: Date; end: Date }[]>(
    []
  );
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [showUserSelection, setShowUserSelection] = useState(false);
  const [users, setUsers] = useState<{ id: string; name: string }[]>([]);
  const [purpose, setPurpose] = useState<string>("");
  const [department, setDepartment] = useState<string>("");
  const [course, setCourse] = useState<string>("");
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
  const handleDateChange = (date: any) => setDate(date);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
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

  const handleStudentNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setStudentName(e.target.value);
  };

  const handleAddStudent = () => {
    if (studentName.trim() !== "") {
      setStudents((prevStudents) => [...prevStudents, studentName.trim()]);
      setStudentName("");
    }
  };

  const handleRemoveStudent = (index: number) => {
    setStudents((prevStudents) => prevStudents.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!date) {
      toast.error("Please select a date.");
      return;
    }

    if (selectedUsers.length === 0) {
      toast.error("Please select at least one user.");
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
    const isOverlapping = bookedSlots.some((slot) => {
      const slotStart = new Date(
        new Date(slot.start).getTime() -
          new Date(slot.start).getTimezoneOffset() * 60000 +
          8 * 3600000
      ); // Ensure slot.start is adjusted to UTC+8
      const slotEnd = new Date(
        new Date(slot.end).getTime() -
          new Date(slot.end).getTimezoneOffset() * 60000 +
          8 * 3600000
      ); // Ensure slot.end is adjusted to UTC+8

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

    // Check if the time slot already exists in the database
    const existingBookingsRef = dbRef(db, "bookrooms");
    const existingBookingsSnapshot = await get(existingBookingsRef);
    const existingBookings = existingBookingsSnapshot.val();

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

    // Format the date as YYYY-MM-DD
    const formattedDate = startTimeDateUTC8.toISOString().split("T")[0];

    // Booking details
    const bookingData = {
      roomName: roomTitle,
      roomId: roomId,
      studentsSelected: students,
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
      course: course,
      subject: subject,
    };

    // Reference to the pendingbookings node
    const bookingRef = dbRef(db, `pendingbookings/${roomId}`); // Change this to 'pendingbookings'

    try {
      // Save booking data to Firebase
      await set(bookingRef, bookingData);

      toast.success("Waiting for the Admin confirmation!");
      setTimeout(() => {
        navigate("/UserBook");
      }, 2000);

      // Clear form fields after successful submission
      setDate(null);
      setStudents([]);
      setStudentName("");
      setSelectedUsers([]);
      setPurpose("");
      setDepartment("");
      setCourse("");
      setSubject("");
      setStartTime({ hours: "0", minutes: "00", amPm: "AM" });
      setEndTime({ hours: "0", minutes: "00", amPm: "AM" });
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

  const handleSelectUsers = (selected: string[]) => {
    setSelectedUsers(selected);
    setShowUserSelection(false); // Close the user selection modal
  };

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
            <li className="mb-4 bg-gray-200 border-2 border-gray-200 rounded-full p-1">
              <a
                href="/UserBook"
                className="flex items-center p-2 hover:bg-gray-200 rounded-md"
              >
                <img src={dashboardlogo} alt="Dashboard" className="h-6 w-6" />
                <span className="ml-2 text-black font-bold">BOOK ROOM</span>
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
                {roomTitle}
              </h2>
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
                <input
                  type="text"
                  id="department"
                  value={department}
                  onChange={(e) => setDepartment(e.target.value)}
                  className="shadow appearance-none border bg-white rounded w-full py-2 px-3 text-black leading-tight focus:outline-none focus:shadow-outline"
                />
              </div>
              <div>
                <label
                  htmlFor="course"
                  className="block text-black text-sm font-bold mb-2 mt-2"
                >
                  Course:
                </label>
                <input
                  type="text"
                  id="course"
                  value={course}
                  onChange={(e) => setCourse(e.target.value)}
                  className="shadow appearance-none border bg-white rounded w-full py-2 px-3 text-black leading-tight focus:outline-none focus:shadow-outline"
                />
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
              <div className="mb-4">
                <label
                  className="block text-black text-sm font-bold mb-2 mt-2"
                  htmlFor="students"
                >
                  Borrowed By:
                </label>
                <button
                  type="button"
                  onClick={() => setShowUserSelection(true)}
                  className="p-2 bg-black text-white rounded"
                >
                  Select Users
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
                  className="block text-black text-sm font-bold mb-2"
                  htmlFor="students"
                >
                  Add Students
                </label>
                <div className="flex items-center">
                  <input
                    type="text"
                    value={studentName}
                    onChange={handleStudentNameChange}
                    className="shadow appearance-none border bg-white rounded w-full py-2 px-3 text-black leading-tight focus:outline-none focus:shadow-outline"
                  />
                  <button
                    type="button"
                    onClick={handleAddStudent}
                    className="ml-2 bg-black hover:bg-blue-400 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
                  >
                    Add
                  </button>
                </div>

                <ul className="mt-2">
                  {students.map((student, index) => (
                    <li
                      key={index}
                      className="flex justify-between items-center text-black"
                    >
                      {student}
                      <button
                        type="button"
                        onClick={() => handleRemoveStudent(index)}
                        className="ml-2 bg-red-500 hover:bg-red-700 text-white font-bold py-1 px-2 rounded focus:outline-none focus:shadow-outline mt-2"
                      >
                        Remove
                      </button>
                    </li>
                  ))}
                </ul>
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
      {showUserSelection && (
        <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
          <UserSelection
            users={[users.find((user) => user.id === currentUserId)!]} // Pass only the current user
            selectedUsers={selectedUsers}
            onSelect={handleSelectUsers}
            onCancel={() => setShowUserSelection(false)}
          />
        </div>
      )}
      <ToastContainer />
    </div>
  );
};

export default UserBookRoom;
