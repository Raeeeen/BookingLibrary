import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { initializeApp } from "firebase/app";
import {
  getDatabase,
  ref as dbRef,
  onValue,
  update,
  remove,
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
import qrCode from "../../assets/qrcodelogo.png";
import reschedule from "../../assets/rescheduling.png";
import loginHistoryLogo from "../../assets/loginhistory.png";
import borrowLogo from "../../assets/borrowicon.png";
import managedataLogo from "../../assets/managelogo.png";
import { ToastContainer, toast } from "react-toastify";
import coursesLogo from "../../assets/courses.png";
import "react-toastify/dist/ReactToastify.css";
import Lottie from "lottie-react";
import loadingAnimation from "../../assets/loadinganimation2.json"; // Path to your Lottie JSON file
import Modal from "./DashboardModal";

// Firebase configuration
const firebaseConfig = {
 
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getDatabase(app);

function Equipments() {
  const navigate = useNavigate();
  const [equipments, setEquipments] = useState<
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
  const [newDescription, setNewDescription] = useState<string>("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedEquipmentKey, setSelectedEquipmentKey] = useState<string>("");
  const [extraDescription, setExtraDescription] = useState<string | null>(null); // Store fetched extra description
  const [isShowingDescription, setIsShowingDescription] = useState(false); // Flag to track whether showing description modal is open
  const [isModalOpen2, setIsModalOpen2] = useState(false);
  const [sN, setSN] = useState<string | null>(null); // Store fetched extra description
  const [isShowingSN, setIsShowingSN] = useState(false); // Flag to track whether showing description modal is open
  const [newSN, setNewSN] = useState<string>("");
  const [dropdownOpen, setDropdownOpen] = useState(false);

  useEffect(() => {
    const equipmentsRef = dbRef(db, "equipments");

    const handleData = (snapshot: any) => {
      const data = snapshot.val();
      if (data) {
        const equipmentsList = Object.keys(data).map((key, index) => ({
          id: index + 1,
          description: data[key].description,
          isAvailable: data[key].availability ?? true,
          key,
          imageUrl: data[key].imageUrl,
        }));
        setEquipments(equipmentsList);
      } else {
        setEquipments([]);
      }
      setLoading(false); // Set loading to false after data is fetched
    };

    // Set up the listener
    const unsubscribe = onValue(equipmentsRef, handleData);

    // Cleanup listener on unmount
    return () => unsubscribe();
  }, []);

  const updateEquipments = async (
    equipmentKey: string,
    currentStatus: boolean
  ) => {
    try {
      const roomRef = dbRef(db, `equipments/${equipmentKey}`);
      const newStatus = !currentStatus; // Toggle the current status
      await update(roomRef, { availability: newStatus });

      // Update local state
      setEquipments((prevEquipments) =>
        prevEquipments.map((equipments) =>
          equipments.key === equipmentKey
            ? { ...equipments, isAvailable: newStatus }
            : equipments
        )
      );
    } catch (error) {
      console.error("Error updating equipments: ", error);
    }
  };

  // Function to delete all files under a specific description path
  const deleteFilesInPath = async (description: string) => {
    try {
      const storage = getStorage();
      const folderRef = storageRef(storage, `equipments/${description}`);

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

  // Function to delete equipments data from Realtime Database
  const deleteEquipmentData = async (equipmentKey: string) => {
    try {
      const equipmentRef = dbRef(db, `equipments/${equipmentKey}`);

      // Remove the room data
      await remove(equipmentRef);

      console.log("Equipment data deleted successfully");
    } catch (error) {
      console.error("Error deleting room equipment: ", error);
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

  // Function to delete a equipments and its associated files
  const deleteEquipmentAndFiles = async (equipments: {
    description: string;
    imageUrl?: string;
    key: string; // Add the key here
  }) => {
    try {
      // Delete the image file if imageUrl is present
      if (equipments.imageUrl) {
        await deleteFileByUrl(equipments.imageUrl);
      }

      // Delete all files under the description path
      await deleteFilesInPath(equipments.description);

      // Delete the room data from the database using the room key
      await deleteEquipmentData(equipments.key);

      toast.success("Equipment deleted successfully!");
      console.log("Equipment and all associated files deleted successfully");
    } catch (error) {
      console.error("Error deleting equipment and files: ", error);
    }
  };

  const handleAddEquipments = () => {
    navigate("/AddEquipments");
  };

  // Function to handle select all checkbox
  const handleSelectAll = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.checked) {
      const allKeys = new Set(equipments.map((equipments) => equipments.key));
      setSelectedRows(allKeys);
    } else {
      setSelectedRows(new Set());
    }
  };

  // Function to handle row checkbox change
  const handleRowCheckboxChange = (
    equipmentsKey: string,
    isChecked: boolean
  ) => {
    setSelectedRows((prevSelectedRows) => {
      const updatedSelectedRows = new Set(prevSelectedRows);
      if (isChecked) {
        updatedSelectedRows.add(equipmentsKey);
      } else {
        updatedSelectedRows.delete(equipmentsKey);
      }
      return updatedSelectedRows;
    });
  };

  // Calculate number of selected rows
  const selectedCount = selectedRows.size;

  const addSNToEquipment = async (key: string, serialNumber: string) => {
    try {
      const equipmentRef = dbRef(getDatabase(), `equipments/${key}`);
      await update(equipmentRef, { serialNumber });
      toast.success("Serial Number added successfully!");
    } catch (error) {
      console.error("Error adding Serial Number: ", error);
      toast.error("Failed to add Serial Number.");
    }
  };

  // Open modal and set the selected equipment key
  const openAddSNModal = (equipmentKey: string) => {
    setSelectedEquipmentKey(equipmentKey);
    setIsModalOpen2(true);
  };

  const handleAddSNSubmit = () => {
    if (newSN.trim()) {
      addSNToEquipment(selectedEquipmentKey, newSN);
      setNewSN("");
      setIsModalOpen2(false);
    } else {
      toast.error("Serial Number cannot be empty.");
    }
  };

  const handleShowSN = async (equipmentKey: string) => {
    try {
      const equipmentRef = dbRef(db, `equipments/${equipmentKey}/serialNumber`);
      const snapshot = await get(equipmentRef);
      const sn = snapshot.val();
      setSN(sn || "No serial number available");
      setIsShowingSN(true); // Open modal for showing description
    } catch (error) {
      console.error("Error fetching extra description: ", error);
      toast.error("Failed to fetch extra description.");
    }
  };

  const handleSNClose = () => {
    setIsShowingSN(false); // Close the modal
    setSN(null); // Reset extra description
  };

  const handleSNCloseModal = () => {
    setNewSN("");
    setIsModalOpen2(false);
  };

  const handleClearSN = async () => {
    if (selectedRows.size > 0) {
      try {
        for (const key of selectedRows) {
          const equipmentRef = dbRef(db, `equipments/${key}`);
          await update(equipmentRef, { serialNumber: null });
        }
        toast.success("Serial Number cleared successfully!");
        handleDescriptionModalClose();
      } catch (error) {
        console.error("Error clearing Serial Number: ", error);
        toast.error("Failed to clear Serial Number.");
      }
    } else {
      toast.error("No equipment selected to clear Serial Number.");
    }
  };

  const addDescriptionToEquipment = async (
    key: string,
    extraDescription: string
  ) => {
    try {
      const equipmentRef = dbRef(getDatabase(), `equipments/${key}`);
      await update(equipmentRef, { extraDescription });
      toast.success("Description added successfully!");
    } catch (error) {
      console.error("Error adding description: ", error);
      toast.error("Failed to add description.");
    }
  };

  // Open modal and set the selected equipment key
  const openAddDescriptionModal = (equipmentKey: string) => {
    setSelectedEquipmentKey(equipmentKey);
    setIsModalOpen(true);
  };

  const handleAddDescriptionSubmit = () => {
    if (newDescription.trim()) {
      addDescriptionToEquipment(selectedEquipmentKey, newDescription);
      setNewDescription("");
      setIsModalOpen(false);
    } else {
      toast.error("Description cannot be empty.");
    }
  };

  const handleShowDescription = async (equipmentKey: string) => {
    try {
      const equipmentRef = dbRef(
        db,
        `equipments/${equipmentKey}/extraDescription`
      );
      const snapshot = await get(equipmentRef);
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
          const equipmentRef = dbRef(db, `equipments/${key}`);
          await update(equipmentRef, { extraDescription: null });
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

  const resetEquipmentUsedCount = async (equipmentKey: string) => {
    try {
      const equipmentRef = dbRef(db, `equipments/${equipmentKey}`);
      await update(equipmentRef, { equipmentUsed: 0 });
      toast.success("Equipment used count reset to 0!");
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
    updateEquipments(key, isAvailable);
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
                    <li className="mb-4">
                      <a
                        href="/Rooms"
                        className="flex items-center p-2 hover:bg-green-600 rounded-md"
                      >
                        <img src={roomslogo} alt="Rooms" className="h-6 w-6" />
                        <span className="ml-2 text-white font-bold">Rooms</span>
                      </a>
                    </li>
                    <li className="mb-4 bg-green-800 border-2 border-green-600 rounded-full p-1">
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
            <h1 className="text-2xl font-bold text-black">Equipments</h1>
            <button onClick={handleAddEquipments} className="btn text-white">
              + Add New Equipments
            </button>
          </div>

          <div className="overflow-y-auto scrollbar-hide text-black max-h-[calc(100vh-200px)]">
            <table className="table w-full text-black">
              <thead>
                <tr>
                  <th>
                    <input
                      type="checkbox"
                      className="checkbox border-black"
                      onChange={handleSelectAll}
                      checked={selectedRows.size === equipments.length}
                    />
                  </th>
                  <th className="text-black">ID</th>
                  <th className="text-black">Description</th>
                  <th className="text-black">Is Available</th>
                  <th className="text-black">Actions</th>
                </tr>
              </thead>
              <tbody>
                {equipments.map((equipment) => (
                  <tr key={equipment.key}>
                    <th>
                      <input
                        type="checkbox"
                        className="checkbox border-black"
                        checked={selectedRows.has(equipment.key)}
                        onChange={(e) =>
                          handleRowCheckboxChange(
                            equipment.key,
                            e.target.checked
                          )
                        }
                      />
                    </th>
                    <td>{equipment.id}</td>
                    <td>{equipment.description}</td>
                    <td className="flex items-center">
                      {equipment.isAvailable ? "Yes" : "No"}

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
                                onClick={() =>
                                  handleSelection(equipment.key, false)
                                }
                              >
                                Yes
                              </button>
                            </li>
                            <li className="btn btn-sm bg-error text-white">
                              <button
                                onClick={() =>
                                  handleSelection(equipment.key, true)
                                }
                              >
                                No
                              </button>
                            </li>
                          </ul>
                        )}
                      </div>
                    </td>
                    <td>
                      <div className="flex flex-wrap gap-2 justify-start">
                        <button
                          className="btn btn-sm bg-error text-white"
                          onClick={() => resetEquipmentUsedCount(equipment.key)}
                        >
                          Reset Used Count
                        </button>
                        <button
                          className="btn btn-sm text-white"
                          onClick={() => openAddDescriptionModal(equipment.key)}
                        >
                          Add Description
                        </button>
                        <button
                          className="btn btn-sm text-white"
                          onClick={() => handleShowDescription(equipment.key)}
                        >
                          Show Description
                        </button>
                        <button
                          className="btn btn-sm text-white"
                          onClick={() => openAddSNModal(equipment.key)}
                        >
                          Add Serial Number
                        </button>
                        <button
                          className="btn btn-sm text-white"
                          onClick={() => handleShowSN(equipment.key)}
                        >
                          Show Serial Number
                        </button>
                        <button
                          className="btn btn-sm bg-error text-white"
                          onClick={() => deleteEquipmentAndFiles(equipment)}
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

          <div className="flex justify-between items-center mt-4">
            <span>
              {selectedCount} of {equipments.length} row(s) selected.
            </span>
            <div>
              <button className="btn btn-sm mr-2 text-white">Previous</button>
              <button className="btn btn-sm text-white">Next</button>
            </div>
          </div>
        </div>
      </main>

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
      <Modal isOpen={isShowingDescription} onClose={handleCloseModal}>
        <div className="p-6">
          <h2 className="text-xl font-bold mb-4 text-black">
            Extra Description
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

      {/* Modal for adding Serial Number */}
      <Modal isOpen={isModalOpen2} onClose={handleSNCloseModal}>
        <div className="p-6">
          <h2 className="text-xl font-bold mb-4 text-black">
            Add Serial Number
          </h2>
          <input
            type="text"
            value={newSN}
            onChange={(e) => setNewSN(e.target.value)}
            placeholder="Enter Serial Number"
            className="input input-bordered w-full mb-4"
          />
          <div className="flex justify-end">
            <button className="btn text-white" onClick={handleAddSNSubmit}>
              Add
            </button>
            <button
              className="btn btn-error text-white font-bold ml-2"
              onClick={handleSNCloseModal}
            >
              Cancel
            </button>
          </div>
        </div>
      </Modal>

      {/* Modal for showing Serial Number */}
      <Modal isOpen={isShowingSN} onClose={handleSNCloseModal}>
        <div className="p-6">
          <h2 className="text-xl font-bold mb-4 text-black">Serial Number</h2>
          <p className="text-black">{sN}</p>
          <div className="flex justify-end">
            <button
              className="btn btn-error text-white font-bold mr-2"
              onClick={handleClearSN} // Use updated handler
            >
              Clear
            </button>
            <button className="btn text-white " onClick={handleSNClose}>
              Close
            </button>
          </div>
        </div>
      </Modal>

      <ToastContainer />
    </div>
  );
}

export default Equipments;
