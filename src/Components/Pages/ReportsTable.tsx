import schoolLogo from "../../assets/scclogo.png";
import dashboardlogo from "../../assets/dashboardlogo.png";
import roomslogo from "../../assets/roomslogo.png";
import equipmentslogo from "../../assets/equipmentslogo.png";
import reschedule from "../../assets/rescheduling.png";
import reportslogo from "../../assets/reportslogo.png";
import qrCode from "../../assets/qrcodelogo.png";
import loginHistoryLogo from "../../assets/loginhistory.png";
import coursesLogo from "../../assets/courses.png";
import { initializeApp } from "firebase/app";
import { get, getDatabase, onValue, ref, remove } from "firebase/database";
import Lottie from "lottie-react";
import loadingAnimation from "../../assets/loadinganimation2.json";
import { useEffect, useRef, useState } from "react";
import html2canvas from "html2canvas-pro";
import jsPDF from "jspdf";
import borrowLogo from "../../assets/borrowicon.png";
import managedataLogo from "../../assets/managelogo.png";

interface Report {
  gender: string;
}

interface TimeCounts {
  am: number;
  pm: number;
}

interface GenderCounts {
  male: TimeCounts;
  female: TimeCounts;
}

interface RoomCounts {
  conference: GenderCounts;
  collaboratory: GenderCounts;
  tutoring: GenderCounts;
}

interface Counts {
  [key: string]: RoomCounts;
}

interface CourseDetail {
  description: string;
  time: "am" | "pm";
  room: string;
}

interface Course {
  description: string;
  [key: string]: any; // This allows any other dynamic properties (like course id, etc.)
}

