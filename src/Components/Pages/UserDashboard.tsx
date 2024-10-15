import schoolLogo from "../../assets/scclogo.png";
import dashboardlogo from "../../assets/dashboardlogo.png";
import historyLogo from "../../assets/reportslogo.png";
import borrowLogo from "../../assets/borrowicon.png";
import faqLogo from "../../assets/faqlogo.png";
import guidelinesLogo from "../../assets/guidelineslogo.png";
import { getAuth, signOut } from "firebase/auth";
import { getDatabase, ref, onValue, DataSnapshot } from "firebase/database";
import { useNavigate } from "react-router-dom";
import { initializeApp } from "firebase/app";
import { useEffect, useState } from "react";
import Lottie from "lottie-react";
import loadingAnimation from "../../assets/loadinganimation2.json";
import {
  getDownloadURL,
  getStorage,
  ref as storageRef,
} from "firebase/storage";

interface User {
  name: string;
}

interface Booking {
  id: string;
  roomName: string;
  date: string;
  equipments?: string[];
  startTime: string;
  endTime: string;
  borrowedBy: string[] | (string & any[]);
  studentsSelected?: string[];
  status?: string;
  tables?: string[]; // New field for tables
}

interface UsersData {
  [key: string]: User;
}

interface BookingsData {
  [key: string]: Booking;
}

interface EquipmentBooking {
  id: string;
  equipmentName: string;
  equipments?: string[];
  studentsSelected1?: string[];
  date: string;
  startTime: string;
  endTime: string;
  borrowedBy: string[] | (string & any[]);
}

