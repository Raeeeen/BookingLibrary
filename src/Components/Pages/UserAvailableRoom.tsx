import React, { useEffect, useState } from "react";
import { initializeApp, FirebaseApp } from "firebase/app";
import {
  getDatabase,
  ref as dbRef,
  onValue,
  Database,
} from "firebase/database";
import schoolLogo from "../../assets/scclogo.png";
import dashboardlogo from "../../assets/dashboardlogo.png";
import { useNavigate } from "react-router-dom";

// Define a type for the RoomCard props
interface RoomCardProps {
  title: string;
  image: string;
  onBook: () => void;
}

interface Room {
  title: string;
  imageUrl: string;
  available: boolean;
}

const UserAvailableRoom: React.FC = () => {
  const [filter, setFilter] = useState<"Available" | "Not Available">(
    "Available"
  );
  const [rooms, setRooms] = useState<Room[]>([]);
  const navigate = useNavigate();

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
  const app: FirebaseApp = initializeApp(firebaseConfig);
  const db: Database = getDatabase(app);

  useEffect(() => {
    const roomsRef = dbRef(db, "rooms");

    onValue(roomsRef, (snapshot) => {
      const data = snapshot.val();
      const roomArray: Room[] = [];

      for (const key in data) {
        const room = data[key];
        roomArray.push({
          title: room.description,
          imageUrl: room.imageUrl,
          available: room.availability,
        });
      }

      console.log("Fetched rooms:", roomArray);
      setRooms(roomArray);
    });
  }, [db]);

  const handleBookClick = (roomTitle: string) => {
    navigate("/UserBookRoom", { state: { roomTitle } });
  };

  // Update the RoomCard component to use the defined types
  const RoomCard: React.FC<RoomCardProps> = ({ title, image, onBook }) => (
    <div className="card bg-white shadow-xl">
      <figure>
        <img src={image} alt={title} />
      </figure>
      <div className="card-body">
        <h2 className="card-title text-black font-bold">{title}</h2>
        <div className="card-actions justify-end">
          <button onClick={onBook} className="btn bg-black text-white">
            Book
          </button>
          <button className="btn btn-accent">View Bookings</button>
        </div>
      </div>
    </div>
  );

  const filteredRooms = rooms.filter((room) =>
    filter === "Available" ? room.available : !room.available
  );

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
            <li className="mb-4 bg-gray-200 border-2 border-gray-200 rounded-full p-1">
              <a
                href="/UserBook"
                className="flex items-center p-2 hover:bg-gray-300 rounded-md"
              >
                <img src={dashboardlogo} alt="Dashboard" className="h-6 w-6" />
                <span className="ml-2 text-black font-bold">BOOK ROOM</span>
              </a>
            </li>
          </ul>
        </nav>
      </aside>
      <main className="flex-1 p-6 bg-white h-screen overflow-y-auto">
        <div className="container mx-auto p-4">
          <h1 className="text-2xl font-bold mb-4 text-black">Rooms</h1>
          <div className="mb-4 flex space-x-4">
            <button
              className={`btn ${
                filter === "Available" ? "btn-accent text-white" : ""
              }`}
              onClick={() => setFilter("Available")}
            >
              Available
            </button>
            <button
              className={`btn ${
                filter === "Not Available" ? "btn-accent text-white" : ""
              }`}
              onClick={() => setFilter("Not Available")}
            >
              Not Available
            </button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredRooms.map((room, index) => (
              <RoomCard
                key={index}
                title={room.title}
                image={room.imageUrl}
                onBook={() => handleBookClick(room.title)}
              />
            ))}
          </div>
        </div>
      </main>
    </div>
  );
};

export default UserAvailableRoom;
