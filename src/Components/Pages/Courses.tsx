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

interface Course {
  id: number;
  description: string;
  isAvailable: boolean;
  key: string;
  department: string; // Add department here
}

// Firebase configuration
const firebaseConfig = {

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
      department: string;
      key: string;
    }[]
  >([]);
  const [selectedRows, setSelectedRows] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState<boolean>(true); // Loading state
  const [showAddOptions, setShowAddOptions] = useState(true);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [selectedDepartment, setSelectedDepartment] = useState<string>("All");
  const [selectedCount, setSelectedCount] = useState(0);
  const departments = ["CCS", "COC", "CTEAS", "CBE"];

  useEffect(() => {
    const coursesRef = dbRef(db, "courses");

    const handleData = (snapshot: any) => {
      const data = snapshot.val();
      if (data) {
        const allCourses: Course[] = []; // Explicitly define courses as an array of `Course`

        // Departments are fixed: CCS, COC, CTEAS, CBE
        const departments = ["CCS", "COC", "CTEAS", "CBE"];

        // Loop through each department (which is a key in the courses object)
        departments.forEach((department) => {
          // If the department exists in the data, loop through its courses
          if (data[department]) {
            Object.keys(data[department]).forEach((courseKey, index) => {
              const courseData = data[department][courseKey];

              // Construct the course object with the department
              allCourses.push({
                id: index + 1,
                department: courseData.department, // department is now fixed based on the iteration
                description: courseData.description,
                isAvailable: courseData.availability ?? true,
                key: courseKey,
              });
            });
          }
        });

        setCourses(allCourses); // Set the courses state with typed `Course[]`
      } else {
        setCourses([]);
      }
      setLoading(false); // Set loading to false after data is fetched
    };

    // Set up the listener to fetch data from all courses (all departments)
    const unsubscribe = onValue(coursesRef, handleData);

    // Cleanup listener on unmount
    return () => unsubscribe();
  }, []);

  const updateCourses = async (
    courseKey: string,
    currentStatus: boolean,
    department: string
  ) => {
    try {
      const newStatus = !currentStatus; // Toggle the availability
      const courseRef = dbRef(db, `courses/${department}/${courseKey}`);
      await update(courseRef, { availability: newStatus });

      // Update local state
      setCourses((prevCourses) =>
        prevCourses.map((course) =>
          course.key === courseKey
            ? { ...course, isAvailable: newStatus }
            : course
        )
      );
    } catch (error) {
      console.error("Error updating course: ", error);
    }
  };

  // Function to delete course data from Realtime Database
  const deleteCourseData = async (courseKey: string) => {
    try {
      const courseRef = dbRef(db, `courses/${courseKey}`);

      // Remove the course data
      await remove(courseRef);

      // Remove from local state
      setCourses((prevCourses) =>
        prevCourses.filter((course) => course.key !== courseKey)
      );

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

  const handleSelectAll = () => {
    if (selectedRows.size === courses.length) {
      setSelectedRows(new Set());
    } else {
      const allKeys = new Set(courses.map((course) => course.key));
      setSelectedRows(allKeys);
    }
  };

  const handleRowCheckboxChange = (key: string, isChecked: boolean) => {
    const newSelectedRows = new Set(selectedRows);
    if (isChecked) {
      newSelectedRows.add(key);
    } else {
      newSelectedRows.delete(key);
    }
    setSelectedRows(newSelectedRows);
    setSelectedCount(newSelectedRows.size);
  };

  const handleDepartmentChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedDepartment(e.target.value);
  };

  // Filter courses by selected department
  const filteredCourses =
    selectedDepartment === "All"
      ? courses
      : courses.filter((course) => course.department === selectedDepartment);

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
    setDropdownOpen((prev) => !prev);
  };

  const handleSelection = (key: any, isAvailable: any, department: string) => {
    updateCourses(key, isAvailable, department); // Pass department along with the key and availability status
    setDropdownOpen(false); // Close the dropdown after clicking Yes or No
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
                    <li className="mb-4 bg-green-800 border-2 border-green-600 rounded-full p-1">
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
            <h1 className="text-2xl font-bold text-black">Courses</h1>

            {/* Department Filter Dropdown */}
            <div>
              <select
                value={selectedDepartment}
                onChange={handleDepartmentChange}
                className="select select-bordered bg-gray-100 text-black font-bold"
              >
                <option value="All">All Departments</option>
                {departments.map((dept) => (
                  <option key={dept} value={dept}>
                    {dept}
                  </option>
                ))}
              </select>
            </div>

            <button onClick={handleAddCourses} className="btn text-white">
              + Add New Courses
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
                      checked={selectedRows.size === filteredCourses.length}
                    />
                  </th>
                  <th className="text-black">ID</th>
                  <th className="text-black">Description</th>
                  <th className="text-black">Is Available</th>
                  <th className="text-black">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredCourses.map((course) => (
                  <tr key={course.key}>
                    <th>
                      <input
                        type="checkbox"
                        className="checkbox border-black"
                        checked={selectedRows.has(course.key)}
                        onChange={(e) =>
                          handleRowCheckboxChange(course.key, e.target.checked)
                        }
                      />
                    </th>
                    <td>{course.id}</td>
                    <td>{course.description}</td>
                    <td>{course.isAvailable ? "Yes" : "No"}</td>
                    <td className="flex items-center">
                      {/* Dropdown Menu for Update/Delete */}
                      <div
                        className={`dropdown dropdown-left dropdown-end ml-2 ${
                          dropdownOpen ? "open" : ""
                        }`}
                      >
                        <label
                          tabIndex={0}
                          className="btn btn-sm bg-gray-200 p-1 text-black"
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
                                  handleSelection(
                                    course.key,
                                    false,
                                    course.department
                                  )
                                }
                              >
                                Yes
                              </button>
                            </li>
                            <li className="btn btn-sm text-white mb-2">
                              <button
                                onClick={() =>
                                  handleSelection(
                                    course.key,
                                    true,
                                    course.department
                                  )
                                }
                              >
                                No
                              </button>
                            </li>
                          </ul>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="flex justify-between items-center mt-4">
            <span className="text-sm">
              {selectedCount} of {filteredCourses.length} row(s) selected.
            </span>
            <div className="flex gap-2">
              <button className="btn btn-sm text-white">Previous</button>
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