function ReportsTable() {
  const [activeTab, setActiveTab] = useState<"rooms" | "equipments">("rooms");
  const [activeGenderTab, setActiveGenderTab] = useState<"male" | "female">(
    "male"
  );
  const [equipmentNames, setEquipmentNames] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [courses, setCourses] = useState<Course[]>([]);
  const [, setRoomData] = useState<any[]>([]); // Add state for room data
  const [, setTotalBookings] = useState(0); // State for total bookings
  const [roomCounts, setRoomCounts] = useState<RoomCounts>({
    conference: { male: { am: 0, pm: 0 }, female: { am: 0, pm: 0 } },
    collaboratory: { male: { am: 0, pm: 0 }, female: { am: 0, pm: 0 } },
    tutoring: { male: { am: 0, pm: 0 }, female: { am: 0, pm: 0 } },
  });
  const [courseDescriptionsList, setCourseDescriptionsList] = useState<
    CourseDetail[]
  >([]);

  const [isModalOpenEquipment, setIsModalOpenEquipment] = useState(false);
  const [isModalOpenMale, setIsModalOpenMale] = useState(false);
  const [isModalOpenFemale, setIsModalOpenFemale] = useState(false);
  const formatDate = (date: Date) => {
    const options: Intl.DateTimeFormatOptions = {
      year: "numeric",
      month: "long",
      day: "numeric",
    };
    return date.toLocaleDateString(undefined, options);
  };
  const currentDateFormatted = formatDate(new Date());
  const [equipmentCounts, setEquipmentCounts] = useState<{
    [key: string]: number;
  }>({});
  const reportRef = useRef(null);
  const [showAddOptions, setShowAddOptions] = useState(false);

  const firebaseConfig = {

  };

  const app = initializeApp(firebaseConfig);
  const db = getDatabase(app);

  useEffect(() => {
    const equipmentsRef = ref(db, "equipments");

    const unsubscribe = onValue(equipmentsRef, (snapshot) => {
      const equipmentsData = snapshot.val();
      const loadedEquipmentNames: string[] = [];

      if (equipmentsData) {
        for (const equipmentId in equipmentsData) {
          const name = equipmentsData[equipmentId].description;
          loadedEquipmentNames.push(name);
        }
      } else {
        console.log("No equipment data found.");
      }

      setEquipmentNames(loadedEquipmentNames); // Update state with loaded names
      setLoading(false);
    });

    return () => {
      unsubscribe();
    };
  }, []);

  useEffect(() => {
    const coursesRef = ref(db, "courses");

    const unsubscribeCourses = onValue(coursesRef, (snapshot) => {
      const coursesData = snapshot.val();
      const loadedCourses: {
        department: string;
        courseId: string;
        description: string;
      }[] = [];

      for (const department in coursesData) {
        if (coursesData[department]) {
          for (const courseId in coursesData[department]) {
            const courseInfo = coursesData[department][courseId];
            const courseDescription = courseInfo?.description;

            if (courseDescription) {
              loadedCourses.push({
                department,
                courseId,
                description: courseDescription,
              });
              console.log(
                `Department: ${department}, Course Description: ${courseDescription}`
              );
            } else {
              console.warn(
                `No description found for course ID ${courseId} in department ${department}`
              );
            }
          }
        }
      }

      // After loading all course descriptions with department info, update state
      setLoading(false);
      setCourses(loadedCourses);
    });

    return () => {
      unsubscribeCourses();
    };
  }, []);

  useEffect(() => {
    const currentDate = new Date(); // Get the current local date
    const currentDateString = currentDate.toLocaleDateString("en-CA"); // Format it as YYYY-MM-DD

    const roomsRef = ref(db, `reportsTable/rooms/${currentDateString}`);

    const unsubscribeRooms = onValue(roomsRef, (snapshot) => {
      const roomsData = snapshot.val();
      const loadedRoomData: any[] = [];
      let count = 0;

      if (roomsData) {
        for (const roomId in roomsData) {
          const room = roomsData[roomId];

          // Log the course for the current room
          console.log(`Room ID: ${roomId}, Course: ${room.course}`);

          loadedRoomData.push({
            course: room.course,
            startTime: room.startTime,
            endTime: room.endTime,
          });
          count++;
        }
      }

      setRoomData(loadedRoomData);
      setTotalBookings(count);
    });

    return () => {
      unsubscribeRooms();
    };
  }, []);

  useEffect(() => {
    const currentDate = new Date();
    const currentDateString = currentDate.toLocaleDateString("en-CA"); // Format as YYYY-MM-DD
    console.log("Current Date:", currentDateString);

    const roomsRef = ref(db, `reportsTable/rooms`);

    const countRooms = (roomsData: any) => {
      const counts = {
        conference: { male: { am: 0, pm: 0 }, female: { am: 0, pm: 0 } },
        collaboratory: { male: { am: 0, pm: 0 }, female: { am: 0, pm: 0 } },
        tutoring: { male: { am: 0, pm: 0 }, female: { am: 0, pm: 0 } },
      };

      if (roomsData) {
        for (const roomId in roomsData) {
          const room = roomsData[roomId];
          const startHour = new Date(`1970-01-01T${room.startTime}`).getHours();
          const roomName = room.roomName;
          const gender = room.gender;

          if (roomName === "Conference Room") {
            if (gender === "male") {
              startHour < 12
                ? counts.conference.male.am++
                : counts.conference.male.pm++;
            } else {
              startHour < 12
                ? counts.conference.female.am++
                : counts.conference.female.pm++;
            }
          } else if (roomName === "Collaboratory Room") {
            if (gender === "male") {
              startHour < 12
                ? counts.collaboratory.male.am++
                : counts.collaboratory.male.pm++;
            } else {
              startHour < 12
                ? counts.collaboratory.female.am++
                : counts.collaboratory.female.pm++;
            }
          } else if (roomName === "Tutoring Room") {
            if (gender === "male") {
              startHour < 12
                ? counts.tutoring.male.am++
                : counts.tutoring.male.pm++;
            } else {
              startHour < 12
                ? counts.tutoring.female.am++
                : counts.tutoring.female.pm++;
            }
          }
        }
      }

      return counts;
    };

    const unsubscribeRooms = onValue(roomsRef, (snapshot) => {
      const allRoomsData = snapshot.val(); // Get all room data for all dates
      let finalCounts = {
        conference: { male: { am: 0, pm: 0 }, female: { am: 0, pm: 0 } },
        collaboratory: { male: { am: 0, pm: 0 }, female: { am: 0, pm: 0 } },
        tutoring: { male: { am: 0, pm: 0 }, female: { am: 0, pm: 0 } },
      };

      // Loop through all dates in the data
      for (const date in allRoomsData) {
        const roomsDataForDate = allRoomsData[date];
        const dateCounts = countRooms(roomsDataForDate);

        // Add counts for the current date to the total finalCounts
        finalCounts.conference.male.am += dateCounts.conference.male.am;
        finalCounts.conference.male.pm += dateCounts.conference.male.pm;
        finalCounts.conference.female.am += dateCounts.conference.female.am;
        finalCounts.conference.female.pm += dateCounts.conference.female.pm;

        finalCounts.collaboratory.male.am += dateCounts.collaboratory.male.am;
        finalCounts.collaboratory.male.pm += dateCounts.collaboratory.male.pm;
        finalCounts.collaboratory.female.am +=
          dateCounts.collaboratory.female.am;
        finalCounts.collaboratory.female.pm +=
          dateCounts.collaboratory.female.pm;

        finalCounts.tutoring.male.am += dateCounts.tutoring.male.am;
        finalCounts.tutoring.male.pm += dateCounts.tutoring.male.pm;
        finalCounts.tutoring.female.am += dateCounts.tutoring.female.am;
        finalCounts.tutoring.female.pm += dateCounts.tutoring.female.pm;
      }

      // Now set the final aggregated room counts
      setRoomCounts(finalCounts);
    });

    return () => {
      unsubscribeRooms();
    };
  }, []);

  useEffect(() => {
    const fetchEquipments = async () => {
      const currentDate = new Date().toISOString().split("T")[0]; // Format: YYYY-MM-DD

      try {
        // Fetch equipment data for the current date
        const equipmentsSnapshot = await get(
          ref(db, `reportsTable/equipments/${currentDate}`)
        );
        const equipmentsData = equipmentsSnapshot.val() || {};

        const counts: { [key: string]: number } = {}; // Initialize counts object

        // Fetch the entire courses data at once
        const coursesSnapshot = await get(ref(db, "courses"));
        const coursesData = coursesSnapshot.val() || {};

        // Loop through each equipment in the data
        for (const equipmentId in equipmentsData) {
          const equipment = equipmentsData[equipmentId];
          const equipmentName = equipment.equipmentName;
          const courseIds = equipment.course; // Assuming this is an array of course IDs

          // Fetch course descriptions for each courseId
          const courseDescriptions = await Promise.all(
            courseIds.map((courseId: string) => {
              let courseDescription = "No description available"; // Default if not found

              // Iterate through all departments and find the courseId
              for (const department in coursesData) {
                const departmentData = coursesData[department];

                // Check if the courseId exists in the department
                if (departmentData[courseId]) {
                  const courseData = departmentData[courseId]; // Get course data
                  if (courseData && courseData.description) {
                    courseDescription = courseData.description; // Set description if found
                    break; // Stop once found
                  }
                }
              }

              return courseDescription;
            })
          );

          // Process each course description
          courseDescriptions.forEach((courseDescription) => {
            if (courseDescription) {
              const key = `${courseDescription} - ${equipmentName}`;

              // Increment count for the equipment under the course
              counts[key] = (counts[key] || 0) + 1;
            }
          });
        }

        // Set the flattened equipment counts
        setEquipmentCounts(counts);
      } catch (error) {
        console.error("Error fetching equipments:", error);
      }
    };

    // Call the function
    fetchEquipments();
  }, []);

  useEffect(() => {
    const currentDate = new Date(); // Get the local date
    const currentDateString = currentDate.toLocaleDateString("en-CA"); // Format it as YYYY-MM-DD

    const roomsRef = ref(db, `reportsTable/rooms/${currentDateString}`);

    const previousDate = new Date();
    previousDate.setDate(previousDate.getDate() - 1); // Subtract one day
    const previousDateString = previousDate.toLocaleDateString("en-CA"); // Format previous date as YYYY-MM-DD

    const previousRoomsRef = ref(
      db,
      `reportsTable/rooms/${previousDateString}`
    );

    const countRooms = async (roomsData: any): Promise<Counts> => {
      const counts: Counts = {};
      const courseSet = new Set<string>();

      if (roomsData) {
        for (const roomId in roomsData) {
          const room = roomsData[roomId];
          const startHour = new Date(`1970-01-01T${room.startTime}`).getHours();
          const courseIds = room.course;

          // Fetch the entire 'courses' node (no department specified)
          const allCoursesSnapshot = await get(ref(db, `courses`)); // Querying entire 'courses' node
          const allCoursesData = allCoursesSnapshot.val() || {}; // Fallback to empty if no data

          // Fetch course descriptions for each courseId
          const courseDescriptions = await Promise.all(
            courseIds.map((courseId: any) => {
              console.log(`Fetching course data for course ID: ${courseId}`);

              let courseDescription = "No description available"; // Default if not found

              // Iterate through all departments and find the courseId
              for (const department in allCoursesData) {
                const departmentData = allCoursesData[department];

                // Check if the courseId exists in the department
                if (departmentData[courseId]) {
                  const courseData = departmentData[courseId]; // Get course data
                  if (courseData && courseData.description) {
                    courseDescription = courseData.description; // Set description if found
                    break; // Stop once found
                  }
                }
              }

              console.log(
                `Course Description for ${courseId}: ${courseDescription}`
              );
              return courseDescription;
            })
          );

          courseDescriptions.forEach((courseDescription) => {
            if (courseDescription) {
              console.log(
                `Processing Room: ${
                  room.roomName
                }, Course: ${courseDescription}, Time: ${
                  startHour < 12 ? "am" : "pm"
                }`
              );

              const time = startHour < 12 ? "am" : "pm"; // Determine AM/PM
              const roomName = room.roomName;

              setCourseDescriptionsList((prev) => {
                const exists = prev.some(
                  (item) =>
                    item.description === courseDescription &&
                    item.time === time &&
                    item.room === roomName
                );
                return exists
                  ? prev
                  : [
                      ...prev,
                      { description: courseDescription, time, room: roomName },
                    ];
              });

              courseSet.add(courseDescription);
              if (!counts[courseDescription]) {
                counts[courseDescription] = {
                  conference: {
                    male: { am: 0, pm: 0 },
                    female: { am: 0, pm: 0 },
                  },
                  collaboratory: {
                    male: { am: 0, pm: 0 },
                    female: { am: 0, pm: 0 },
                  },
                  tutoring: {
                    male: { am: 0, pm: 0 },
                    female: { am: 0, pm: 0 },
                  },
                };
              }

              const gender = room.gender;

              if (roomName === "Conference Room") {
                if (gender === "male") {
                  startHour < 12
                    ? counts[courseDescription].conference.male.am++
                    : counts[courseDescription].conference.male.pm++;
                } else {
                  startHour < 12
                    ? counts[courseDescription].conference.female.am++
                    : counts[courseDescription].conference.female.pm++;
                }
              } else if (roomName === "Collaboratory Room") {
                if (gender === "male") {
                  startHour < 12
                    ? counts[courseDescription].collaboratory.male.am++
                    : counts[courseDescription].collaboratory.male.pm++;
                } else {
                  startHour < 12
                    ? counts[courseDescription].collaboratory.female.am++
                    : counts[courseDescription].collaboratory.female.pm++;
                }
              } else if (roomName === "Tutoring Room") {
                if (gender === "male") {
                  startHour < 12
                    ? counts[courseDescription].tutoring.male.am++
                    : counts[courseDescription].tutoring.male.pm++;
                } else {
                  startHour < 12
                    ? counts[courseDescription].tutoring.female.am++
                    : counts[courseDescription].tutoring.female.pm++;
                }
              }
            }
          });
        }
      }

      return counts;
    };

    const mergeCounts = (current: Counts, previous: Counts): RoomCounts => {
      const finalCounts: RoomCounts = {
        conference: { male: { am: 0, pm: 0 }, female: { am: 0, pm: 0 } },
        collaboratory: { male: { am: 0, pm: 0 }, female: { am: 0, pm: 0 } },
        tutoring: { male: { am: 0, pm: 0 }, female: { am: 0, pm: 0 } },
      };

      // Function to merge counts of a specific course
      const addCounts = (courseCounts: RoomCounts) => {
        // Update the finalCounts directly
        finalCounts.conference.male.am += courseCounts.conference.male.am;
        finalCounts.conference.male.pm += courseCounts.conference.male.pm;
        finalCounts.conference.female.am += courseCounts.conference.female.am;
        finalCounts.conference.female.pm += courseCounts.conference.female.pm;

        finalCounts.collaboratory.male.am += courseCounts.collaboratory.male.am;
        finalCounts.collaboratory.male.pm += courseCounts.collaboratory.male.pm;
        finalCounts.collaboratory.female.am +=
          courseCounts.collaboratory.female.am;
        finalCounts.collaboratory.female.pm +=
          courseCounts.collaboratory.female.pm;

        finalCounts.tutoring.male.am += courseCounts.tutoring.male.am;
        finalCounts.tutoring.male.pm += courseCounts.tutoring.male.pm;
        finalCounts.tutoring.female.am += courseCounts.tutoring.female.am;
        finalCounts.tutoring.female.pm += courseCounts.tutoring.female.pm;
      };

      // Merge current counts
      for (const course in current) {
        if (current[course]) {
          addCounts(current[course]); // Pass the counts directly
        }
      }

      // Merge previous counts
      for (const course in previous) {
        if (previous[course]) {
          addCounts(previous[course]); // Pass the counts directly
        }
      }

      return finalCounts;
    };

    const unsubscribeRooms = onValue(roomsRef, async (snapshot) => {
      const roomsData = snapshot.val();
      const currentCounts = await countRooms(roomsData);

      onValue(previousRoomsRef, async (prevSnapshot) => {
        const previousData = prevSnapshot.val();
        const previousCounts = await countRooms(previousData);

        const finalCounts = mergeCounts(currentCounts, previousCounts);

        // Now we can set the state to finalCounts which matches the RoomCounts type
        setRoomCounts(finalCounts);
      });
    });

    return () => {
      unsubscribeRooms();
    };
  }, []);

  const RoomsRenderTable = () => {
    // Initialize overall totals for each room type
    let overallConferenceTotal = 0;
    let overallCollaboratoryTotal = 0;
    let overallTutoringTotal = 0;

    return (
      <table className="min-w-full bg-white border border-gray-300 shadow-md rounded-lg">
        <thead className="bg-green-300 text-sm font-bold text-black">
          <tr>
            <th rowSpan={2} className="border px-4 py-2 text-center">
              Course
            </th>
            <th colSpan={3} className="border px-4 py-2 text-center">
              Conference Room
            </th>
            <th colSpan={3} className="border px-4 py-2 text-center">
              Collaboratory Room
            </th>
            <th colSpan={3} className="border px-4 py-2 text-center">
              Tutoring Room
            </th>
          </tr>
          <tr>
            <th className="border px-4 py-2 text-center">AM</th>
            <th className="border px-4 py-2 text-center">PM</th>
            <th className="border px-4 py-2 text-center">Total</th>
            <th className="border px-4 py-2 text-center">AM</th>
            <th className="border px-4 py-2 text-center">PM</th>
            <th className="border px-4 py-2 text-center">Total</th>
            <th className="border px-4 py-2 text-center">AM</th>
            <th className="border px-4 py-2 text-center">PM</th>
            <th className="border px-4 py-2 text-center">Total</th>
          </tr>
        </thead>
        <tbody>
          {courses.map((course, idx) => {
            // Find the course data by matching the course description (from the Course object)
            const courseData = courseDescriptionsList.find((item) => {
              return item.description === course.description;
            });

            if (courseData) {
              // Ensure roomCounts for both genders are properly set
              const conferenceCounts =
                activeGenderTab === "male"
                  ? roomCounts.conference.male || { am: 0, pm: 0 }
                  : roomCounts.conference.female || { am: 0, pm: 0 };
              const collaboratoryCounts =
                activeGenderTab === "male"
                  ? roomCounts.collaboratory.male || { am: 0, pm: 0 }
                  : roomCounts.collaboratory.female || { am: 0, pm: 0 };
              const tutoringCounts =
                activeGenderTab === "male"
                  ? roomCounts.tutoring.male || { am: 0, pm: 0 }
                  : roomCounts.tutoring.female || { am: 0, pm: 0 };

              // Calculate the total for each room type (sum of AM and PM)
              const conferenceTotal = conferenceCounts.am + conferenceCounts.pm;
              const collaboratoryTotal =
                collaboratoryCounts.am + collaboratoryCounts.pm;
              const tutoringTotal = tutoringCounts.am + tutoringCounts.pm;

              // Update the overall totals
              overallConferenceTotal += conferenceTotal;
              overallCollaboratoryTotal += collaboratoryTotal;
              overallTutoringTotal += tutoringTotal;

              return (
                <tr
                  key={idx}
                  className="text-sm hover:bg-gray-100 transition-colors text-black"
                >
                  <td className="border px-4 py-2">{course.description}</td>
                  <td className="border px-4 py-2 text-center">
                    {conferenceCounts.am}
                  </td>
                  <td className="border px-4 py-2 text-center">
                    {conferenceCounts.pm}
                  </td>
                  <td className="border px-4 py-2 text-center font-bold">
                    {conferenceTotal}
                  </td>
                  <td className="border px-4 py-2 text-center">
                    {collaboratoryCounts.am}
                  </td>
                  <td className="border px-4 py-2 text-center">
                    {collaboratoryCounts.pm}
                  </td>
                  <td className="border px-4 py-2 text-center font-bold">
                    {collaboratoryTotal}
                  </td>
                  <td className="border px-4 py-2 text-center">
                    {tutoringCounts.am}
                  </td>
                  <td className="border px-4 py-2 text-center">
                    {tutoringCounts.pm}
                  </td>
                  <td className="border px-4 py-2 text-center font-bold">
                    {tutoringTotal}
                  </td>
                </tr>
              );
            } else {
              return (
                <tr
                  key={idx}
                  className="text-sm hover:bg-gray-100 transition-colors text-black"
                >
                  <td className="border px-4 py-2">{course.description}</td>
                  <td className="border px-4 py-2 text-center">0</td>
                  <td className="border px-4 py-2 text-center">0</td>
                  <td className="border px-4 py-2 text-center">0</td>
                  <td className="border px-4 py-2 text-center">0</td>
                  <td className="border px-4 py-2 text-center">0</td>
                  <td className="border px-4 py-2 text-center">0</td>
                  <td className="border px-4 py-2 text-center">0</td>
                  <td className="border px-4 py-2 text-center">0</td>
                  <td className="border px-4 py-2 text-center">0</td>
                </tr>
              );
            }
          })}

          {/* Overall Total Row */}
          <tr className="font-bold text-black bg-green-100">
            <td className="border px-4 py-2 text-center">Overall Total</td>
            <td colSpan={3} className="border px-4 py-2 text-center">
              {overallConferenceTotal}
            </td>
            <td colSpan={3} className="border px-4 py-2 text-center">
              {overallCollaboratoryTotal}
            </td>
            <td colSpan={3} className="border px-4 py-2 text-center">
              {overallTutoringTotal}
            </td>
          </tr>
        </tbody>
      </table>
    );
  };

  const EquipmentsRenderTable = () => {
    // Initialize a variable to hold the overall total for each equipment column
    const columnTotals = Array(equipmentNames.length).fill(0);

    return (
      <table className="min-w-full bg-white border border-gray-300 shadow-md rounded-lg">
        <thead className="bg-green-300 text-sm font-bold text-black">
          <tr>
            <th className="border px-4 py-2">Course</th>
            {equipmentNames.map((name, index) => (
              <th key={index} className="border px-4 py-2">
                {name}
              </th>
            ))}
            <th className="border px-4 py-2">TOTAL NBM</th>
          </tr>
        </thead>
        <tbody>
          {courses.map((course, idx) => {
            let totalNBM = 0; // Initialize the total for the current course

            return (
              <tr
                key={idx}
                className="text-sm hover:bg-gray-100 transition-colors text-black"
              >
                <td className="border px-4 py-2">{course.description}</td>
                {equipmentNames.map((equipmentName, equipmentIdx) => {
                  // Create a key for fetching equipment counts based on course description and equipment name
                  const key = `${course.description} - ${equipmentName}`;

                  // Get the count for this course and equipment, default to 0 if not found
                  const count = equipmentCounts[key] || 0;

                  // Add the current equipment count to the course total and the column total
                  totalNBM += count;
                  columnTotals[equipmentIdx] += count;

                  return (
                    <td
                      key={`equipment-${equipmentIdx}`}
                      className="border px-4 py-2 text-center"
                    >
                      {count}
                    </td>
                  );
                })}
                <td className="border px-4 py-2 text-center font-bold">
                  {totalNBM}
                </td>
              </tr>
            );
          })}
          {/* Overall Total Row */}
          <tr className="font-bold text-black bg-green-100">
            <td className="border px-4 py-2 text-center">Overall Total</td>
            {columnTotals.map((total, index) => (
              <td
                key={`overall-total-${index}`}
                className="border px-4 py-2 text-center"
              >
                {total}
              </td>
            ))}
            <td className="border px-4 py-2 text-center font-bold">
              {columnTotals.reduce((sum, total) => sum + total, 0)}
            </td>
          </tr>
        </tbody>
      </table>
    );
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

  const downloadEquipmentPDF = async () => {
    if (reportRef.current) {
      try {
        const canvas = await html2canvas(reportRef.current, {
          useCORS: true,
          backgroundColor: "#ffffff",
          allowTaint: true,
        });
        const imgData = canvas.toDataURL("image/png");
        const pdf = new jsPDF();

        const imgWidth = 190;
        const imgHeight = (canvas.height * imgWidth) / canvas.width;
        const pageHeight = pdf.internal.pageSize.height;
        let heightLeft = imgHeight;

        let position = 0;

        // Set font to bold and smaller size
        pdf.setFont("Arial", "bold");
        pdf.setFontSize(10); // Adjust size as needed

        // Center the header text
        const centerX = pdf.internal.pageSize.getWidth() / 2;

        // Get the current date
        const currentDate = new Date().toLocaleDateString(); // Format as needed

        // Add header text with spacing
        const headerYStart = 10;
        const headerSpacing = 5; // Adjust spacing as needed
        const dateSpacing = 10; // Space between date and image

        pdf.text("Saint Columban College", centerX, headerYStart, {
          align: "center",
        });
        pdf.text("Pagadian City", centerX, headerYStart + headerSpacing, {
          align: "center",
        });
        pdf.text(
          "Learning Commons",
          centerX,
          headerYStart + headerSpacing * 2,
          { align: "center" }
        );
        pdf.text(
          "Saint Therese Building",
          centerX,
          headerYStart + headerSpacing * 3,
          { align: "center" }
        );
        pdf.text(
          "Daily Statistics on Non-Book Materials",
          centerX,
          headerYStart + headerSpacing * 4,
          { align: "center" }
        );

        // Add date aligned to the left with spacing
        pdf.text(`Date: ${currentDate}`, 10, headerYStart + headerSpacing * 6, {
          align: "left",
        });

        // Center the image of the table with additional spacing
        const imgX = (pdf.internal.pageSize.getWidth() - imgWidth) / 2;
        pdf.addImage(
          imgData,
          "PNG",
          imgX,
          headerYStart + headerSpacing * 5 + dateSpacing,
          imgWidth,
          imgHeight
        );
        heightLeft -= pageHeight;

        while (heightLeft >= 0) {
          position = heightLeft - imgHeight;

          // Repeat the header text on each page
          pdf.setFont("Arial", "bold"); // Ensure font is bold on each page
          pdf.setFontSize(10); // Ensure font size is consistent

          pdf.text("Saint Columban College", centerX, headerYStart, {
            align: "center",
          });
          pdf.text("Pagadian City", centerX, headerYStart + headerSpacing, {
            align: "center",
          });
          pdf.text(
            "Learning Commons",
            centerX,
            headerYStart + headerSpacing * 2,
            { align: "center" }
          );
          pdf.text(
            "Saint Therese Building",
            centerX,
            headerYStart + headerSpacing * 3,
            { align: "center" }
          );
          pdf.text(
            "Daily Statistics on Non-Book Materials",
            centerX,
            headerYStart + headerSpacing * 4,
            { align: "center" }
          );

          // Add the date again on the new page
          pdf.text(
            `Date: ${currentDate}`,
            10,
            headerYStart + headerSpacing * 5,
            { align: "left" }
          );

          pdf.addImage(imgData, "PNG", imgX, position, imgWidth, imgHeight);
          heightLeft -= pageHeight;
        }

        pdf.save("equipmentReport.pdf");
      } catch (error) {
        console.error("Error generating PDF:", error);
      }
    }
  };

  const downloadMalePDF = async () => {
    if (reportRef.current) {
      try {
        const canvas = await html2canvas(reportRef.current, {
          useCORS: true,
          backgroundColor: "#ffffff",
          allowTaint: true,
        });
        const imgData = canvas.toDataURL("image/png");
        const pdf = new jsPDF();

        const imgWidth = 190;
        const imgHeight = (canvas.height * imgWidth) / canvas.width;
        const pageHeight = pdf.internal.pageSize.height;
        let heightLeft = imgHeight;

        let position = 0;

        // Set font to bold and smaller size
        pdf.setFont("Arial", "bold");
        pdf.setFontSize(10); // Adjust size as needed

        // Get the current date
        const currentDate = new Date().toLocaleDateString(); // Format as needed

        // Center the header text
        const centerX = pdf.internal.pageSize.getWidth() / 2;

        // Add header text with spacing
        const headerYStart = 10;
        const headerSpacing = 5; // Adjust spacing as needed

        pdf.text("Saint Columban College", centerX, headerYStart, {
          align: "center",
        });
        pdf.text("Pagadian City", centerX, headerYStart + headerSpacing, {
          align: "center",
        });
        pdf.text(
          "Learning Commons",
          centerX,
          headerYStart + headerSpacing * 2,
          { align: "center" }
        );
        pdf.text(
          "Saint Therese Building",
          centerX,
          headerYStart + headerSpacing * 3,
          { align: "center" }
        );
        pdf.text(
          "Daily Statistics on Conference / Collaboratory / Tutoring Room",
          centerX,
          headerYStart + headerSpacing * 4,
          { align: "center" }
        );

        // Add date aligned to the left with spacing
        pdf.text(`Date: ${currentDate}`, 10, headerYStart + headerSpacing * 6, {
          align: "left",
        });

        // Add Male Students title below the date
        const maleStudentsTitleY = headerYStart + headerSpacing * 6; // Adjust Y position as needed

        // Center the image of the table
        const imgX = (pdf.internal.pageSize.getWidth() - imgWidth) / 2;
        pdf.addImage(
          imgData,
          "PNG",
          imgX,
          maleStudentsTitleY + headerSpacing,
          imgWidth,
          imgHeight
        ); // Adjust for spacing after title
        heightLeft -= pageHeight;

        while (heightLeft >= 0) {
          position = heightLeft - imgHeight;

          // Repeat the header text on each page
          pdf.setFont("Arial", "bold"); // Ensure font is bold on each page
          pdf.setFontSize(10); // Ensure font size is consistent

          pdf.text("Saint Columban College", centerX, headerYStart, {
            align: "center",
          });
          pdf.text("Pagadian City", centerX, headerYStart + headerSpacing, {
            align: "center",
          });
          pdf.text(
            "Learning Commons",
            centerX,
            headerYStart + headerSpacing * 2,
            { align: "center" }
          );
          pdf.text(
            "Saint Therese Building",
            centerX,
            headerYStart + headerSpacing * 3,
            { align: "center" }
          );
          pdf.text(
            "Daily Statistics on Non-Book Materials",
            centerX,
            headerYStart + headerSpacing * 4,
            { align: "center" }
          );

          // Add the date again on the new page
          pdf.text(
            `Date: ${currentDate}`,
            10,
            headerYStart + headerSpacing * 5,
            { align: "left" }
          );
          pdf.text("Male Students", centerX, maleStudentsTitleY, {
            align: "center",
          });

          pdf.addImage(imgData, "PNG", imgX, position, imgWidth, imgHeight);
          heightLeft -= pageHeight;
        }

        pdf.save("roomsMale.pdf");
      } catch (error) {
        console.error("Error generating PDF:", error);
      }
    }
  };

  const downloadFemalePDF = async () => {
    if (reportRef.current) {
      try {
        const canvas = await html2canvas(reportRef.current, {
          useCORS: true,
          backgroundColor: "#ffffff",
          allowTaint: true,
        });
        const imgData = canvas.toDataURL("image/png");
        const pdf = new jsPDF();

        const imgWidth = 190;
        const imgHeight = (canvas.height * imgWidth) / canvas.width;
        const pageHeight = pdf.internal.pageSize.height;
        let heightLeft = imgHeight;

        let position = 0;

        // Set font to bold and smaller size
        pdf.setFont("Arial", "bold");
        pdf.setFontSize(10); // Adjust size as needed

        // Get the current date
        const currentDate = new Date().toLocaleDateString(); // Format as needed

        // Center the header text
        const centerX = pdf.internal.pageSize.getWidth() / 2;

        // Add header text with spacing
        const headerYStart = 10;
        const headerSpacing = 5; // Adjust spacing as needed

        pdf.text("Saint Columban College", centerX, headerYStart, {
          align: "center",
        });
        pdf.text("Pagadian City", centerX, headerYStart + headerSpacing, {
          align: "center",
        });
        pdf.text(
          "Learning Commons",
          centerX,
          headerYStart + headerSpacing * 2,
          { align: "center" }
        );
        pdf.text(
          "Saint Therese Building",
          centerX,
          headerYStart + headerSpacing * 3,
          { align: "center" }
        );
        pdf.text(
          "Daily Statistics on Conference / Collaboratory / Tutoring Room",
          centerX,
          headerYStart + headerSpacing * 4,
          { align: "center" }
        );

        // Add date aligned to the left with spacing
        pdf.text(`Date: ${currentDate}`, 10, headerYStart + headerSpacing * 6, {
          align: "left",
        });

        // Add Male Students title below the date
        const femaleStudentTitleY = headerYStart + headerSpacing * 6; // Adjust Y position as needed

        // Center the image of the table
        const imgX = (pdf.internal.pageSize.getWidth() - imgWidth) / 2;
        pdf.addImage(
          imgData,
          "PNG",
          imgX,
          femaleStudentTitleY + headerSpacing,
          imgWidth,
          imgHeight
        ); // Adjust for spacing after title
        heightLeft -= pageHeight;

        while (heightLeft >= 0) {
          position = heightLeft - imgHeight;

          // Repeat the header text on each page
          pdf.setFont("Arial", "bold"); // Ensure font is bold on each page
          pdf.setFontSize(10); // Ensure font size is consistent

          pdf.text("Saint Columban College", centerX, headerYStart, {
            align: "center",
          });
          pdf.text("Pagadian City", centerX, headerYStart + headerSpacing, {
            align: "center",
          });
          pdf.text(
            "Learning Commons",
            centerX,
            headerYStart + headerSpacing * 2,
            { align: "center" }
          );
          pdf.text(
            "Saint Therese Building",
            centerX,
            headerYStart + headerSpacing * 3,
            { align: "center" }
          );
          pdf.text(
            "Daily Statistics on Non-Book Materials",
            centerX,
            headerYStart + headerSpacing * 4,
            { align: "center" }
          );

          pdf.addImage(imgData, "PNG", imgX, position, imgWidth, imgHeight);
          heightLeft -= pageHeight;
        }

        pdf.save("roomsFemale.pdf");
      } catch (error) {
        console.error("Error generating PDF:", error);
      }
    }
  };

  const resetBtnFemale = async () => {
    deleteFemaleRoomsReportFromDatabase();
  };

  const resetBtnMale = async () => {
    deleteMaleRoomsReportFromDatabase();
  };

  const resetBtnEquipment = async () => {
    deleteEquipmentReportFromDatabase();
  };

  const deleteFemaleRoomsReportFromDatabase = async () => {
    const currentDate = new Date().toISOString().split("T")[0]; // Format: YYYY-MM-DD
    const reportPath = `reportsTable/rooms/${currentDate}`; // Path to all reports
    const reportRef = ref(db, reportPath); // Create a reference to the reports

    try {
      const snapshot = await get(reportRef); // Get all reports
      if (snapshot.exists()) {
        const reports: Record<string, Report> = snapshot.val(); // Specify the type of reports

        // Loop through reports and delete those with gender of female
        for (const reportId in reports) {
          if (reports[reportId].gender === "female") {
            const reportToDeleteRef = ref(db, `${reportPath}/${reportId}`); // Create a reference to the specific report
            await remove(reportToDeleteRef); // Remove the report
          }
        }

        console.log("Female reports successfully deleted from the database.");
      } else {
        console.log("No reports found.");
      }
    } catch (error) {
      console.error("Error deleting reports from the database:", error);
    }
  };

  const deleteMaleRoomsReportFromDatabase = async () => {
    const currentDate = new Date().toISOString().split("T")[0]; // Format: YYYY-MM-DD
    const reportPath = `reportsTable/rooms/${currentDate}`; // Path to all reports
    const reportRef = ref(db, reportPath); // Create a reference to the reports

    try {
      const snapshot = await get(reportRef); // Get all reports
      if (snapshot.exists()) {
        const reports: Record<string, Report> = snapshot.val(); // Specify the type of reports

        // Loop through reports and delete those with gender of female
        for (const reportId in reports) {
          if (reports[reportId].gender === "male") {
            const reportToDeleteRef = ref(db, `${reportPath}/${reportId}`); // Create a reference to the specific report
            await remove(reportToDeleteRef); // Remove the report
          }
        }

        console.log("Female reports successfully deleted from the database.");
      } else {
        console.log("No reports found.");
      }
    } catch (error) {
      console.error("Error deleting reports from the database:", error);
    }
  };

  const deleteEquipmentReportFromDatabase = async () => {
    const reportPath = `reportsTable/equipments`; // Construct the path
    const reportRef = ref(db, reportPath); // Create a reference to the report

    try {
      await remove(reportRef); // Remove the report
    } catch (error) {
      console.error("Error deleting report from the database:");
    }
  };

  const openModalEquipment = () => {
    setIsModalOpenEquipment(true);
  };

  const openModalMale = () => {
    setIsModalOpenMale(true);
  };

  const openModalFemale = () => {
    setIsModalOpenFemale(true);
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
            <li className="mb-4 bg-green-800 border-2 border-green-600 rounded-full p-1">
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

      <main className="flex-1 p-6 bg-white overflow-auto max-h-screen">
        <div className="flex justify-between mb-4">
          <div className="tabs">
            <a
              onClick={() => setActiveTab("rooms")}
              className={`tab tab-bordered ${
                activeTab === "rooms"
                  ? "tab-active bg-gray-300 border rounded-md content-center"
                  : ""
              } text-xl font-bold text-black`}
            >
              Rooms
            </a>
            <a
              onClick={() => setActiveTab("equipments")}
              className={`tab tab-bordered ${
                activeTab === "equipments"
                  ? "tab-active bg-gray-300 rounded-md content-center"
                  : ""
              } text-xl font-bold text-black`}
            >
              Equipments
            </a>
          </div>
        </div>

        {activeTab === "rooms" && (
          <div>
            <div className="flex space-x-4 mb-4">
              <button
                onClick={() => setActiveGenderTab("male")}
                className={`px-4 py-2 rounded-lg font-bold ${
                  activeGenderTab === "male"
                    ? "bg-black text-white"
                    : "bg-gray-200 text-black"
                }`}
              >
                Male
              </button>
              <button
                onClick={() => setActiveGenderTab("female")}
                className={`px-4 py-2 rounded-lg font-bold ${
                  activeGenderTab === "female"
                    ? "bg-pink-400 text-white"
                    : "bg-gray-200 text-black"
                }`}
              >
                Female
              </button>
            </div>

            <h2 className="text-xl font-bold text-center mb-4 text-black">
              {currentDateFormatted}
            </h2>

            <div ref={reportRef}>
              <h2 className="text-2xl font-bold mb-4 text-black">
                {activeGenderTab === "male"
                  ? "Male Students"
                  : "Female Students"}
              </h2>
              {RoomsRenderTable()}{" "}
              {/* Ensure this table shows the correct data based on the activeGenderTab */}
            </div>

            <div className="flex space-x-4 mt-6">
              {activeGenderTab === "male" && (
                <>
                  <button
                    onClick={downloadMalePDF} // Function to download male students PDF
                    className="px-4 py-2 rounded-lg font-bold  bg-red-600 text-white"
                  >
                    Download
                  </button>
                  <button
                    className="px-4 py-2 rounded-lg font-bold  bg-blue-600 text-white"
                    onClick={() => openModalMale()}
                  >
                    Reset
                  </button>
                </>
              )}
              {activeGenderTab === "female" && (
                <>
                  <button
                    onClick={downloadFemalePDF} // Function to download female students PDF
                    className="px-4 py-2 rounded-lg font-bold  bg-red-600 text-white"
                  >
                    Download
                  </button>
                  <button
                    className="px-4 py-2 rounded-lg font-bold  bg-blue-600 text-white"
                    onClick={() => openModalFemale()}
                  >
                    Reset
                  </button>
                </>
              )}
            </div>
          </div>
        )}

        {activeTab === "equipments" && (
          <div>
            <h2 className="text-xl font-bold text-center mb-7 text-black">
              {currentDateFormatted}
            </h2>
            <div ref={reportRef}>{EquipmentsRenderTable()}</div>
            <button
              className="px-4 py-2 rounded-lg font-bold bg-red-600 text-white mt-6"
              onClick={downloadEquipmentPDF}
            >
              Download
            </button>
            <button
              className="ml-4 px-4 py-2 rounded-lg font-bold bg-blue-600 text-white mt-6"
              onClick={() => openModalEquipment()}
            >
              Reset
            </button>
          </div>
        )}
      </main>

      {/* Delete/Reset Equipment Confirmation Modal */}
      {isModalOpenEquipment && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50 text-black">
          <div className="bg-white p-6 rounded-lg shadow-lg max-w-sm">
            <h2 className="text-lg font-bold mb-4">
              Are you sure you want to reset the table?
            </h2>
            <div className="flex justify-end">
              <button
                onClick={resetBtnEquipment} // Confirm and delete the booking
                className="py-1 px-3 bg-black text-white rounded hover:bg-red-600 font-bold"
              >
                Reset
              </button>
              <button
                onClick={() => setIsModalOpenEquipment(false)} // Close the modal
                className="ml-4 py-1 px-3 bg-gray-300 rounded hover:bg-gray-400 font-bold"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete/Reset Male Confirmation Modal */}
      {isModalOpenMale && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50 text-black">
          <div className="bg-white p-6 rounded-lg shadow-lg max-w-sm">
            <h2 className="text-lg font-bold mb-4">
              Are you sure you want to reset the table?
            </h2>
            <div className="flex justify-end">
              <button
                onClick={resetBtnMale} // Confirm and delete the booking
                className="py-1 px-3 bg-black text-white rounded hover:bg-red-600 font-bold"
              >
                Reset
              </button>
              <button
                onClick={() => setIsModalOpenMale(false)} // Close the modal
                className="ml-4 py-1 px-3 bg-gray-300 rounded hover:bg-gray-400 font-bold"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete/Reset Female Confirmation Modal */}
      {isModalOpenFemale && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50 text-black">
          <div className="bg-white p-6 rounded-lg shadow-lg max-w-sm">
            <h2 className="text-lg font-bold mb-4">
              Are you sure you want to reset the table?
            </h2>
            <div className="flex justify-end">
              <button
                onClick={resetBtnFemale} // Confirm and delete the booking
                className="py-1 px-3 bg-black text-white rounded hover:bg-red-600 font-bold"
              >
                Reset
              </button>
              <button
                onClick={() => setIsModalOpenFemale(false)} // Close the modal
                className="ml-4 py-1 px-3 bg-gray-300 rounded hover:bg-gray-400 font-bold"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default ReportsTable;
