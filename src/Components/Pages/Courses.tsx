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
import schoolLogo from "../../assets/scclogo.png";
import dashboardlogo from "../../assets/dashboardlogo.png";
import roomslogo from "../../assets/roomslogo.png";
import equipmentslogo from "../../assets/equipmentslogo.png";
import reportslogo from "../../assets/reportslogo.png";
import qrCode from "../../assets/qrcodelogo.png";
import reschedule from "../../assets/rescheduling.png";
import borrowLogo from "../../assets/borrowicon.png";
import managedataLogo from "../../assets/managelogo.png";
import coursesLogo from "../../assets/courses.png";
import loginHistoryLogo from "../../assets/loginhistory.png";
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

function Courses() {
  const navigate = useNavigate();
  const [courses, setCourses] = useState<
    {
      id: number;
      description: string;
      isAvailable: boolean;
      key: string;
    }[]
  >([]);
  const [selectedRows, setSelectedRows] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState<boolean>(true); // Loading state
  const [showAddOptions, setShowAddOptions] = useState(true);

  useEffect(() => {
    const coursesRef = dbRef(db, "courses");

    const handleData = (snapshot: any) => {
      const data = snapshot.val();
      if (data) {
        const coursesList = Object.keys(data).map((key, index) => ({
          id: index + 1,
          description: data[key].description,
          isAvailable: data[key].availability ?? true,
          key,
        }));
        setCourses(coursesList);
      } else {
        setCourses([]);
      }
      setLoading(false); // Set loading to false after data is fetched
    };

    // Set up the listener
    const unsubscribe = onValue(coursesRef, handleData);

    // Cleanup listener on unmount
    return () => unsubscribe();
  }, []);

  const updateCourses = async (courseKey: string, currentStatus: boolean) => {
    try {
      const roomRef = dbRef(db, `courses/${courseKey}`);
      const newStatus = !currentStatus; // Toggle the current status
      await update(roomRef, { availability: newStatus });

      // Update local state
      setCourses((prevCourses) =>
        prevCourses.map((courses) =>
          courses.key === courseKey
            ? { ...courses, isAvailable: newStatus }
            : courses
        )
      );
    } catch (error) {
      console.error("Error updating equipments: ", error);
    }
  };

  // Function to delete courses data from Realtime Database
  const deleteCourseData = async (coursesKey: string) => {
    try {
      const coursesRef = dbRef(db, `courses/${coursesKey}`);

      // Remove the course data
      await remove(coursesRef);

      console.log("Course data deleted successfully");
    } catch (error) {
      console.error("Error deleting course: ", error);
    }
  };

  // Function to delete a course and its associated files
  const deleteCourse = async (courses: {
    description: string;
    imageUrl?: string;
    key: string; // Add the key here
  }) => {
    try {
      // Delete the course data from the database using the room key
      await deleteCourseData(courses.key);

      toast.success("Course deleted successfully!");
      console.log("Course and all associated files deleted successfully");
    } catch (error) {
      console.error("Error deleting course", error);
    }
  };

  const handleAddCourses = () => {
    navigate("/AddCourses");
  };

  // Function to handle select all checkbox
  const handleSelectAll = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.checked) {
      const allKeys = new Set(courses.map((courses) => courses.key));
      setSelectedRows(allKeys);
    } else {
      setSelectedRows(new Set());
    }
  };

  // Function to handle row checkbox change
  const handleRowCheckboxChange = (coursesKey: string, isChecked: boolean) => {
    setSelectedRows((prevSelectedRows) => {
      const updatedSelectedRows = new Set(prevSelectedRows);
      if (isChecked) {
        updatedSelectedRows.add(coursesKey);
      } else {
        updatedSelectedRows.delete(coursesKey);
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
      <aside className="w-full md:w-64 bg-gray-100 p-4 h-screen overflow-y-auto scrollbar-hide">
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
            className="h-18 w-16 md:h-18 md:w-18 rounded-full"
          />
        </div>
        <nav className="h-full">
          <ul>
            {/* Existing Dashboard Link */}
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
                href="/BookBorrow"
                className="flex items-center p-2 hover:bg-gray-300 rounded-md"
              >
                <img src={borrowLogo} alt="Book/Borrow" className="h-6 w-6" />
                <span className="ml-2 text-black font-bold">Book/Borrow</span>
              </a>
            </li>

            {/* Add option with dropdown */}
            <li className="mb-4">
              <button
                onClick={() => setShowAddOptions(!showAddOptions)} // Toggle add options
                className="flex items-center p-2 hover:bg-gray-300 rounded-md w-full text-left"
              >
                <img
                  src={managedataLogo}
                  alt="Manage Data"
                  className="h-6 w-6"
                />
                <span className="ml-2 text-black font-bold">Manage Data</span>
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
                        className="flex items-center p-2 hover:bg-gray-300 rounded-md"
                      >
                        <img src={roomslogo} alt="Rooms" className="h-6 w-6" />
                        <span className="ml-2 text-black font-bold">Rooms</span>
                      </a>
                    </li>
                    <li className="mb-4">
                      <a
                        href="/Equipments"
                        className="flex items-center p-2 hover:bg-gray-300 rounded-md"
                      >
                        <img
                          src={equipmentslogo}
                          alt="Equipments"
                          className="h-6 w-6"
                        />
                        <span className="ml-2 text-black font-bold">
                          Equipments
                        </span>
                      </a>
                    </li>
                    <li className="mb-4 bg-gray-200 border-2 border-gray-200 rounded-full p-1">
                      <a
                        href="/Courses"
                        className="flex items-center p-2 hover:bg-gray-300 rounded-md"
                      >
                        <img
                          src={coursesLogo}
                          alt="Courses"
                          className="h-6 w-6"
                        />
                        <span className="ml-2 text-black font-bold">
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
                className="flex items-center p-2 hover:bg-gray-300 rounded-md"
              >
                <img src={reportslogo} alt="Reports" className="h-6 w-6" />
                <span className="ml-2 text-black font-bold">Transactions</span>
              </a>
            </li>
            <li className="mb-4">
              <a
                href="/Reschedule"
                className="flex items-center p-2 hover:bg-gray-300 rounded-md"
              >
                <img src={reschedule} alt="Reschedule" className="h-6 w-6" />
                <span className="ml-2 text-black font-bold">Reschedule</span>
              </a>
            </li>
            <li className="mb-4">
              <a
                href="/QrCode"
                className="flex items-center p-2 hover:bg-gray-300 rounded-md"
              >
                <img src={qrCode} alt="QR" className="h-6 w-6" />
                <span className="ml-2 text-black font-bold">QR Code</span>
              </a>
            </li>
            <li className="mb-4">
              <a
                href="/ReportsTable"
                className="flex items-center p-2 hover:bg-gray-300 rounded-md"
              >
                <img
                  src={reportslogo}
                  alt="Reports Table"
                  className="h-6 w-6"
                />
                <span className="ml-2 text-black font-bold">Reports Table</span>
              </a>
            </li>
            <li className="mb-4">
              <a
                href="/LoginHistory"
                className="flex items-center p-2 hover:bg-gray-300 rounded-md"
              >
                <img
                  src={loginHistoryLogo}
                  alt="Login History"
                  className="h-6 w-6"
                />
                <span className="ml-2 text-black font-bold">Login History</span>
              </a>
            </li>
          </ul>
        </nav>
      </aside>
      <main className="flex-1 p-6 bg-white overflow-auto max-h-screen">
        <div className="p-4">
          <div className="flex justify-between items-center mb-4">
            <h1 className="text-2xl font-bold text-black">Courses</h1>
            <button onClick={handleAddCourses} className="btn text-white">
              + Add New Courses
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
                      checked={selectedRows.size === setCourses.length}
                    />
                  </th>
                  <th className="text-black">ID</th>
                  <th className="text-black">Description</th>
                  <th className="text-black">Is Available</th>
                  <th className="text-black">Actions</th>
                </tr>
              </thead>
              <tbody>
                {courses.map((courses) => (
                  <tr key={courses.key}>
                    <th>
                      <input
                        type="checkbox"
                        className="checkbox border-black"
                        checked={selectedRows.has(courses.key)}
                        onChange={(e) =>
                          handleRowCheckboxChange(courses.key, e.target.checked)
                        }
                      />
                    </th>
                    <td>{courses.id}</td>
                    <td>{courses.description}</td>
                    <td>{courses.isAvailable ? "Yes" : "No"}</td>
                    <td>
                      <button
                        className="btn btn-sm text-white mr-2"
                        onClick={() =>
                          updateCourses(courses.key, courses.isAvailable)
                        }
                      >
                        Update
                      </button>
                      <button
                        className="btn btn-sm btn-error text-white"
                        onClick={() => deleteCourse(courses)}
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
              {selectedCount} of {courses.length} row(s) selected.
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

export default Courses;
