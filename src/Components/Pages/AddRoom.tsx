import schoolLogo from "../../assets/scclogo.png";
import dashboardlogo from "../../assets/dashboardlogo.png";
import roomslogo from "../../assets/roomslogo.png";
import equipmentslogo from "../../assets/equipmentslogo.png";
import reportslogo from "../../assets/reportslogo.png";
import { initializeApp } from "firebase/app";
import { getDatabase, push, ref as dbRef, set } from "firebase/database";
import {
  getDownloadURL,
  ref as storageRef,
  uploadBytes,
} from "firebase/storage";
import { getStorage } from "firebase/storage";
import React, { useState } from "react";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { useNavigate } from "react-router-dom";

function AddRoom() {
  const [description, setDescription] = useState<string>("");
  const [image, setImage] = useState<File | null>(null);
  const navigate = useNavigate();

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
  const storage = getStorage(app);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    try {
      let imageUrl = "";
      let availability = true;

      if (image && description) {
        // Sanitize description for use in a path
        const sanitizedDescription = description.replace(/[^a-zA-Z0-9]/g, "_");

        // Upload image to Firebase Storage
        const imageStorageRef = storageRef(
          storage,
          `rooms/${sanitizedDescription}/${image.name}`
        );
        await uploadBytes(imageStorageRef, image);
        imageUrl = await getDownloadURL(imageStorageRef);
      }

      // Add room details to Realtime Database
      const roomsRef = dbRef(db, "rooms");
      const newRoomRef = push(roomsRef);
      await set(newRoomRef, {
        description,
        imageUrl,
        availability,
      });

      // Reset form
      setDescription("");
      setImage(null);
      toast.success("Room added successful!");
      setTimeout(() => {
        navigate("/Rooms");
      }, 2000);
    } catch (error) {
      console.error("Error adding room: ", error);
      alert("Error adding room, please try again.");
    }
  };

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
        <div className="flex justify-center items-center min-h-full">
          <div className="w-full max-w-md p-8 space-y-6 bg-white rounded shadow-lg">
            <h1 className="text-2xl font-bold text-center text-black">
              New Room
            </h1>
            <p className="text-center text-gray-500 mt-0">Create room</p>
            <form className="space-y-4" onSubmit={handleSubmit}>
              <div>
                <label className="block text-sm font-bold text-black">
                  Room details
                </label>
                <p className="text-gray-500">Provide room information</p>
              </div>
              <div>
                <label
                  className="block text-sm font-bold text-black"
                  htmlFor="description"
                >
                  Description
                </label>
                <input
                  type="text"
                  id="description"
                  placeholder="e.g. Conference Room"
                  className="input input-bordered w-full border-gray-400 bg-white text-black mt-2"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                />
              </div>
              <div>
                <label
                  className="block text-sm font-bold text-black"
                  htmlFor="image"
                >
                  Image
                </label>
                <input
                  type="file"
                  id="image"
                  className="block w-full mt-2 text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-black file:text-white hover:file:bg-gray-700"
                  onChange={(e) => {
                    if (e.target.files && e.target.files[0]) {
                      setImage(e.target.files[0]);
                    }
                  }}
                />
              </div>
              <div>
                <button
                  type="submit"
                  className="btn btn-black w-full text-white"
                >
                  Submit
                </button>
              </div>
            </form>
          </div>
        </div>
      </main>
      <ToastContainer />
    </div>
  );
}

export default AddRoom;
