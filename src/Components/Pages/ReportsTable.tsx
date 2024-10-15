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

function ReportsTable() {
  const [activeTab, setActiveTab] = useState<"rooms" | "equipments">("rooms");
  const [activeGenderTab, setActiveGenderTab] = useState<"male" | "female">(
    "male"
  );
  const [equipmentNames, setEquipmentNames] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [courses, setCourses] = useState<string[]>([]);
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
    apiKey: "AIzaSyCHdD3lqfVXCO00zQcaWpZFpAqKfIIVnk8",
    authDomain: "library-7feb9.firebaseapp.com",
    databaseURL: "https://library-7feb9-default-rtdb.firebaseio.com",
    projectId: "library-7feb9",
    storageBucket: "library-7feb9.appspot.com",
    messagingSenderId: "977659880455",
    appId: "1:977659880455:web:f1c2a95baaace7f2caf6a2",
  };

  const app = initializeApp(firebaseConfig);
  const db = getDatabase(app);

  useEffect(() => {
    const currentDate = new Date().toISOString().split("T")[0];
    const roomsRef = ref(db, `reportsTable/rooms/${currentDate}`);

    const previousDate = new Date();
    previousDate.setDate(previousDate.getDate() - 1);
    const previousDateString = previousDate.toISOString().split("T")[0];
    const previousRoomsRef = ref(
      db,
      `reportsTable/rooms/${previousDateString}`
    );

    const countRooms = async (roomsData: any): Promise<Counts> => {
      const counts: Counts = {};
      const courseSet = new Set<string>(); // This should be declared here

      if (roomsData) {
        for (const roomId in roomsData) {
          const room = roomsData[roomId];
          const startHour = new Date(`1970-01-01T${room.startTime}`).getHours();
          const courseIds = room.course;

          // Fetch course descriptions
          const courseDescriptions = await Promise.all(
            courseIds.map((courseId: any) =>
              get(ref(db, `courses/${courseId}`)).then((snapshot) => {
                const courseData = snapshot.val();
                return courseData ? courseData.description : null;
              })
            )
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

              // Check for duplicate entries before setting state
              setCourseDescriptionsList((prev) => {
                // Check if the course description already exists in the list
                const exists = prev.some(
                  (item) =>
                    item.description === courseDescription &&
                    item.time === time &&
                    item.room === roomName
                );
                // Only add if it doesn't exist
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

              // Increment counts based on room and gender
              if (roomName === "Conference Room") {
                console.log(
                  `Incrementing Conference counts for ${courseDescription} (${gender}, ${time})`
                );
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
                console.log(
                  `Incrementing Collaboratory counts for ${courseDescription} (${gender}, ${time})`
                );
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
                console.log(
                  `Incrementing Tutoring counts for ${courseDescription} (${gender}, ${time})`
                );
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

    // Fetch course names
    const unsubscribeCourses = onValue(coursesRef, (snapshot) => {
      const coursesData = snapshot.val();
      const loadedCourses: string[] = [];

      for (const courseId in coursesData) {
        const courseDescription = coursesData[courseId].description; // Access the description directly
        if (courseDescription) {
          loadedCourses.push(courseDescription);
        }
      }

      setLoading(false);
      setCourses(loadedCourses);
    });

    return () => {
      unsubscribeCourses();
    };
  }, []);

  useEffect(() => {
    const currentDate = new Date().toISOString().split("T")[0];
    const roomsRef = ref(db, `reportsTable/rooms/${currentDate}`);

    const unsubscribeRooms = onValue(roomsRef, (snapshot) => {
      const roomsData = snapshot.val();
      const loadedRoomData: any[] = [];
      let count = 0;

      if (roomsData) {
        for (const roomId in roomsData) {
          const room = roomsData[roomId];
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
    const currentDate = new Date().toISOString().split("T")[0];
    const roomsRef = ref(db, `reportsTable/rooms/${currentDate}`);

    const previousDate = new Date();
    previousDate.setDate(previousDate.getDate() - 1);
    const previousDateString = previousDate.toISOString().split("T")[0];
    const previousRoomsRef = ref(
      db,
      `reportsTable/rooms/${previousDateString}`
    );

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
      const roomsData = snapshot.val();
      const currentCounts = countRooms(roomsData);

      // Retrieve previous day's counts
      onValue(previousRoomsRef, (prevSnapshot) => {
        const previousData = prevSnapshot.val();
        const previousCounts = countRooms(previousData);

        // Combine current counts with previous counts
        const finalCounts = {
          conference: {
            male: {
              am:
                currentCounts.conference.male.am +
                previousCounts.conference.male.am,
              pm:
                currentCounts.conference.male.pm +
                previousCounts.conference.male.pm,
            },
            female: {
              am:
                currentCounts.conference.female.am +
                previousCounts.conference.female.am,
              pm:
                currentCounts.conference.female.pm +
                previousCounts.conference.female.pm,
            },
          },
          collaboratory: {
            male: {
              am:
                currentCounts.collaboratory.male.am +
                previousCounts.collaboratory.male.am,
              pm:
                currentCounts.collaboratory.male.pm +
                previousCounts.collaboratory.male.pm,
            },
            female: {
              am:
                currentCounts.collaboratory.female.am +
                previousCounts.collaboratory.female.am,
              pm:
                currentCounts.collaboratory.female.pm +
                previousCounts.collaboratory.female.pm,
            },
          },
          tutoring: {
            male: {
              am:
                currentCounts.tutoring.male.am +
                previousCounts.tutoring.male.am,
              pm:
                currentCounts.tutoring.male.pm +
                previousCounts.tutoring.male.pm,
            },
            female: {
              am:
                currentCounts.tutoring.female.am +
                previousCounts.tutoring.female.am,
              pm:
                currentCounts.tutoring.female.pm +
                previousCounts.tutoring.female.pm,
            },
          },
        };

        setRoomCounts(finalCounts);
      });
    });

    return () => {
      unsubscribeRooms();
    };
  }, []);

  useEffect(() => {
    const fetchEquipments = async () => {
      const currentDate = new Date().toISOString().split("T")[0]; // Format: YYYY-MM-DD

      try {
        const equipmentsSnapshot = await get(
          ref(db, `reportsTable/equipments/${currentDate}`)
        );
        const equipmentsData = equipmentsSnapshot.val() || {};

        // Reset counts for each course and equipment
        const counts: { [key: string]: number } = {}; // Flat structure

        // Loop through each equipment in the data
        for (const equipmentId in equipmentsData) {
          const equipment = equipmentsData[equipmentId];
          const equipmentName = equipment.equipmentName;
          const courseIds = equipment.course; // Assuming this is an array of course IDs

          // Fetch course descriptions
          const courseDescriptions = await Promise.all(
            courseIds.map((courseId: any) =>
              get(ref(db, `courses/${courseId}`)).then((snapshot) => {
                const courseData = snapshot.val();
                return courseData ? courseData.description : null;
              })
            )
          );

          courseDescriptions.forEach((courseDescription) => {
            if (courseDescription) {
              // Use a combined key of courseDescription and equipmentName
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

  const RoomsRenderTable = () => {
    const currentCounts: Partial<Record<keyof RoomCounts, TimeCounts>> =
      activeGenderTab === "male"
        ? {
            conference: {
              am: roomCounts.conference.male.am,
              pm: roomCounts.conference.male.pm,
            },
            collaboratory: {
              am: roomCounts.collaboratory.male.am,
              pm: roomCounts.collaboratory.male.pm,
            },
            tutoring: {
              am: roomCounts.tutoring.male.am,
              pm: roomCounts.tutoring.male.pm,
            },
          }
        : {
            conference: {
              am: roomCounts.conference.female.am,
              pm: roomCounts.conference.female.pm,
            },
            collaboratory: {
              am: roomCounts.collaboratory.female.am,
              pm: roomCounts.collaboratory.female.pm,
            },
            tutoring: {
              am: roomCounts.tutoring.female.am,
              pm: roomCounts.tutoring.female.pm,
            },
          };

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
            const conferenceCounts = currentCounts.conference || {
              am: 0,
              pm: 0,
            };
            const collaboratoryCounts = currentCounts.collaboratory || {
              am: 0,
              pm: 0,
            };
            const tutoringCounts = currentCounts.tutoring || { am: 0, pm: 0 };

            const courseData = courseDescriptionsList.some(
              (item) => item.description === course
            );

            const conferenceTotal = courseData
              ? conferenceCounts.am + conferenceCounts.pm
              : 0;
            const collaboratoryTotal = courseData
              ? collaboratoryCounts.am + collaboratoryCounts.pm
              : 0;
            const tutoringTotal = courseData
              ? tutoringCounts.am + tutoringCounts.pm
              : 0;

            return (
              <tr
                key={idx}
                className="text-sm hover:bg-gray-100 transition-colors text-black"
              >
                <td className="border px-4 py-2">{course}</td>
                <td className="border px-4 py-2 text-center">
                  {courseData ? conferenceCounts.am : 0}
                </td>
                <td className="border px-4 py-2 text-center">
                  {courseData ? conferenceCounts.pm : 0}
                </td>
                <td className="border px-4 py-2 text-center font-bold">
                  {conferenceTotal}
                </td>
                <td className="border px-4 py-2 text-center">
                  {courseData ? collaboratoryCounts.am : 0}
                </td>
                <td className="border px-4 py-2 text-center">
                  {courseData ? collaboratoryCounts.pm : 0}
                </td>
                <td className="border px-4 py-2 text-center font-bold">
                  {collaboratoryTotal}
                </td>
                <td className="border px-4 py-2 text-center">
                  {courseData ? tutoringCounts.am : 0}
                </td>
                <td className="border px-4 py-2 text-center">
                  {courseData ? tutoringCounts.pm : 0}
                </td>
                <td className="border px-4 py-2 text-center font-bold">
                  {" "}
                  {/* Ensure row for tutoring total */}
                  {tutoringTotal}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    );
  };

  const EquipmentsRenderTable = () => {
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
            <th className="border px-4 py-2">TOTAL NBM</th>{" "}
            {/* Add Total column */}
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
                <td className="border px-4 py-2">{course}</td>
                {equipmentNames.map((equipmentName, equipmentIdx) => {
                  // Create a key for fetching equipment counts based on course and equipment
                  const key = `${course} - ${equipmentName}`;

                  // Get the count for this course and equipment, default to 0 if not found
                  const count = equipmentCounts[key] || 0;

                  // Add the current equipment count to the total for the row
                  totalNBM += count;

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
                  {totalNBM} {/* Display the total for the current row */}
                </td>
              </tr>
            );
          })}
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
        await deleteEquipmentReportFromDatabase();
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
        await deleteMaleRoomsReportFromDatabase();
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
        await deleteFemaleRoomsReportFromDatabase();
      } catch (error) {
        console.error("Error generating PDF:", error);
      }
    }
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
                    <li className="mb-4">
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
            <li className="mb-4 bg-gray-200 border-2 border-gray-200 rounded-full p-1">
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
                <button
                  onClick={downloadMalePDF} // Function to download male students PDF
                  className="px-4 py-2 rounded-lg font-bold  bg-red-600 text-white"
                >
                  Download
                </button>
              )}
              {activeGenderTab === "female" && (
                <button
                  onClick={downloadFemalePDF} // Function to download female students PDF
                  className="px-4 py-2 rounded-lg font-bold  bg-red-600 text-white"
                >
                  Download
                </button>
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
          </div>
        )}
      </main>
    </div>
  );
}

export default ReportsTable;