function UserDashboard() {
  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState<any>({});
  const [roomBookings, setRoomBookings] = useState<any[]>([]);
  const [equipmentBookings, setEquipmentBookings] = useState<
    EquipmentBooking[]
  >([]);
  const [equipmentDescriptions, setEquipmentDescriptions] = useState<{
    [key: string]: string;
  }>({});
  const userProfilePicture = localStorage.getItem("userProfilePicture") || "";
  const navigate = useNavigate();
  const [qrCodeUrls, setQrCodeUrls] = useState<{ [key: string]: string }>({});
  const [activeTab, setActiveTab] = useState<"rooms" | "equipments">("rooms");

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
  const storage = getStorage(app);

  // Get current user ID from authentication
  const currentUserId = auth.currentUser?.uid || "";

  useEffect(() => {
    const fetchUsers = () => {
      const usersRef = ref(db, "users");
      onValue(usersRef, (snapshot) => {
        const data = snapshot.val() as UsersData | null;
        setUsers(data || {});
      });
    };

    fetchUsers();
  }, [db]);

  useEffect(() => {
    const fetchEquipmentDescriptions = () => {
      const equipmentsRef = ref(db, "equipments");
      onValue(equipmentsRef, (snapshot: DataSnapshot) => {
        const data = snapshot.val();
        const descriptions: { [key: string]: string } = {};
        for (const key in data) {
          descriptions[key] = data[key].description || "No Description";
        }
        setEquipmentDescriptions(descriptions);
      });
    };

    fetchEquipmentDescriptions();
  }, [db]);

  useEffect(() => {
    const fetchQRCodeUrls = async () => {
      const qrUrls: { [key: string]: string } = {};

      // Fetch QR codes for room bookings
      const roomBookingsRef = ref(db, "bookrooms");
      onValue(roomBookingsRef, async (snapshot) => {
        const data = snapshot.val() as BookingsData | null;
        if (data) {
          for (const key of Object.keys(data)) {
            const room = data[key];
            const borrowedByArray = room.borrowedBy || [];
            const roomName = room.roomName || "Unknown Room";
            for (const userId of borrowedByArray) {
              const qrCodeRef = storageRef(
                storage,
                `QRCode/${userId}/${roomName}/${key}.png`
              );
              try {
                const url = await getDownloadURL(qrCodeRef);
                qrUrls[key] = url;
              } catch (error) {
                console.error(
                  `Error fetching QR code URL for room ${key}:`,
                  error
                );
              }
            }
          }
          setQrCodeUrls((prev) => ({ ...prev, ...qrUrls }));
        }
      });

      // Fetch QR codes for equipment bookings
      const equipmentBookingsRef = ref(db, "bookequipments");
      onValue(equipmentBookingsRef, async (snapshot) => {
        const data = snapshot.val() as {
          [key: string]: EquipmentBooking;
        } | null;
        if (data) {
          for (const key of Object.keys(data)) {
            const equipmentBooking = data[key];
            const borrowedByArray = equipmentBooking.borrowedBy || [];
            const equipmentName =
              equipmentBooking.equipmentName || "Unknown Equipment";
            for (const userId of borrowedByArray) {
              const qrCodeRef = storageRef(
                storage,
                `QRCode/${userId}/${equipmentName}/${key}.png`
              );
              try {
                const url = await getDownloadURL(qrCodeRef);
                qrUrls[key] = url;
              } catch (error) {
                console.error(
                  `Error fetching QR code URL for equipment ${key}:`,
                  error
                );
              }
            }
          }
          setQrCodeUrls((prev) => ({ ...prev, ...qrUrls }));
        }
      });
    };

    setLoading(false);
    fetchQRCodeUrls();
  }, [db, storage]);

  useEffect(() => {
    const fetchBookings = async () => {
      try {
        // Fetch room bookings
        const bookingsRef = ref(db, "bookrooms");
        onValue(bookingsRef, (snapshot) => {
          const data = snapshot.val() as BookingsData | null;
          if (data) {
            const bookingsList = Object.keys(data).map((key) => ({
              id: key,
              type: "room",
              roomName: data[key].roomName,
              date: data[key].date,
              equipmentIds: data[key].equipments || [],
              startTime: data[key].startTime,
              endTime: data[key].endTime,
              borrowedBy: Array.isArray(data[key].borrowedBy)
                ? data[key].borrowedBy
                : [data[key].borrowedBy],
              studentsSelected: data[key].studentsSelected,
              tables: data[key].tables || [],
              status: data[key].status,
            }));

            const bookingsWithDetails = bookingsList
              .filter((booking) => booking.borrowedBy.includes(currentUserId))
              .map((booking) => ({
                ...booking,
                borrowedByName: booking.borrowedBy
                  .map((userId: string) => users[userId]?.name || "Unknown")
                  .join(", "),
                students: booking.studentsSelected
                  ? booking.studentsSelected
                      .map(
                        (studentId: string) =>
                          users[studentId]?.name || "Unknown"
                      )
                      .join(", ")
                  : "None",
                equipmentDescriptions:
                  booking.roomName === "IMC/AVR"
                    ? booking.equipmentIds
                        .map((id) => equipmentDescriptions[id] || "Unknown")
                        .join(", ")
                    : "None",
                nameDisplay:
                  booking.roomName === "IMC/AVR"
                    ? booking.equipmentIds.length > 0
                      ? booking.equipmentIds
                          .map((id) => equipmentDescriptions[id] || "Unknown")
                          .join(", ")
                      : "None"
                    : booking.roomName || "None",
                qrCodeURL: qrCodeUrls[booking.id] || "",
              }));

            setRoomBookings(bookingsWithDetails);
          } else {
            setRoomBookings([]);
          }
        });

        // Fetch equipment bookings
        const equipmentBookingsRef = ref(db, "bookequipments");
        onValue(equipmentBookingsRef, (snapshot) => {
          const data = snapshot.val() as {
            [key: string]: EquipmentBooking;
          } | null;
          if (data) {
            const equipmentBookingsList = Object.keys(data).map((key) => ({
              id: key,
              type: "equipment",
              equipmentName: data[key].equipmentName,
              equipments: data[key].equipments || [],
              studentsSelected1: data[key].studentsSelected1,
              date: data[key].date,
              startTime: data[key].startTime,
              endTime: data[key].endTime,
              borrowedBy: Array.isArray(data[key].borrowedBy)
                ? data[key].borrowedBy
                : [data[key].borrowedBy],
            }));

            const equipmentBookingsWithDetails = equipmentBookingsList
              .filter((equipmentBooking) =>
                equipmentBooking.borrowedBy.includes(currentUserId)
              )
              .map((equipmentBooking) => ({
                ...equipmentBooking,
                borrowedByName: equipmentBooking.borrowedBy
                  .map((userId: string) => users[userId]?.name || "Unknown")
                  .join(", "),
                students: equipmentBooking.studentsSelected1
                  ? equipmentBooking.studentsSelected1
                      .map(
                        (studentId: string) =>
                          users[studentId]?.name || "Unknown"
                      )
                      .join(", ")
                  : "None",
                equipmentDescriptions:
                  equipmentBooking.equipments
                    ?.map((id) => equipmentDescriptions[id] || "Unknown")
                    .join(", ") || "None",
                nameDisplay: equipmentBooking.equipmentName || "None",
                qrCodeURL: qrCodeUrls[equipmentBooking.id] || "",
              }));
            setEquipmentBookings(equipmentBookingsWithDetails);
          } else {
            setEquipmentBookings([]);
          }
        });
      } catch (error) {
        console.error("Error loading data:", error);
      }
    };
    setLoading(false);
    fetchBookings();
  }, [db, users, equipmentDescriptions, currentUserId, qrCodeUrls]);

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

  const convertTo12HourFormat = (time: string | undefined): string => {
    if (!time) return "Invalid Time";
    const [hours, minutes] = time.split(":").map(Number);
    if (isNaN(hours) || isNaN(minutes)) return "Invalid Time";
    const ampm = hours >= 12 ? "PM" : "AM";
    const adjustedHours = hours % 12 || 12;
    return `${adjustedHours}:${minutes < 10 ? `0${minutes}` : minutes} ${ampm}`;
  };

  const downloadQRCode = (url: string, filename: string) => {
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
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

  const filteredBookings =
    activeTab === "rooms" ? roomBookings : equipmentBookings;

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
            <li className="mb-4 bg-green-800 border-2 border-green-600 rounded-full p-1">
              <a
                href="/UserDashboard"
                className="flex items-center p-2 hover:bg-green-600 rounded-md"
              >
                <img src={dashboardlogo} alt="Dashboard" className="h-6 w-6" />
                <span className="ml-2 text-white font-bold">Dashboard</span>
              </a>
            </li>
            <li className="mb-4">
              <a
                href="/UserBookBorrow"
                className="flex items-center p-2 hover:bg-green-600 rounded-md"
              >
                <img src={borrowLogo} alt="Book/Borrow" className="h-6 w-6" />
                <span className="ml-2 text-white font-bold">Book/Borrow</span>
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

      <main className="flex-1 p-6 bg-white overflow-hidden">
        <header className="mb-6 flex flex-col md:flex-row justify-between items-center">
          <h1 className="text-2xl font-bold text-black">
            SCC Learning Common Management System
          </h1>
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
        <section
          className="overflow-y-auto"
          style={{ maxHeight: "calc(100vh - 150px)" }}
        >
          <h2 className="text-2xl font-bold mb-4 text-black">My Bookings</h2>

          {/* Tabs for switching between Room Bookings and Equipment Bookings */}
          <div className="mb-4 text-black font-bold mt-6">
            <button
              className={`py-2 px-4 mr-2 ${
                activeTab === "rooms" ? "bg-gray-200" : "bg-white"
              } rounded border`}
              onClick={() => setActiveTab("rooms")}
            >
              Room Bookings
            </button>
            <button
              className={`py-2 px-4 ${
                activeTab === "equipments" ? "bg-gray-200" : "bg-white"
              } rounded border`}
              onClick={() => setActiveTab("equipments")}
            >
              Equipment Borrowings
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full bg-white border border-gray-200 text-black">
              <thead>
                <tr>
                  <th className="py-2 px-4 border-b text-left">Name</th>
                  <th className="py-2 px-4 border-b text-left">Date</th>
                  <th className="py-2 px-4 border-b text-left">Start Time</th>
                  <th className="py-2 px-4 border-b text-left">End Time</th>
                  <th className="py-2 px-4 border-b text-left">Borrowed By</th>
                  <th className="py-2 px-4 border-b text-left">
                    {activeTab === "rooms" ? "Students" : "Equipments"}
                  </th>
                  {activeTab === "rooms" && (
                    <th className="py-2 px-4 border-b text-left">Tables</th>
                  )}
                  <th className="py-2 px-4 border-b text-left">Download QR</th>
                </tr>
              </thead>
              <tbody>
                {filteredBookings.map((booking) => {
                  // Determine the display name based on booking type
                  const nameDisplay =
                    booking.roomName || booking.equipmentName || "None";

                  // Display equipment descriptions if roomName is "IMC/AVR"; otherwise, show students
                  const equipmentDisplay =
                    booking.roomName === "IMC/AVR"
                      ? booking.equipmentDescriptions || "None"
                      : booking.roomName
                      ? booking.students || "None"
                      : booking.equipmentDescriptions || "None";

                  // Handle table display for specific rooms
                  const tableDisplay =
                    (booking.roomName === "Tutoring Room" ||
                      booking.roomName === "Collaboratory Room") &&
                    booking.tables
                      ? Array.isArray(booking.tables)
                        ? booking.tables.join(", ")
                        : booking.tables // if it's a string, just use it directly
                      : "None";

                  return (
                    <tr key={booking.id}>
                      <td className="py-2 px-4 border-b text-left">
                        {nameDisplay}
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
                        {equipmentDisplay}
                      </td>
                      {activeTab === "rooms" && (
                        <td className="py-2 px-4 border-b text-left">
                          {tableDisplay}
                        </td>
                      )}
                      <td className="py-2 px-4 border-b text-left">
                        {qrCodeUrls[booking.id] ? (
                          <button
                            onClick={() =>
                              downloadQRCode(
                                qrCodeUrls[booking.id],
                                `Booking_${booking.id}.png`
                              )
                            }
                            className="bg-black text-white px-4 py-2 rounded hover:bg-gray-700 transition duration-200"
                          >
                            Download QR
                          </button>
                        ) : (
                          <span className="text-gray-500">No QR Code</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </section>
      </main>
    </div>
  );
}

export default UserDashboard;
