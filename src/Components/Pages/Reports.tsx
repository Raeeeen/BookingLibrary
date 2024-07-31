import React, { useEffect, useState } from "react";
import { ref as dbRef, getDatabase, onValue, remove } from "firebase/database";
import schoolLogo from "../../assets/scclogo.png";
import dashboardlogo from "../../assets/dashboardlogo.png";
import roomslogo from "../../assets/roomslogo.png";
import equipmentslogo from "../../assets/equipmentslogo.png";
import reportslogo from "../../assets/reportslogo.png";
import { initializeApp } from "firebase/app";
import Lottie from "lottie-react";
import loadingAnimation from "../../assets/loadinganimation2.json"; // Path to your Lottie JSON file

interface User {
  id: string;
  name: string;
  email: string;
  photoURL?: string; // Optional photoURL field
}

interface Booking {
  id: string;
  roomName: string;
  studentsSelected: string[];
  date: string;
  startTime: string;
  endTime: string;
  borrowedBy: string; // Added field for the user who borrowed
}

const Reports: React.FC = () => {
  const [recentBookings, setRecentBookings] = useState<Booking[]>([]);
  const [users, setUsers] = useState<{ [key: string]: User }>({});
  const [loading, setLoading] = useState(true);
  const [expiredBookings, setExpiredBookings] = useState<{
    [key: string]: Booking;
  }>({});

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
  const app = initializeApp(firebaseConfig);
  const database = getDatabase(app);

  useEffect(() => {
    // Fetch users
    const usersRef = dbRef(database, "users");
    onValue(usersRef, (snapshot) => {
      const data = snapshot.val();
      const usersList: { [key: string]: User } = {};

      for (const key in data) {
        const userData = data[key];
        usersList[key] = {
          id: key,
          name: userData.name,
          email: userData.email,
          photoURL: userData.photoURL, // Retrieve photoURL
        };
      }

      setUsers(usersList);
    });

    // Fetch recent bookings
    const bookingsRef = dbRef(database, "bookrooms");
    onValue(bookingsRef, (snapshot) => {
      const data = snapshot.val();
      const bookingsList: Booking[] = [];

      for (const bookingId in data) {
        const booking = data[bookingId];
        bookingsList.push({
          id: bookingId, // Store the booking ID
          roomName: booking.roomName,
          studentsSelected: booking.studentsSelected || [],
          date: booking.date,
          startTime: booking.startTime || "N/A", // Default to "N/A" if not available
          endTime: booking.endTime || "N/A", // Default to "N/A" if not available
          borrowedBy: booking.borrowedBy || "", // Default to an empty string if not available
        });
      }

      bookingsList.sort(
        (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
      ); // Sort by most recent date
      setRecentBookings(bookingsList);
      setLoading(false);
    });

    const checkExpiredBookings = () => {
      const now = new Date(); // Fetch current time inside the function
      console.log("Current PC Time:", now.toString()); // Debugging log

      recentBookings.forEach((booking) => {
        // Construct end time as a Date object
        const endTime = new Date(`${booking.date}T${booking.endTime}:00`);
        console.log("Booking End Time:", endTime.toString()); // Debugging log

        // Compare end time with current PC time
        if (now > endTime) {
          console.log(`Booking ${booking.roomName} has expired.`); // Debugging log
          setExpiredBookings((prev) => ({
            ...prev,
            [booking.id]: booking,
          }));

          // Show confirmation dialog with detailed information
          const userConfirmed = window.confirm(
            `The booking for ${booking.roomName} has expired.\n` +
              `Date: ${booking.date}\n` +
              `Start Time: ${formatTime(booking.startTime)}\n` +
              `End Time: ${formatTime(booking.endTime)}\n` +
              `Borrowed By: ${
                users[booking.borrowedBy]?.name || "Unknown"
              }\n\n` +
              `Do you want to delete it?`
          );

          if (userConfirmed) {
            // Delete booking from the database
            remove(dbRef(database, `bookrooms/${booking.id}`))
              .then(() => {
                console.log(`Booking ${booking.id} has been deleted.`);
                // Optionally, you can update the UI to reflect the deletion
                setRecentBookings((prevBookings) =>
                  prevBookings.filter((b) => b.id !== booking.id)
                );
              })
              .catch((error) => {
                console.error("Error deleting booking:", error);
              });
          }
        }
      });
    };

    // Check for expired bookings every minute
    const intervalId = setInterval(checkExpiredBookings, 60000);

    // Initial check for expired bookings
    checkExpiredBookings();

    return () => clearInterval(intervalId); // Cleanup interval on component unmount
  }, [database, recentBookings]);

  const handleDeleteExpired = async (id: string) => {
    const bookingRef = dbRef(database, `bookrooms/${id}`);
    try {
      await remove(bookingRef);
      setExpiredBookings((prev) => {
        const { [id]: _, ...remaining } = prev;
        return remaining;
      });
      console.log("Expired booking deleted");
    } catch (error) {
      console.error("Error deleting expired booking:", error);
    }
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

  const formatTime = (time: string): string => {
    const [hour, minute] = time.split(":").map(Number);
    const period = hour >= 12 ? "PM" : "AM";
    const adjustedHour = hour % 12 || 12; // Convert 0 to 12 for midnight
    const formattedMinute = minute.toString().padStart(2, "0");

    return `${adjustedHour}:${formattedMinute} ${period}`;
  };

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
            <li className="mb-4 bg-gray-200 border-2 border-gray-200 rounded-full p-1">
              <a
                href="/Reports"
                className="flex items-center p-2 hover:bg-gray-300 rounded-md"
              >
                <img src={reportslogo} alt="Reports" className="h-6 w-6" />
                <span className="ml-2 text-black font-bold">Reports</span>
              </a>
            </li>
          </ul>
        </nav>
      </aside>
      <main className="flex-1 p-6 bg-white">
        <div className="p-4">
          <div className="flex justify-between mb-4">
            <div className="tabs">
              <a className="tab tab-bordered tab-active text-black font-bold text-xl">
                Rooms
              </a>
              <a className="tab tab-bordered text-xl font-bold text-black">
                Equipments
              </a>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div className="col-span-2">
              <div className="card shadow-lg p-4">
                <h2 className="card-title text-black font-bold">Overview</h2>
                {/* Placeholder for the bar chart */}
                <div className="h-64 bg-gray-100 flex items-center justify-center mt-7">
                  <span>Bar Chart</span>
                </div>
              </div>
            </div>
            <div className="p-4">
              <div className="card shadow-lg p-4">
                <h2 className="card-title text-black font-bold text-xl mb-4">
                  Bookings
                </h2>
                <ul className="space-y-4">
                  {/* Added space-y-4 for vertical spacing */}
                  {recentBookings.map((booking) => (
                    <li
                      key={booking.id}
                      className="flex flex-col border-b pb-4"
                    >
                      <div className="flex items-center space-x-4 mb-2">
                        {/* Display the profile picture of the user who borrowed */}
                        {users[booking.borrowedBy] ? (
                          <div className="flex items-center space-x-4">
                            {users[booking.borrowedBy].photoURL ? (
                              <img
                                src={users[booking.borrowedBy].photoURL}
                                alt={`${
                                  users[booking.borrowedBy].name
                                }'s profile`}
                                className="h-12 w-12 rounded-full border-2 border-gray-300"
                              />
                            ) : (
                              <div className="h-12 w-12 rounded-full bg-gray-200 flex items-center justify-center text-gray-500">
                                {users[booking.borrowedBy].name.charAt(0)}
                              </div>
                            )}
                            <div className="flex flex-col">
                              <p className="text-xl text-black font-extrabold">
                                {users[booking.borrowedBy].name}
                              </p>
                              <p className="text-sm text-black">
                                {users[booking.borrowedBy].email}
                              </p>
                            </div>
                          </div>
                        ) : (
                          <p>No user information available</p>
                        )}
                      </div>
                      <div className="flex flex-col ml-4">
                        <p className="text-xl text-black font-extrabold">
                          {booking.roomName}
                        </p>
                        <p className="text-xs text-gray-600">
                          {`${booking.date} ${formatTime(
                            booking.startTime
                          )} - ${formatTime(booking.endTime)}`}
                        </p>
                        <p className="text-xs text-gray-600">
                          Students: {booking.studentsSelected.join(", ")}
                        </p>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
          {Object.keys(expiredBookings).length > 0 && (
            <div className="fixed bottom-4 right-4 bg-red-100 border border-red-300 p-4 rounded-lg shadow-lg">
              <h3 className="text-red-800 font-bold mb-2">Expired Bookings</h3>
              <ul className="space-y-2">
                {Object.values(expiredBookings).map((booking) => (
                  <li
                    key={booking.id}
                    className="flex justify-between items-center"
                  >
                    <span>{`${booking.roomName} - ${formatTime(
                      booking.endTime
                    )}`}</span>
                    <button
                      className="bg-red-500 text-white py-1 px-3 rounded"
                      onClick={() => handleDeleteExpired(booking.id)}
                    >
                      OK
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default Reports;
