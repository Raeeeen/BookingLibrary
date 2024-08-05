import { useState, useEffect } from "react";
import schoolLogo from "../../assets/scclogo.png";
import dashboardlogo from "../../assets/dashboardlogo.png";
import roomslogo from "../../assets/roomslogo.png";
import equipmentslogo from "../../assets/equipmentslogo.png";
import reschedule from "../../assets/rescheduling.png";
import reportslogo from "../../assets/reportslogo.png";
import { useNavigate } from "react-router-dom";
import { initializeApp } from "firebase/app";
import { getAuth, signOut } from "firebase/auth";
import {
  getDatabase,
  ref,
  onValue,
  remove,
  update,
  get,
} from "firebase/database";
import Lottie from "lottie-react";
import loadingAnimation from "../../assets/loadinganimation2.json";

interface User {
  name: string;
}

interface Booking {
  id: string;
  roomName: string;
  date: string;
  startTime: string;
  endTime: string;
  borrowedBy: string;
  studentsSelected?: string[];
  status?: string;
}

interface UsersData {
  [key: string]: User;
}

interface BookingsData {
  [key: string]: Booking;
}

function Dashboard() {
  const [loading, setLoading] = useState(true);
  const [pendingBookings, setPendingBookings] = useState<any[]>([]);
  const [users, setUsers] = useState<any>({});
  const userProfilePicture = localStorage.getItem("userProfilePicture") || "";
  const navigate = useNavigate();

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
  const auth = getAuth(app);
  const db = getDatabase(app);

  useEffect(() => {
    const loadData = async () => {
      const usersRef = ref(db, "users");
      const bookingsRef = ref(db, "pendingbookings");

      onValue(usersRef, (snapshot) => {
        const data = snapshot.val() as UsersData | null;
        setUsers(data || {});
      });

      onValue(bookingsRef, (snapshot) => {
        const data = snapshot.val() as BookingsData | null;
        if (data) {
          const bookingsList = Object.keys(data).map((key) => ({
            id: key,
            roomName: data[key].roomName,
            date: data[key].date,
            startTime: data[key].startTime,
            endTime: data[key].endTime,
            borrowedBy: data[key].borrowedBy,
            studentsSelected: data[key].studentsSelected,
            status: data[key].status,
          }));

          const bookingsWithDetails = bookingsList.map((booking) => ({
            ...booking,
            borrowedByName: users[booking.borrowedBy]?.name || "Unknown",
            students: booking.studentsSelected
              ? booking.studentsSelected
                  .map(
                    (studentId: string) => users[studentId]?.name || "Unknown"
                  )
                  .join(", ")
              : "None",
          }));

          setPendingBookings(bookingsWithDetails);
        } else {
          setPendingBookings([]);
        }
      });

      setLoading(false);
    };

    loadData();
  }, [db, users]);

  const handleRoomsClick = () => {
    navigate("/AvailableRoom");
  };

  const handleLogout = () => {
    signOut(auth)
      .then(() => {
        console.log("User logged out");
        navigate("/SignIn");
      })
      .catch((error) => {
        console.error("Error logging out:", error.message);
      });
  };

  const handleConfirm = async (id: string) => {
    const bookingRef = ref(db, `pendingbookings/${id}`);

    try {
      // Fetch the booking details
      const snapshot = await get(bookingRef);
      const bookingData = snapshot.val();

      if (bookingData) {
        // Add booking to `bookrooms`
        const bookroomsRef = ref(db, `bookrooms/${id}`);
        await update(bookroomsRef, bookingData);

        // Remove booking from `pendingbookings`
        await remove(bookingRef);
        console.log("Booking confirmed and moved to bookrooms");
      }
    } catch (error) {
      console.error("Error confirming booking:", error);
    }
  };

  const handleDelete = async (id: string) => {
    const bookingRef = ref(db, `pendingbookings/${id}`);
    try {
      await remove(bookingRef);
      console.log("Booking deleted");
    } catch (error) {
      console.error("Error deleting booking:", error);
    }
  };

  const convertTo12HourFormat = (time: string) => {
    const [hours, minutes] = time.split(":").map(Number);
    const ampm = hours >= 12 ? "PM" : "AM";
    const adjustedHours = hours % 12 || 12;
    return `${adjustedHours}:${minutes < 10 ? `0${minutes}` : minutes} ${ampm}`;
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="flex flex-col items-center">
          <Lottie
            animationData={loadingAnimation}
            loop={true}
            autoplay={true}
            style={{ height: 100, width: 100 }}
          />
          <p className="mt-4 text-gray-700">Loading, Please Wait...</p>
        </div>
      </div>
    );
  }

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
            <li className="mb-4 bg-gray-200 border-2 border-gray-200 rounded-full p-1">
              <a
                href="/Dashboard"
                className="flex items-center p-2 hover:bg-gray-300 rounded-md"
              >
                <img src={dashboardlogo} alt="Dashboard" className="h-6 w-6" />
                <span className="ml-2 text-black font-bold">Dashboard</span>
              </a>
            </li>
            <li className="mb-4">
              <a
                href="/Rooms"
                className="flex items-center p-2 hover:bg-gray-300 rounded-md"
              >
                <img src={roomslogo} alt="Rooms" className="h-6 w-6" />
                <span className="ml-2 text-black font-bold">Rooms</span>
              </a>
            </li>
            <li className="mb-4">
              <a
                href="#"
                className="flex items-center p-2 hover:bg-gray-300 rounded-md"
              >
                <img
                  src={equipmentslogo}
                  alt="Equipments"
                  className="h-6 w-6"
                />
                <span className="ml-2 text-black font-bold">Equipments</span>
              </a>
            </li>
            <li className="mb-4">
              <a
                href="/reports"
                className="flex items-center p-2 hover:bg-gray-300 rounded-md"
              >
                <img src={reportslogo} alt="Reports" className="h-6 w-6" />
                <span className="ml-2 text-black font-bold">Reports</span>
              </a>
            </li>
            <li className="mb-4">
              <a
                href="#"
                className="flex items-center p-2 hover:bg-gray-300 rounded-md"
              >
                <img src={reschedule} alt="Reports" className="h-6 w-6" />
                <span className="ml-2 text-black font-bold">Reschedule</span>
              </a>
            </li>
          </ul>
        </nav>
      </aside>
      <main className="flex-1 p-6 bg-white">
        <header className="mb-6 flex flex-col md:flex-row justify-between items-center">
          <h1 className="text-2xl font-bold text-black">Hi, Welcome back 👋</h1>
          <div className="flex items-center space-x-4 mt-4 md:mt-0">
            <button onClick={handleLogout} className="btn text-white font-bold">
              LOGOUT
            </button>
            <button className="btn btn-ghost btn-circle avatar">
              <img
                src={userProfilePicture}
                alt="Profile"
                className="rounded-full h-12 w-12 md:h-16 md:w-16"
              />
            </button>
          </div>
        </header>
        <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
          <div className="card bg-white shadow-md p-4">
            <h2 className="text-sm text-black mb-2">Book</h2>
            <p className="mb-4 text-black text-2xl font-bold">Rooms</p>
            <button
              onClick={handleRoomsClick}
              className="btn text-white font-bold mt-2 w-1/2"
            >
              Proceed
            </button>
          </div>
          <div className="card bg-white shadow-md p-4">
            <h2 className="text-sm text-black mb-2">Borrow</h2>
            <p className="mb-4 text-black text-2xl font-bold">Equipments</p>
            <button className="btn text-white font-bold mt-2 w-1/2">
              Proceed
            </button>
          </div>
        </section>
        <section>
          <h2 className="text-2xl font-bold mb-4 text-black">
            Pending Bookings
          </h2>
          <div className="overflow-x-auto">
            <table className="min-w-full bg-white border border-gray-200 text-black">
              <thead>
                <tr>
                  <th className="py-2 px-4 border-b text-left">Room Name</th>
                  <th className="py-2 px-4 border-b text-left">Date</th>
                  <th className="py-2 px-4 border-b text-left">Start Time</th>
                  <th className="py-2 px-4 border-b text-left">End Time</th>
                  <th className="py-2 px-4 border-b text-left">Borrowed By</th>
                  <th className="py-2 px-4 border-b text-left">Students</th>
                  <th className="py-2 px-4 border-b text-center">Action</th>
                </tr>
              </thead>
              <tbody>
                {pendingBookings.map((booking) => (
                  <tr key={booking.id}>
                    <td className="py-2 px-4 border-b text-left">
                      {booking.roomName}
                    </td>
                    <td className="py-2 px-4 border-b text-left">
                      {booking.date}
                    </td>
                    <td className="py-2 px-4 border-b text-left">
                      {convertTo12HourFormat(booking.startTime)}
                    </td>
                    <td className="py-2 px-4 border-b text-left">
                      {convertTo12HourFormat(booking.endTime)}
                    </td>
                    <td className="py-2 px-4 border-b text-left">
                      {booking.borrowedByName}
                    </td>
                    <td className="py-2 px-4 border-b text-left">
                      {booking.students}
                    </td>
                    <td className="py-2 px-4 border-b text-center">
                      <div className="flex justify-center space-x-2">
                        <button
                          onClick={() => handleConfirm(booking.id)}
                          className="btn bg-black text-white"
                        >
                          Confirm
                        </button>
                        <button
                          onClick={() => handleDelete(booking.id)}
                          className="btn bg-red-600 text-white"
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </main>
    </div>
  );
}

export default Dashboard;
