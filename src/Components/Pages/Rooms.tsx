import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { initializeApp } from "firebase/app";
import {
  getDatabase,
  ref as dbRef,
  onValue,
  update,
  remove,
} from "firebase/database";
import {
  deleteObject,
  getStorage,
  listAll,
  ref as storageRef,
} from "firebase/storage";
import schoolLogo from "../../assets/scclogo.png";
import dashboardlogo from "../../assets/dashboardlogo.png";
import roomslogo from "../../assets/roomslogo.png";
import equipmentslogo from "../../assets/equipmentslogo.png";
import reportslogo from "../../assets/reportslogo.png";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import Lottie from "lottie-react";
import loadingAnimation from "../../assets/loadinganimation2.json"; // Path to your Lottie JSON file

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
const db = getDatabase(app);

function Rooms() {
  const navigate = useNavigate();
  const [rooms, setRooms] = useState<
    {
      id: number;
      description: string;
      isAvailable: boolean;
      key: string;
      imageUrl?: string; // Optional, to handle image deletion
    }[]
  >([]);
  const [selectedRows, setSelectedRows] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState<boolean>(true); // Loading state

  useEffect(() => {
    const roomsRef = dbRef(db, "rooms");

    const handleData = (snapshot: any) => {
      const data = snapshot.val();
      if (data) {
        const roomList = Object.keys(data).map((key, index) => ({
          id: index + 1,
          description: data[key].description,
          isAvailable: data[key].availability ?? true,
          key,
          imageUrl: data[key].imageUrl,
        }));
        setRooms(roomList);
      } else {
        setRooms([]);
      }
      setLoading(false); // Set loading to false after data is fetched
    };

    // Set up the listener
    const unsubscribe = onValue(roomsRef, handleData);

    // Cleanup listener on unmount
    return () => unsubscribe();
  }, []);

  const handleAddRoom = () => {
    navigate("/AddRoom");
  };

  const updateRoom = async (roomKey: string, currentStatus: boolean) => {
    try {
      const roomRef = dbRef(db, `rooms/${roomKey}`);
      const newStatus = !currentStatus; // Toggle the current status
      await update(roomRef, { availability: newStatus });

      // Update local state
      setRooms((prevRooms) =>
        prevRooms.map((room) =>
          room.key === roomKey ? { ...room, isAvailable: newStatus } : room
        )
      );
    } catch (error) {
      console.error("Error updating room: ", error);
    }
  };

  // Function to delete all files under a specific description path
  const deleteFilesInPath = async (description: string) => {
    try {
      const storage = getStorage();
      const folderRef = storageRef(storage, `rooms/${description}`);

      // List all files in the folder
      const listResult = await listAll(folderRef);

      // Delete each file
      for (const item of listResult.items) {
        await deleteObject(item);
        console.log(`Deleted file: ${item.fullPath}`);
      }

      // If there are subdirectories, recursively delete them
      for (const prefix of listResult.prefixes) {
        await deleteFilesInPath(prefix.fullPath);
      }

      console.log("All files deleted successfully");
    } catch (error) {
      console.error("Error deleting files: ", error);
    }
  };

  // Function to delete room data from Realtime Database
  const deleteRoomData = async (roomKey: string) => {
    try {
      const roomRef = dbRef(db, `rooms/${roomKey}`);

      // Remove the room data
      await remove(roomRef);

      console.log("Room data deleted successfully");
    } catch (error) {
      console.error("Error deleting room data: ", error);
    }
  };

  // Function to delete a specific file based on its URL
  const deleteFileByUrl = async (url: string) => {
    try {
      const storage = getStorage();
      const filePath = url
        .split(
          "https://firebasestorage.googleapis.com/v0/b/library-7feb9.appspot.com/o/"
        )[1]
        .split("?")[0]
        .replace(/%2F/g, "/");
      const fileRef = storageRef(storage, filePath);

      // Delete the specific file
      await deleteObject(fileRef);
      console.log(`Deleted file: ${filePath}`);
    } catch (error) {
      console.error("Error deleting file: ", error);
    }
  };

  // Function to delete a room and its associated files
  const deleteRoomAndFiles = async (room: {
    description: string;
    imageUrl?: string;
    key: string; // Add the key here
  }) => {
    try {
      // Delete the image file if imageUrl is present
      if (room.imageUrl) {
        await deleteFileByUrl(room.imageUrl);
      }

      // Delete all files under the description path
      await deleteFilesInPath(room.description);

      // Delete the room data from the database using the room key
      await deleteRoomData(room.key);

      toast.success("Room deleted successfully!");
      console.log("Room and all associated files deleted successfully");
    } catch (error) {
      console.error("Error deleting room and files: ", error);
    }
  };

  // Function to handle select all checkbox
  const handleSelectAll = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.checked) {
      const allKeys = new Set(rooms.map((room) => room.key));
      setSelectedRows(allKeys);
    } else {
      setSelectedRows(new Set());
    }
  };

  // Function to handle row checkbox change
  const handleRowCheckboxChange = (roomKey: string, isChecked: boolean) => {
    setSelectedRows((prevSelectedRows) => {
      const updatedSelectedRows = new Set(prevSelectedRows);
      if (isChecked) {
        updatedSelectedRows.add(roomKey);
      } else {
        updatedSelectedRows.delete(roomKey);
      }
      return updatedSelectedRows;
    });
  };

  // Calculate number of selected rows
  const selectedCount = selectedRows.size;

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
            <li className="mb-4">
              <a
                href="/Dashboard"
                className="flex items-center p-2 hover:bg-gray-200 rounded-md"
              >
                <img src={dashboardlogo} alt="Dashboard" className="h-6 w-6" />
                <span className="ml-2 text-black font-bold">Dashboard</span>
              </a>
            </li>
            <li className="mb-4 bg-gray-200 border-2 border-gray-200 rounded-full p-1">
              <a
                href="/Rooms"
                className="flex items-center p-2 hover:bg-gray-200 rounded-md"
              >
                <img src={roomslogo} alt="Rooms" className="h-6 w-6" />
                <span className="ml-2 text-black font-bold">Rooms</span>
              </a>
            </li>
            <li className="mb-4">
              <a
                href="#"
                className="flex items-center p-2 hover:bg-gray-200 rounded-md"
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
                href="/Reports"
                className="flex items-center p-2 hover:bg-gray-200 rounded-md"
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
          <div className="flex justify-between items-center mb-4">
            <h1 className="text-2xl font-bold text-black">Rooms</h1>
            <button onClick={handleAddRoom} className="btn text-white">
              + Add New
            </button>
          </div>
          <div className="overflow-x-auto text-black">
            <table className="table w-full text-black">
              <thead>
                <tr>
                  <th>
                    <input
                      type="checkbox"
                      className="checkbox border-black"
                      onChange={handleSelectAll}
                      checked={selectedRows.size === rooms.length}
                    />
                  </th>
                  <th className="text-black">ID</th>
                  <th className="text-black">Description</th>
                  <th className="text-black">Is Available</th>
                  <th className="text-black">Actions</th>
                </tr>
              </thead>
              <tbody>
                {rooms.map((room) => (
                  <tr key={room.key}>
                    <th>
                      <input
                        type="checkbox"
                        className="checkbox border-black"
                        checked={selectedRows.has(room.key)}
                        onChange={(e) =>
                          handleRowCheckboxChange(room.key, e.target.checked)
                        }
                      />
                    </th>
                    <td>{room.id}</td>
                    <td>{room.description}</td>
                    <td>{room.isAvailable ? "Yes" : "No"}</td>
                    <td>
                      <button
                        className="btn btn-sm text-white mr-2"
                        onClick={() => updateRoom(room.key, room.isAvailable)}
                      >
                        Update
                      </button>
                      <button
                        className="btn btn-sm btn-error text-white"
                        onClick={() => deleteRoomAndFiles(room)}
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="flex justify-between mt-4">
            <span>
              {selectedCount} of {rooms.length} row(s) selected.
            </span>
            <div>
              <button className="btn btn-sm mr-2 text-white">Previous</button>
              <button className="btn btn-sm text-white">Next</button>
            </div>
          </div>
        </div>
      </main>
      <ToastContainer />
    </div>
  );
}

export default Rooms;
