import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { initializeApp } from "firebase/app";
import {
  getDatabase,
  ref as dbRef,
  onValue,
  update,
  remove,
  ref,
  get,
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
import reschedule from "../../assets/rescheduling.png";
import loginHistoryLogo from "../../assets/loginhistory.png";
import qrCode from "../../assets/qrcodelogo.png";
import coursesLogo from "../../assets/courses.png";
import searchLogo from "../../assets/searchlogo.png";
import borrowLogo from "../../assets/borrowicon.png";
import managedataLogo from "../../assets/managelogo.png";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import Lottie from "lottie-react";
import loadingAnimation from "../../assets/loadinganimation2.json"; // Path to your Lottie JSON file
import Modal from "./Modal";

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

// Define a TypeScript interface for the table
interface Table {
  availability: boolean; // Availability status
  description: string; // Description of the table
  imageUrl: string; // Image URL of the table
  room: string; // Room associated with the table
}

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
  const [showAddOptions, setShowAddOptions] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isModalOpen1, setIsModalOpen1] = useState(false);
  const [tableData, setTableData] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedRoomKey, setSelectedRoomKey] = useState<string>("");
  const [extraDescription, setExtraDescription] = useState<string | null>(null); // Store fetched extra description
  const [isShowingDescription, setIsShowingDescription] = useState(false); // Flag to track whether showing description modal is open
  const [newDescription, setNewDescription] = useState<string>("");
  const [dropdownOpen, setDropdownOpen] = useState(false);

  const showTable = () => {
    const db = getDatabase();
    const tablesRef = ref(db, "tables");
    get(tablesRef)
      .then((snapshot) => {
        if (snapshot.exists()) {
          const allTables = Object.entries(snapshot.val());
          // Filter for tables with room "Tutoring Room"
          const filteredTables = allTables.filter(
            ([_, table]) => (table as Table).room === "Tutoring Room"
          );
          setTableData(filteredTables); // Set filtered table data
        } else {
          setTableData([]); // No data available
        }
        setIsModalOpen1(true); // Open the modal after fetching the data
      })
      .catch((error) => {
        console.error("Error fetching table data:", error);
      });
  };

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

  const handleDeleteTable = (tableId: string) => {
    const db = getDatabase();
    const tableRef = ref(db, `tables/${tableId}`);
    remove(tableRef)
      .then(() => {
        setTableData((prev) => prev.filter(([id]) => id !== tableId)); // Update state to remove deleted table
      })
      .catch((error) => {
        console.error("Error deleting table:", error);
      });
  };

  const handleUpdateTable = (tableId: string, currentAvailability: boolean) => {
    const db = getDatabase();
    const tableRef = ref(db, `tables/${tableId}`);
    const newAvailability = !currentAvailability; // Toggle availability
    update(tableRef, { availability: newAvailability }) // Update table availability
      .then(() => {
        setTableData((prev) =>
          prev.map(([id, data]) =>
            id === tableId
              ? [id, { ...data, availability: newAvailability }]
              : [id, data]
          )
        ); // Update local state
      })
      .catch((error) => {
        console.error("Error updating table:", error);
      });
  };
  const handleAddTable = () => {
    navigate("/AddTable");
  };

  const filteredTables = tableData.filter(([_, table]) =>
    table.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Calculate number of selected rows
  const selectedCount = selectedRows.size;

  const addDescriptionToEquipment = async (
    key: string,
    extraDescription: string
  ) => {
    try {
      const roomRef = dbRef(getDatabase(), `rooms/${key}`);
      await update(roomRef, { extraDescription });
      toast.success("Description added successfully!");
    } catch (error) {
      console.error("Error adding description: ", error);
      toast.error("Failed to add description.");
    }
  };

  // Open modal and set the selected equipment key
  const openAddDescriptionModal = (roomKey: string) => {
    setSelectedRoomKey(roomKey);
    setIsModalOpen(true);
  };

  const handleAddDescriptionSubmit = () => {
    if (newDescription.trim()) {
      addDescriptionToEquipment(selectedRoomKey, newDescription);
      setNewDescription("");
      setIsModalOpen(false);
    } else {
      toast.error("Description cannot be empty.");
    }
  };

  const handleShowDescription = async (roomKey: string) => {
    try {
      const roomRef = dbRef(db, `rooms/${roomKey}/extraDescription`);
      const snapshot = await get(roomRef);
      const description = snapshot.val();
      setExtraDescription(description || "No extra description available");
      setIsShowingDescription(true); // Open modal for showing description
    } catch (error) {
      console.error("Error fetching extra description: ", error);
      toast.error("Failed to fetch extra description.");
    }
  };

  const handleDescriptionModalClose = () => {
    setIsShowingDescription(false); // Close the modal
    setExtraDescription(null); // Reset extra description
  };

  const handleCloseModal = () => {
    setNewDescription("");
    setIsModalOpen(false);
  };

  const handleClearDescription = async () => {
    if (selectedRows.size > 0) {
      try {
        for (const key of selectedRows) {
          const roomRef = dbRef(db, `rooms/${key}`);
          await update(roomRef, { extraDescription: null });
        }
        toast.success("Extra descriptions cleared successfully!");
        handleDescriptionModalClose();
      } catch (error) {
        console.error("Error clearing extra descriptions: ", error);
        toast.error("Failed to clear extra descriptions.");
      }
    } else {
      toast.error("No equipment selected to clear description.");
    }
  };

  const resetEquipmentUsedCount = async (roomKey: string) => {
    try {
      const roomRef = dbRef(db, `rooms/${roomKey}`);
      await update(roomRef, { roomUsed: 0 });
      toast.success("Room used count reset to 0!");
    } catch (error) {
      console.error("Error resetting equipment used count: ", error);
      toast.error("Failed to reset equipment used count.");
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

  const handleDropdownToggle = () => {
    setDropdownOpen(!dropdownOpen);
  };

  const handleSelection = (key: any, isAvailable: any) => {
    updateRoom(key, isAvailable);
    setDropdownOpen(false); // Close dropdown after clicking Yes or No
  };

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
            <li className="mb-4">
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
                    <li className="mb-4 bg-green-800 border-2 border-green-600 rounded-full p-1">
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

      <main className="flex-1 p-6 bg-white overflow-hidden max-h-screen">
        <div className="p-4">
          <div className="flex justify-between items-center mb-4">
            <h1 className="text-2xl font-bold text-black">Rooms</h1>
            <button onClick={handleAddRoom} className="btn text-white">
              + Add New Rooms
            </button>
          </div>

          <div className="overflow-x-auto scrollbar-hide text-black">
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
                    <td className="flex items-center">
                      {room.isAvailable ? "Yes" : "No"}
                      {/* Dropdown Menu for Update/Delete */}
                      <div
                        className={`dropdown dropdown-left dropdown-end ml-2 ${
                          dropdownOpen ? "open" : ""
                        }`}
                      >
                        <label
                          tabIndex={0}
                          className="btn btn-sm bg-gray-200 ml-2 p-1 text-black"
                          onClick={handleDropdownToggle}
                        >
                          {/* Downward Arrow Icon */}
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                            className="w-5 h-5"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M19 9l-7 7-7-7"
                            />
                          </svg>
                        </label>
                        {dropdownOpen && (
                          <ul
                            tabIndex={0}
                            className="dropdown-content menu p-2 shadow bg-gray-200 rounded-lg w-40 max-h-48 overflow-y-auto"
                          >
                            <li className="btn btn-sm text-white mb-2">
                              <button
                                onClick={() => handleSelection(room.key, false)}
                              >
                                Yes
                              </button>
                            </li>
                            <li className="btn btn-sm btn-error text-white">
                              <button
                                onClick={() => handleSelection(room.key, true)}
                              >
                                No
                              </button>
                            </li>
                          </ul>
                        )}
                      </div>
                    </td>
                    <td>
                      {/* Align buttons in two lines */}
                      <div className="flex flex-wrap gap-2 justify-start">
                        <button
                          className="btn btn-sm bg-error text-white"
                          onClick={() => resetEquipmentUsedCount(room.key)}
                        >
                          Reset Used Count
                        </button>
                        <button
                          className="btn btn-sm text-white"
                          onClick={() => openAddDescriptionModal(room.key)}
                        >
                          Add Description
                        </button>
                        <button
                          className="btn btn-sm text-white"
                          onClick={() => handleShowDescription(room.key)}
                        >
                          Show Description
                        </button>

                        {room.description === "Tutoring Room" && (
                          <>
                            <button
                              className="btn btn-sm text-white"
                              onClick={showTable}
                            >
                              Show Tables
                            </button>
                            <button
                              className="btn btn-sm text-white"
                              onClick={handleAddTable}
                            >
                              Add Tables
                            </button>
                          </>
                        )}
                      </div>
                      <button
                        className="btn btn-sm btn-error text-white mt-2"
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

      <Modal isOpen={isModalOpen1} onClose={() => setIsModalOpen1(false)}>
        <h2 className="text-lg font-bold text-black">
          Tables in Tutoring Room
        </h2>

        <div className="relative mb-4 mt-2">
          <img
            src={searchLogo}
            alt="Search"
            className="absolute left-3 top-1/2 transform -translate-y-1/2 h-6 w-6"
          />
          <input
            type="text"
            placeholder="Search..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-12 pr-3 py-2 rounded bg-white text-black font-bold placeholder-gray-500 border border-black focus:border-black focus:outline-none"
            style={{ boxSizing: "border-box" }}
          />
        </div>

        {filteredTables.length > 0 ? (
          <ul>
            {filteredTables.slice(0, 5).map(([tableId, table]) => (
              <li
                key={tableId}
                className="flex justify-between items-center text-black mt-4"
              >
                <span>
                  {table.description} -{" "}
                  {table.availability ? "Available" : "Unavailable"}
                </span>
                <div>
                  <button
                    onClick={() =>
                      handleUpdateTable(tableId, table.availability)
                    }
                    className="btn btn-sm text-white mr-2"
                  >
                    {table.availability ? "Update" : "Update"}
                  </button>
                  <button
                    onClick={() => handleDeleteTable(tableId)}
                    className="btn btn-sm btn-error text-white mr-2"
                  >
                    Delete
                  </button>
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <p>No tables available in the Tutoring Room.</p>
        )}
      </Modal>

      {/* Modal for adding description */}
      <Modal isOpen={isModalOpen} onClose={handleCloseModal}>
        <div className="p-6">
          <h2 className="text-xl font-bold mb-4 text-black">Add Description</h2>
          <input
            type="text"
            value={newDescription}
            onChange={(e) => setNewDescription(e.target.value)}
            placeholder="Enter description"
            className="input input-bordered w-full mb-4"
          />
          <div className="flex justify-end">
            <button
              className="btn text-white"
              onClick={handleAddDescriptionSubmit}
            >
              Add
            </button>
            <button
              className="btn btn-error text-white font-bold ml-2"
              onClick={handleCloseModal}
            >
              Cancel
            </button>
          </div>
        </div>
      </Modal>

      {/* Modal for showing extra description */}
      <Modal
        isOpen={isShowingDescription}
        onClose={handleDescriptionModalClose}
      >
        <div className="p-6">
          <h2 className="text-xl font-bold mb-4 text-black">
            Room Description
          </h2>
          <p className="text-black">{extraDescription}</p>
          <div className="flex justify-end">
            <button
              className="btn btn-error text-white font-bold mr-2"
              onClick={handleClearDescription} // Use updated handler
            >
              Clear
            </button>
            <button
              className="btn text-white "
              onClick={handleDescriptionModalClose}
            >
              Close
            </button>
          </div>
        </div>
      </Modal>

      <ToastContainer />
    </div>
  );
}

export default Rooms;
