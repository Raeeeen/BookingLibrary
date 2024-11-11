import { useState, useEffect } from "react";
import schoolLogo from "../../assets/scclogo.png";
import dashboardlogo from "../../assets/dashboardlogo.png";
import roomslogo from "../../assets/roomslogo.png";
import equipmentslogo from "../../assets/equipmentslogo.png";
import reschedule from "../../assets/rescheduling.png";
import reportslogo from "../../assets/reportslogo.png";
import qrCode from "../../assets/qrcodelogo.png";
import coursesLogo from "../../assets/courses.png";
import loginHistoryLogo from "../../assets/loginhistory.png";
import borrowLogo from "../../assets/borrowicon.png";
import managedataLogo from "../../assets/managelogo.png";
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
  DataSnapshot,
  set,
  Database,
} from "firebase/database";
import Lottie from "lottie-react";
import loadingAnimation from "../../assets/loadinganimation2.json";
import notficationBellNoNotif from "../../assets/notificationNoNotif.png";
import notificationBellWithNotif from "../../assets/notificationWithNotif.png";
import QRCode from "qrcode";
import { getStorage, ref as storageRef, uploadString } from "firebase/storage";
import Modal from "./DashboardModal";
import { PieChart, Pie, Tooltip, Legend, Cell } from "recharts";

interface User {
  name: string;
}

interface User {
  name: string;
  // Add any other properties you expect here
}

interface UsersMap {
  [userId: string]: User; // Index signature for dynamic user IDs
}

interface Booking {
  id: string;
  roomName: string;
  date: string;
  equipments?: string[];
  equipmentname: string;
  startTime: string;
  endTime: string;
  borrowedBy: string;
  studentsSelected?: string[];
  status?: string;
  location?: string;
  tables?: string[]; // New field for tables
  type?: "room" | "equipment"; // Make type optional
  nameDisplay?: string; // Make nameDisplay optional
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
  studentsSelected1?: string[];
  date: string;
  startTime: string;
  equipments?: string[];
  endTime: string;
  borrowedBy: string;
  borrowedByName?: string;
  equipmentDescriptions?: string;
}

interface EquipmentBooking2 {
  id: string;
  equipmentName: string;
  studentsSelected1?: string[];
  date: string;
  startTime: string;
  location: string;
  equipments?: string[];
  endTime: string;
  borrowedBy: string;
}

