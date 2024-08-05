import { Route, BrowserRouter as Router, Routes } from "react-router-dom";
import SignIn from "./Components/SignIn";
import Dashboard from "./Components/Pages/Dashboard";
import Rooms from "./Components/Pages/Rooms";
import AddRoom from "./Components/Pages/AddRoom";
import AvailableRoom from "./Components/Pages/AvailableRoom";
import BookRoom from "./Components/Pages/BookRoom";
import Reports from "./Components/Pages/Reports";
import UserBook from "./Components/Pages/UserBook";
import UserAvailableRoom from "./Components/Pages/UserAvailableRoom";
import UserBookRoom from "./Components/Pages/UserBookRoom";
import ImcAvr from "./Components/Pages/imcAvr";
import UserImcAvr from "./Components/Pages/UserImcAvr";

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/signin" element={<SignIn />} />
        <Route path="/Dashboard" element={<Dashboard />} />
        <Route path="/Rooms" element={<Rooms />} />
        <Route path="/AddRoom" element={<AddRoom />} />
        <Route path="/AvailableRoom" element={<AvailableRoom />} />
        <Route path="/BookRoom" element={<BookRoom />} />
        <Route path="/Reports" element={<Reports />} />
        <Route path="/UserBook" element={<UserBook />} />
        <Route path="/UserAvailableRoom" element={<UserAvailableRoom />} />
        <Route path="/UserBookRoom" element={<UserBookRoom />} />
        <Route path="/ImcAvr" element={<ImcAvr />} />
        <Route path="/UserImcAvr" element={<UserImcAvr />} />

        <Route path="/" element={<SignIn />} />
      </Routes>
    </Router>
  );
}

export default App;