function Dashboard() {
  const [loading, setLoading] = useState(true);
  const [pendingBookings, setPendingBookings] = useState<any[]>([]);
  const [users, setUsers] = useState<any>({});
  const userProfilePicture = localStorage.getItem("userProfilePicture") || "";
  const [equipmentDescriptions, setEquipmentDescriptions] = useState<{
    [key: string]: string;
  }>({});
  const [equipmentBookings, setEquipmentBookings] = useState<
    EquipmentBooking[]
  >([]);
  const navigate = useNavigate();
  const [setSelectedBooking] = useState<any>(null); // State for selected booking
  const [modalOpen, setModalOpen] = useState(false);
  const [bookings, setBookings] = useState<Booking[]>([]); // New state for bookings
  const [searchTerm, setSearchTerm] = useState("");
  const [notificationCount, setNotificationCount] = useState(0);
  const [activeTab, setActiveTab] = useState<"rooms" | "equipments">("rooms");
  const [roomBookings, setRoomBookings] = useState<Booking[]>([]);
  const [equipmentBookings2, setEquipmentBookings2] = useState<
    EquipmentBooking2[]
  >([]);
  const [isDeleteModalOpen, setDeleteModalOpen] = useState(false); // Modal state
  const [selectedBookingId, setSelectedBookingId] = useState(null); // To store the ID of the booking to be deleted
  const [isEquipment, setIsEquipment] = useState<boolean>(false);
  const [equipmentName, setEquipmentName] = useState<string | null>(null); // State definition
  const [selectedBooking2, setSelectedBooking2] = useState<{
    id: string;
    isEquipment: boolean;
    equipmentName?: string;
  } | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [showAddOptions, setShowAddOptions] = useState(false);
  const [activeTab1, setActiveTab1] = useState<
    "pendingRooms" | "pendingEquipments"
  >("pendingRooms");
  const COLORS = [
    "#0C0C0C",
    "#481E14",
    "#9B3922",
    "#F2613F",
    "#222831",
    "#31363F",
    "#76ABAE",
    "#3E3232",
    "#503C3C",
    "#7E6363",
    "#A87C7C",
    "#191919",
    "#FF5733",
    "#750E21",
    "#E3651D",
    "#BED754",
    "#331D2C",
    "#3F2E3E",
    "#A78295",
    "#EFE1D1",
    "#5F264A",
    "#643A6B",
    "#957777",
    "#B0A4A4",
    "#0B2447",
    "#19376D",
    "#576CBC",
    "#635985",
    "#443C68",
    "#393053",
  ];
  let colorIndex = 0; // To keep track of the current color
  // State and useEffect for fetching and preparing chart data
  const [roomChartData, setRoomChartData] = useState<any[]>([]);
  const [equipmentChartData, setEquipmentChartData] = useState<any[]>([]);
  const [roomColors, setRoomColors] = useState<Map<string, string>>(new Map());
  const [equipmentColors, setEquipmentColors] = useState<Map<string, string>>(
    new Map()
  );

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
    const bookingsRef = ref(db, "bookrooms");

    const unsubscribe = onValue(bookingsRef, (snapshot) => {
      const data = snapshot.val();
      const bookingList = [];

      if (data) {
        for (const key in data) {
          bookingList.push({ id: key, ...data[key] });
        }
      }
      setBookings(bookingList); // Update local state with the latest bookings
    });

    // Clean up the listener on component unmount
    return () => unsubscribe();
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
    const loadData = async () => {
      // Fetching and setting users
      const usersRef = ref(db, "users");
      onValue(usersRef, (snapshot) => {
        const data = snapshot.val() as UsersData | null;
        setUsers(data || {});
      });

      // Fetching and setting room bookings
      const bookingsRef = ref(db, "pendingRoomBookings");
      onValue(bookingsRef, (snapshot) => {
        const data = snapshot.val() as BookingsData | null;
        if (data) {
          const bookingsList = Object.keys(data).map((key) => ({
            id: key,
            type: "room", // Add type 'room'
            roomId: key, // Ensure roomId is added here
            roomName: data[key].roomName,
            date: data[key].date,
            equipmentIds: data[key].equipments || [],
            startTime: data[key].startTime,
            endTime: data[key].endTime,
            borrowedBy: data[key].borrowedBy,
            studentsSelected: data[key].studentsSelected,
            tables: data[key].tables || [],
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
          }));

          setPendingBookings(bookingsWithDetails);
        } else {
          setPendingBookings([]);
        }
      });

      // Fetching and setting equipment bookings
      const equipmentBookingsRef = ref(db, "pendingEquipmentBookings");
      onValue(equipmentBookingsRef, (snapshot) => {
        const data = snapshot.val() as {
          [key: string]: EquipmentBooking;
        } | null;
        if (data) {
          const equipmentBookingsList = Object.keys(data).map((key) => ({
            id: key,
            type: "equipment", // Add type 'equipment'
            equipmentName: data[key].equipmentName,
            equipments: data[key].equipments || [], // Ensure it's an array
            studentsSelected1: data[key].studentsSelected1,
            date: data[key].date,
            startTime: data[key].startTime,
            endTime: data[key].endTime,
            borrowedBy: data[key].borrowedBy,
          }));

          const equipmentBookingsWithDetails = equipmentBookingsList.map(
            (equipmentBooking) => ({
              ...equipmentBooking,
              borrowedByName:
                users[equipmentBooking.borrowedBy]?.name || "Unknown",
              students: equipmentBooking.studentsSelected1
                ? equipmentBooking.studentsSelected1
                    .map(
                      (studentId: string) => users[studentId]?.name || "Unknown"
                    )
                    .join(", ")
                : "None",
              equipmentDescriptions:
                equipmentBooking.equipments
                  ?.map((id) => equipmentDescriptions[id] || "Unknown")
                  .join(", ") || "None", // Map equipment IDs to descriptions

              nameDisplay: equipmentBooking.equipmentName || "None",
            })
          );

          setEquipmentBookings(equipmentBookingsWithDetails);
        } else {
          setEquipmentBookings([]);
        }
      });

      setLoading(false);
    };

    loadData();
  }, [db, users, equipmentDescriptions]);

  const handleLogout = () => {
    signOut(auth)
      .then(() => {
        navigate("/SignIn");
      })
      .catch((error) => {
        console.error("Error logging out:", error.message);
      });
  };

  const generateRoomQRCodeData = (data: any, id: string) => {
    // Ensure selectedStudents is an array
    const students = Array.isArray(data.selectedStudents)
      ? data.selectedStudents
      : [];

    return `Room Name: ${data.roomName}, Room ID: ${id}, Students Selected: ${
      students.join(", ") || "N/A"
    }, Date: ${data.date}, Start Time: ${data.startTime}, End Time: ${
      data.endTime
    }, Borrowed By: ${data.borrowedBy?.join(", ") || "N/A"}, Purpose: ${
      data.purpose || "N/A"
    }, Department: ${data.department || "N/A"}, Course: ${
      data.course || "N/A"
    }, Subject: ${data.subject || "N/A"}`;
  };

  const generateEquipmentQRCodeData = (data: any, id: string) => {
    // Ensure selectedStudents is an array
    const students = Array.isArray(data.selectedStudents)
      ? data.selectedStudents
      : [];

    return `Equipment Name: ${
      data.equipmentName
    }, Equipment ID: ${id}, Students Selected: ${
      students.join(", ") || "N/A"
    }, Date: ${data.date}, Start Time: ${data.startTime}, End Time: ${
      data.endTime
    }, Borrowed By: ${data.borrowedBy?.join(", ") || "N/A"}, Purpose: ${
      data.purpose || "N/A"
    }, Department: ${data.department || "N/A"}, Course: ${
      data.course || "N/A"
    }, Subject: ${data.subject || "N/A"}`;
  };

  const uploadQRCodeToFirebase = async (
    qrCodeUrl: string,
    id: string,
    userId: string,
    title: string
  ) => {
    const storage = getStorage(app);
    const qrCodeRef = storageRef(
      storage,
      `QRCode/${userId}/${title}/${id}.png`
    );
    await uploadString(qrCodeRef, qrCodeUrl.split(",")[1], "base64", {
      contentType: "image/png",
    });
    console.log("QR code generated and uploaded to Firebase Storage.");
  };

  const handleConfirm = async (id: string, type: "room" | "equipment") => {
    try {
      let sourceRef: any;
      let destinationRef: any;

      // Determine source and destination references based on type
      if (type === "room") {
        sourceRef = ref(db, `pendingRoomBookings/${id}`);
        destinationRef = ref(db, `bookrooms/${id}`);
      } else if (type === "equipment") {
        sourceRef = ref(db, `pendingEquipmentBookings/${id}`);
        destinationRef = ref(db, `bookequipments/${id}`);
      } else {
        console.error("Unknown booking type:", type);
        return;
      }

      // Fetch data from source reference
      const snapshot = await get(sourceRef);
      if (snapshot.exists()) {
        const data = snapshot.val();

        // Move data to destination node
        await update(destinationRef, data);

        // Remove data from the source node
        await remove(sourceRef);

        console.log(
          "Booking confirmed and moved to",
          type === "room" ? "bookrooms" : "bookequipments"
        );

        // Refetch the updated bookings and notifications after confirmation
        await fetchBookings(); // Refetch all bookings

        // Now generate the QR code and upload it
        let qrCodeData: string;
        let title: string;

        if (type === "room") {
          qrCodeData = generateRoomQRCodeData(data, id);
          title = data.roomName;

          // Increment roomUsed count after confirming the room booking
          await incrementRoomUsed(data.roomName);
        } else {
          qrCodeData = generateEquipmentQRCodeData(data, id);
          title = data.equipmentName;

          // Increment equipmentUsed count after confirming the equipment booking
          await incrementEquipmentUsed(data.equipmentName);
        }

        const qrCodeUrl = await QRCode.toDataURL(qrCodeData);
        console.log(qrCodeData);

        const userId = Array.isArray(data.borrowedBy)
          ? data.borrowedBy[0]
          : "unknown_user";

        // Upload the QR code to Firebase Storage
        await uploadQRCodeToFirebase(qrCodeUrl, id, userId, title);
      } else {
        console.error("No data available for booking ID:", id);
      }
    } catch (error) {
      console.error("Error confirming booking:", error);
    }
  };

  // Function to get the Room key by matching description
  const getRoomKeyByDescription = async (
    db: Database,
    description: string
  ): Promise<string | null> => {
    return new Promise((resolve) => {
      const roomsRef = ref(db, "rooms");

      onValue(roomsRef, (snapshot) => {
        const data = snapshot.val();
        let foundKey: string | null = null;

        for (const key in data) {
          const room = data[key];
          if (room.description === description) {
            foundKey = key;
            break;
          }
        }

        resolve(foundKey); // Resolve with foundKey or null
      });
    });
  };

  // Function to increment roomUsed count
  const incrementRoomUsed = async (description: string) => {
    const db = getDatabase();

    // Get the room ID using the description
    const roomId = await getRoomKeyByDescription(db, description);

    if (roomId) {
      const roomRef = ref(db, `rooms/${roomId}`);

      try {
        const roomSnapshot = await get(roomRef);
        const roomData = roomSnapshot.val();

        if (roomData) {
          // Check if roomUsed already exists
          const currentCount = roomData.roomUsed || 0; // Default to 0 if undefined
          const newCount = currentCount + 1; // Increment the count

          // Update the room entry in the database
          await set(roomRef, {
            ...roomData,
            roomUsed: newCount,
          });
          console.log(
            `Room used count for ID "${roomId}" updated to ${newCount}.`
          );
        } else {
          console.error(`Room with ID "${roomId}" not found in the database.`);
        }
      } catch (error) {
        console.error("Error incrementing roomUsed count:", error);
      }
    } else {
      console.error(`Room with description "${description}" not found.`);
    }
  };

  // Function to get the equipment key by matching description
  const getEquipmentKeyByDescription = async (
    db: Database,
    description: string
  ): Promise<string | null> => {
    return new Promise((resolve) => {
      const equipmentsRef = ref(db, "equipments");

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

  // Function to increment equipmentUsed count
  const incrementEquipmentUsed = async (description: string) => {
    const db = getDatabase();

    // Get the equipment key using the description
    const equipmentId = await getEquipmentKeyByDescription(db, description);

    if (equipmentId) {
      const equipmentRef = ref(db, `equipments/${equipmentId}`);

      try {
        const equipmentSnapshot = await get(equipmentRef);
        const equipmentData = equipmentSnapshot.val();

        if (equipmentData) {
          // Check if equipmentUsed already exists
          const currentCount = equipmentData.equipmentUsed || 0; // Default to 0 if undefined
          const newCount = currentCount + 1; // Increment the count

          // Update the equipment entry in the database
          await set(equipmentRef, {
            ...equipmentData,
            equipmentUsed: newCount,
          });
          console.log(
            `Equipment used count for ID "${equipmentId}" updated to ${newCount}.`
          );
        } else {
          console.error(
            `Equipment with ID "${equipmentId}" not found in the database.`
          );
        }
      } catch (error) {
        console.error("Error incrementing equipmentUsed count:", error);
      }
    } else {
      console.error(`Equipment with description "${description}" not found.`);
    }
  };

  const handleDelete = async (
    id: string,
    isEquipment: boolean,
    equipmentName?: string | null
  ) => {
    const roomBookingRef = ref(db, `pendingRoomBookings/${id}`);
    const equipmentBookingRef = ref(db, `pendingEquipmentBookings/${id}`);

    try {
      // If it's an equipment booking, find the equipment ID by name
      if (isEquipment && equipmentName) {
        // Scan all equipments to find the ID by description
        const equipmentsRef = ref(db, `equipments`);
        const equipmentsSnapshot = await get(equipmentsRef);

        if (equipmentsSnapshot.exists()) {
          const equipments = equipmentsSnapshot.val();
          let equipmentId = null;

          // Loop through all equipments to find the one matching the equipmentName
          for (const id in equipments) {
            if (equipments[id].description === equipmentName) {
              equipmentId = id; // Store the ID if description matches
              break; // Exit the loop once found
            }
          }

          // If equipment ID is found, set its availability to true
          if (equipmentId) {
            const availabilityRef = ref(
              db,
              `equipments/${equipmentId}/availability`
            );
            await set(availabilityRef, true); // Update availability to true
            console.log(
              `Availability set to true for equipment ID: ${equipmentId}`
            );
          } else {
            console.log("Equipment not found by description:", equipmentName);
          }
        } else {
          console.log("No equipment data found.");
        }
      }

      // Execute both delete operations in parallel using Promise.all
      await Promise.all([remove(roomBookingRef), remove(equipmentBookingRef)]);

      console.log("Booking deleted from both room and equipment bookings");
    } catch (error) {
      console.error("Error deleting booking:", error);
    }
  };

  const convertTo12HourFormat = (time: string): string => {
    const [hour, minute] = time.split(":").map(Number);
    const formattedHour = hour % 12 || 12; // Convert hour to 12-hour format
    const ampm = hour >= 12 ? "PM" : "AM"; // Determine AM or PM
    return `${formattedHour}:${minute.toString().padStart(2, "0")} ${ampm}`; // Format with leading zero for minutes
  };

  const fetchBookings = async () => {
    const { roomBookings, equipmentBookings2 } = await scanAllBookRooms(); // Fetch both room and equipment bookings
    setBookings([...roomBookings, ...equipmentBookings2]); // Store only expired bookings
    setRoomBookings(roomBookings); // Set the room bookings
    setEquipmentBookings2(equipmentBookings2); // Set the equipment bookings
  };

  useEffect(() => {
    fetchBookings(); // Fetch bookings when the component mounts
  }, []);

  useEffect(() => {
    setNotificationCount(bookings.length); // Set count based on bookings
    setLoading(false);
  }, [bookings]);

  const scanAllBookRooms = async () => {
    const db = getDatabase();
    const bookRoomsRef = ref(db, "bookrooms");
    const usersRef = ref(db, "users");
    const equipmentRef = ref(db, "bookequipments");

    try {
      const [bookRoomsSnapshot, usersSnapshot, equipmentSnapshot] =
        await Promise.all([
          get(bookRoomsRef),
          get(usersRef),
          get(equipmentRef),
        ]);

      let usersMap: UsersMap = {};

      if (usersSnapshot.exists()) {
        usersMap = usersSnapshot.val();
      }

      const roomBookings: any[] = [];
      const equipmentBookings2: any[] = [];
      const currentTime = new Date(); // Get current time

      // Process bookRooms data
      if (bookRoomsSnapshot.exists()) {
        const bookRooms = bookRoomsSnapshot.val();
        for (const roomId in bookRooms) {
          const roomData = bookRooms[roomId];
          const borrowedByName = usersMap[roomData.borrowedBy]
            ? usersMap[roomData.borrowedBy].name
            : "Unknown";

          const endTime = new Date(`${roomData.date} ${roomData.endTime}`); // Combine date and endTime

          // Only push if current time is greater than endTime
          if (currentTime > endTime) {
            roomBookings.push({
              id: roomId,
              date: roomData.date,
              startTime: convertTo12HourFormat(roomData.startTime),
              endTime: convertTo12HourFormat(roomData.endTime),
              borrowedBy: borrowedByName,
              roomName: roomData.roomName,
              type: "Room",
            });
          }
        }
      }

      // Process bookEquipments data
      if (equipmentSnapshot.exists()) {
        const bookEquipments = equipmentSnapshot.val();
        for (const equipmentId in bookEquipments) {
          const equipmentData = bookEquipments[equipmentId];
          const borrowedByName = usersMap[equipmentData.borrowedBy]
            ? usersMap[equipmentData.borrowedBy].name
            : "Unknown";

          const endTime = new Date(
            `${equipmentData.date} ${equipmentData.endTime}`
          ); // Combine date and endTime

          // Only push if current time is greater than endTime
          if (currentTime > endTime) {
            equipmentBookings2.push({
              id: equipmentId,
              date: equipmentData.date,
              startTime: convertTo12HourFormat(equipmentData.startTime),
              endTime: convertTo12HourFormat(equipmentData.endTime),
              borrowedBy: borrowedByName,
              equipmentName: equipmentData.equipmentName,
              location: equipmentData.location,
              type: "Equipment",
            });
          }
        }
      }
      const expiredBookings = [...roomBookings, ...equipmentBookings2];
      setBookings(expiredBookings); // Store expired bookings in state
      return { roomBookings, equipmentBookings2 };
    } catch (error) {
      console.error("Error getting book rooms and equipment:", error);
      return { roomBookings: [], equipmentBookings2: [] }; // Return empty arrays in case of error
    }
  };

  const handleNotificationClick = async () => {
    console.log("Notification bell clicked"); // Debug
    setModalOpen(true); // Open modal
    await scanAllBookRooms(); // Scan all book rooms and log their details
  };

  useEffect(() => {
    setNotificationCount(bookings.length); // Set count based on expired bookings
    setLoading(false);
  }, [bookings]);

  const handleCloseModal = () => {
    setModalOpen(false); // Close the modal
    setSelectedBooking(null); // Reset selected booking
  };

  const handleRetrieve = async (
    bookingId: string,
    isEquipment: boolean,
    _equipmentName?: string
  ) => {
    const currentDate = new Date().toISOString().split("T")[0];

    const bookingRef = isEquipment
      ? ref(db, `bookequipments/${bookingId}`)
      : ref(db, `bookrooms/${bookingId}`);

    const reportRef = isEquipment
      ? ref(db, `reportsTable/equipments/${currentDate}/${bookingId}`)
      : ref(db, `reportsTable/rooms/${currentDate}/${bookingId}`);

    try {
      const bookingSnapshot = await get(bookingRef);
      if (bookingSnapshot.exists()) {
        const bookingData = bookingSnapshot.val();

        await set(reportRef, bookingData);

        const borrowedBy = bookingData.borrowedBy || "unknown_user";
        const transactionHistoryRef = isEquipment
          ? ref(db, `TransactionHistory/${borrowedBy}/equipments/${bookingId}`)
          : ref(db, `TransactionHistory/${borrowedBy}/rooms/${bookingId}`);

        await set(transactionHistoryRef, {
          ...bookingData,
          retrievedOn: currentDate,
        });

        // Handle individual equipment bookings with associated equipment IDs
        if (isEquipment && bookingData.equipments) {
          for (const equipmentId of bookingData.equipments) {
            const equipmentDetailsRef = ref(db, `equipments/${equipmentId}`);
            const equipmentSnapshot = await get(equipmentDetailsRef);

            if (equipmentSnapshot.exists()) {
              const availabilityRef = ref(
                db,
                `equipments/${equipmentId}/availability`
              );
              await set(availabilityRef, true);
            }
          }
        }

        await remove(bookingRef);

        fetchBookings();
      } else {
        console.log("Booking not found.");
      }
    } catch (error) {
      console.error("Error retrieving booking:", error);
    }
  };

  const confirmDelete = (
    bookingId: any,
    isEquipment: boolean,
    equipmentNameParam?: string
  ) => {
    setSelectedBookingId(bookingId); // Store the booking ID
    setIsEquipment(isEquipment); // Store whether it's an equipment booking
    setEquipmentName(equipmentNameParam || null); // Store equipment name or null
    setDeleteModalOpen(true); // Open the modal
  };

  const handleConfirmDelete = () => {
    if (selectedBookingId) {
      handleDelete(selectedBookingId, isEquipment, equipmentName || null); // Ensure only null or string is passed
    }
    setDeleteModalOpen(false); // Close the modal
    setSelectedBookingId(null); // Clear the booking ID
    setEquipmentName(null); // Clear equipment name
    setIsEquipment(false); // Reset equipment type
  };

  const handleConfirmModal = () => {
    if (selectedBooking2) {
      handleRetrieve(
        selectedBooking2.id,
        selectedBooking2.isEquipment,
        selectedBooking2.equipmentName
      );
    }
    setIsModalOpen(false);
  };

  const openModal = (
    bookingId: string,
    isEquipment: boolean,
    equipmentName?: string
  ) => {
    setSelectedBooking2({ id: bookingId, isEquipment, equipmentName });
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedBooking2(null);
  };

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const transactionHistoryRef = ref(db, `TransactionHistory`);
        const snapshot = await get(transactionHistoryRef);
        if (snapshot.exists()) {
          const allTransactionData = snapshot.val();

          // Prepare chart data for rooms and equipments
          const roomChartData = await prepareChartData(
            allTransactionData,
            "rooms"
          );
          const equipmentChartData = await prepareChartData(
            allTransactionData,
            "equipments"
          );

          // Generate colors based on the new data
          const roomColorsMap = generateCourseColors(roomChartData);
          const equipmentColorsMap = generateCourseColors(equipmentChartData);

          // Set the state with new data
          setRoomChartData(roomChartData);
          setEquipmentChartData(equipmentChartData);
          setRoomColors(roomColorsMap);
          setEquipmentColors(equipmentColorsMap);
        }
      } catch (error) {
        console.error("Error fetching transaction history:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const prepareChartData = async (
    allTransactionData: any,
    type: "rooms" | "equipments"
  ) => {
    const counts: { [key: string]: { [department: string]: number } } = {};

    // Count each booking by department for each room/equipment
    for (const userId in allTransactionData) {
      const userTransactions = allTransactionData[userId];
      const transactions = userTransactions[type];

      if (transactions && typeof transactions === "object") {
        Object.values(transactions).forEach((booking: any) => {
          const itemName =
            booking[type === "rooms" ? "roomName" : "equipmentName"] ||
            `Unknown ${type === "rooms" ? "Room" : "Equipment"}`;
          const department = booking.department || "Unknown Department";

          if (itemName) {
            if (!counts[itemName]) {
              counts[itemName] = {};
            }
            counts[itemName][department] =
              (counts[itemName][department] || 0) + 1;
          }
        });
      }
    }

    // Flatten counts into an array format for the chart
    const chartData = [];
    for (const [itemName, departments] of Object.entries(counts)) {
      for (const [department, count] of Object.entries(departments)) {
        chartData.push({
          name: `${itemName} - ${department}`,
          value: count,
        });
      }
    }

    return chartData;
  };

  // Generate unique color mapping for each department-course combination
  const generateCourseColors = (data: any) => {
    const colors = new Map<string, string>();

    data.forEach((entry: any) => {
      const { name } = entry; // Name format: "ItemName - Department - Course"
      if (!colors.has(name)) {
        // Assign a color from the array, looping back if necessary
        colors.set(name, COLORS[colorIndex % COLORS.length]);
        colorIndex++;
      }
    });

    console.log(colors);
    return colors;
  };

  const handleSearch = (bookings: any, term: any) => {
    return bookings.filter((booking: any) => {
      const bookingDetails = JSON.stringify(booking).toLowerCase();
      return bookingDetails.includes(term.toLowerCase());
    });
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
            <li className="mb-4 bg-green-800 border-2 border-green-600 rounded-full p-1">
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

      <main
        className="flex-1 p-6 bg-white overflow-auto max-h-screen"
        style={{ scrollbarWidth: "none", msOverflowStyle: "none" }} // For Firefox and IE/Edge
      >
        <header className="mb-6 flex flex-col md:flex-row justify-between items-center">
          <h1 className="text-2xl font-bold text-black">
            {" "}
            SCC LEARNING COMMON MANAGEMENT SYSTEM
          </h1>
          <div className="flex items-center space-x-4 mt-4 md:mt-0">
            <div className="relative">
              <img
                src={
                  notificationCount > 0
                    ? notificationBellWithNotif
                    : notficationBellNoNotif
                }
                alt="Notifications"
                className="h-10 w-10 cursor-pointer"
                onClick={handleNotificationClick}
              />
              {notificationCount > 0 && (
                <span className="absolute top-0 right-0 bg-red-500 text-white rounded-full text-xs px-2">
                  {notificationCount}
                </span>
              )}
            </div>

            <button
              onClick={handleLogout}
              className="btn text-white font-bold bg-red-700"
            >
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
          style={{
            maxHeight: "calc(100vh - 150px)",
            scrollbarWidth: "none", // For Firefox
            msOverflowStyle: "none", // For IE and Edge
          }}
        >
          <div className="flex justify-center mb-6">
            {/* Pie Chart for Rooms */}
            <div className="w-1/2 mr-4">
              <h2 className="text-xl font-bold text-black mb-4 text-center">
                Rooms Chart
              </h2>
              <div className="mx-auto">
                <PieChart width={600} height={400}>
                  <Pie
                    data={roomChartData}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    outerRadius={150}
                    label
                    isAnimationActive={false} // Disables animation for a more stable render
                  >
                    {roomChartData.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={roomColors.get(entry.name)} // Directly use the pre-defined color
                      />
                    ))}
                  </Pie>
                  <Tooltip cursor={{ fill: "transparent" }} />{" "}
                  {/* Avoids persistent hover */}
                  <Legend />
                </PieChart>
              </div>
            </div>

            {/* Pie Chart for Equipments */}
            <div className="w-1/2 ml-4">
              <h2 className="text-xl font-bold text-black mb-4 text-center">
                Equipments Chart
              </h2>
              <div className="mx-auto">
                <PieChart width={600} height={400}>
                  <Pie
                    data={equipmentChartData}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    outerRadius={150}
                    label
                  >
                    {equipmentChartData.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={equipmentColors.get(entry.name)} // Use predefined color directly
                      />
                    ))}
                  </Pie>
                  <Tooltip cursor={{ fill: "transparent" }} />{" "}
                  {/* Avoids persistent hover */}
                  <Legend />
                </PieChart>
              </div>
            </div>
          </div>

          {/* Tabs for switching between Pending Room and Equipment Bookings */}
          <div className="mb-4 text-black font-bold mt-6">
            <button
              className={`py-2 px-4 relative mr-2 ${
                activeTab1 === "pendingRooms" ? "bg-gray-200" : "bg-white"
              } rounded border`}
              onClick={() => setActiveTab1("pendingRooms")}
            >
              Pending Room Bookings
              {pendingBookings.length > 0 && (
                <span className="absolute top-0 right-0 bg-red-600 text-white text-xs font-bold rounded-full px-1">
                  {pendingBookings.length}
                </span>
              )}
            </button>
            <button
              className={`py-2 px-4 relative ${
                activeTab1 === "pendingEquipments" ? "bg-gray-200" : "bg-white"
              } rounded border`}
              onClick={() => setActiveTab1("pendingEquipments")}
            >
              Pending Equipment Borrowings
              {equipmentBookings.length > 0 && (
                <span className="absolute top-0 right-0 bg-red-600 text-white text-xs font-bold rounded-full px-1">
                  {equipmentBookings.length}
                </span>
              )}
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
                    {activeTab1 === "pendingRooms" ? "Students" : "Equipments"}
                  </th>
                  {activeTab1 === "pendingRooms" && (
                    <th className="py-2 px-4 border-b text-left">Tables</th>
                  )}
                  <th className="py-2 px-4 border-b text-center">Action</th>
                </tr>
              </thead>
              <tbody>
                {activeTab1 === "pendingRooms" ? (
                  pendingBookings.length > 0 ? (
                    pendingBookings.map((booking) => {
                      // Pending room bookings
                      const nameDisplay = booking.roomName || "None";
                      const studentsDisplay = booking.students || "None";
                      const tableDisplay =
                        (booking.roomName === "Tutoring Room" ||
                          booking.roomName === "Collaboratory Room") &&
                        booking.tables
                          ? Array.isArray(booking.tables)
                            ? booking.tables.join(", ")
                            : booking.tables
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
                            {booking.borrowedByName || "Unknown"}
                          </td>
                          <td className="py-2 px-4 border-b text-left">
                            {studentsDisplay}
                          </td>
                          <td className="py-2 px-4 border-b text-left">
                            {tableDisplay}
                          </td>
                          <td className="py-2 px-4 border-b text-center">
                            <div className="flex justify-center space-x-2">
                              <button
                                onClick={() =>
                                  handleConfirm(booking.id, "room")
                                }
                                className="btn bg-black text-white"
                              >
                                Confirm
                              </button>
                              <button
                                onClick={() => confirmDelete(booking.id, false)}
                                className="btn bg-red-600 text-white"
                              >
                                Delete
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td
                        colSpan={activeTab1 === "pendingRooms" ? 7 : 6}
                        className="py-2 px-4 border-b text-center"
                      >
                        No Available Records
                      </td>
                    </tr>
                  )
                ) : equipmentBookings.length > 0 ? (
                  equipmentBookings.map((EquipmentBooking) => {
                    // Pending equipment bookings
                    const nameDisplay =
                      EquipmentBooking.equipmentName || "None";
                    const equipmentDisplay =
                      EquipmentBooking.equipmentDescriptions || "None";

                    return (
                      <tr key={EquipmentBooking.id}>
                        <td className="py-2 px-4 border-b text-left">
                          {nameDisplay}
                        </td>
                        <td className="py-2 px-4 border-b text-left">
                          {EquipmentBooking.date}
                        </td>
                        <td className="py-2 px-4 border-b text-left">
                          {convertTo12HourFormat(EquipmentBooking.startTime)}
                        </td>
                        <td className="py-2 px-4 border-b text-left">
                          {convertTo12HourFormat(EquipmentBooking.endTime)}
                        </td>
                        <td className="py-2 px-4 border-b text-left">
                          {EquipmentBooking.borrowedByName || "Unknown"}
                        </td>
                        <td className="py-2 px-4 border-b text-left">
                          {equipmentDisplay}
                        </td>
                        <td className="py-2 px-4 border-b text-center">
                          <div className="flex justify-center space-x-2">
                            <button
                              onClick={() =>
                                handleConfirm(EquipmentBooking.id, "equipment")
                              }
                              className="btn bg-black text-white"
                            >
                              Confirm
                            </button>
                            <button
                              onClick={() =>
                                confirmDelete(
                                  EquipmentBooking.id,
                                  true,
                                  EquipmentBooking.equipmentName
                                )
                              }
                              className="btn bg-red-600 text-white"
                            >
                              Delete
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan={6} className="py-2 px-4 border-b text-center">
                      No Available Records
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>
      </main>
      {/* Modal to display bookings */}
      {modalOpen && (
        <Modal isOpen={modalOpen} onClose={handleCloseModal}>
          <h2 className="text-lg font-bold text-black">Notifications</h2>

          {/* Tabs for "Rooms" and "Equipments" */}
          <div className="flex justify-start mb-4 mt-2">
            <button
              onClick={() => setActiveTab("rooms")}
              className={`p-2 ${
                activeTab === "rooms" ? "bg-gray-300" : "bg-white"
              } text-black font-bold rounded-tl-lg rounded-bl-lg`}
            >
              Rooms
            </button>
            <button
              onClick={() => setActiveTab("equipments")}
              className={`p-2 ${
                activeTab === "equipments" ? "bg-gray-300" : "bg-white"
              } text-black font-bold rounded-tr-lg rounded-br-lg`}
            >
              Equipments
            </button>
          </div>

          {/* Search bar */}
          <div className="relative mb-4 mt-2">
            <input
              type="text"
              placeholder="Search..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
              }}
              className="w-full pl-3 pr-3 py-2 rounded bg-white text-black font-bold placeholder-gray-500 border border-black focus:border-black focus:outline-none"
              style={{ boxSizing: "border-box" }}
            />
          </div>

          {/* Scrollable list of bookings */}
          <div className="max-h-60 overflow-y-auto">
            <ul>
              {/* Conditional rendering based on active tab */}
              {activeTab === "rooms"
                ? handleSearch(roomBookings, searchTerm).map((booking: any) => (
                    <li
                      key={booking.id}
                      className="mb-2 border-b pb-2 text-black"
                    >
                      <p>
                        <strong>Room Name:</strong> {booking.roomName}
                      </p>
                      <p>
                        <strong>Date:</strong> {booking.date}
                      </p>
                      <p>
                        <strong>Start Time:</strong> {booking.startTime}
                      </p>
                      <p>
                        <strong>End Time:</strong> {booking.endTime}
                      </p>
                      <p>
                        <strong>Borrowed By:</strong>{" "}
                        {booking.borrowedBy || "Unknown"}
                      </p>
                      <div className="flex space-x-2 mt-2">
                        <button
                          onClick={() => openModal(booking.id, false)} // For room booking
                          className="btn btn-sm btn-success text-white mr-2"
                        >
                          Checkout
                        </button>
                      </div>
                    </li>
                  ))
                : handleSearch(equipmentBookings2, searchTerm).map(
                    (booking: any) => (
                      <li
                        key={booking.id}
                        className="mb-2 border-b pb-2 text-black"
                      >
                        <p>
                          <strong>Equipment Name:</strong>{" "}
                          {booking.equipmentName}
                        </p>
                        <p>
                          <strong>Date:</strong> {booking.date}
                        </p>
                        <p>
                          <strong>Start Time:</strong> {booking.startTime}
                        </p>
                        <p>
                          <strong>End Time:</strong> {booking.endTime}
                        </p>
                        <p>
                          <strong>Location:</strong>{" "}
                          {booking.location || "Unknown"}
                        </p>
                        <p>
                          <strong>Borrowed By:</strong>{" "}
                          {booking.borrowedBy || "Unknown"}
                        </p>
                        <div className="flex space-x-2 mt-2">
                          <button
                            onClick={() =>
                              openModal(booking.id, true, booking.equipmentName)
                            } // For equipment booking
                            className="btn btn-sm btn-success text-white mr-2"
                          >
                            Checkout
                          </button>
                        </div>
                      </li>
                    )
                  )}
            </ul>
          </div>

          {/* Close button */}
          <button
            onClick={handleCloseModal}
            className="mt-4 bg-black text-white rounded px-4 py-2"
          >
            Close
          </button>
        </Modal>
      )}

      {/* Delete Confirmation Modal */}
      {isDeleteModalOpen && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50 text-black">
          <div className="bg-white p-6 rounded-lg shadow-lg max-w-sm">
            <h2 className="text-lg font-bold mb-4">
              Are you sure you want to delete this booking?
            </h2>
            <div className="flex justify-end">
              <button
                onClick={handleConfirmDelete} // Confirm and delete the booking
                className="py-1 px-3 bg-black text-white rounded hover:bg-red-600 font-bold"
              >
                Delete
              </button>
              <button
                onClick={() => setDeleteModalOpen(false)} // Close the modal
                className="ml-4 py-1 px-3 bg-gray-300 rounded hover:bg-gray-400 font-bold"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {isModalOpen && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50 text-black">
          <div className="bg-white p-6 rounded-lg shadow-lg max-w-sm">
            <h2 className="text-lg font-bold mb-4">Do you want to Checkout?</h2>
            <div className="flex justify-end space-x-4">
              <button
                onClick={handleConfirmModal}
                className="py-1 px-3 bg-black text-white rounded hover:bg-green-600 font-bold"
              >
                Yes
              </button>
              <button
                onClick={closeModal}
                className="py-1 px-3 bg-gray-300 rounded hover:bg-gray-400 font-bold"
              >
                No
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Dashboard;
