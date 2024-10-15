import { Route, BrowserRouter as Router, Routes } from "react-router-dom";
import SignIn from "./Components/SignIn";
import Dashboard from "./Components/Pages/Dashboard";
import Rooms from "./Components/Pages/Rooms";
import AddRoom from "./Components/Pages/AddRoom";
import AvailableRoom from "./Components/Pages/AvailableRoom";
import BookRoom from "./Components/Pages/BookRoom";
import Reports from "./Components/Pages/Reports";
import UserDashboard from "./Components/Pages/UserDashboard";
import UserAvailableRoom from "./Components/Pages/UserAvailableRoom";
import UserBookRoom from "./Components/Pages/UserBookRoom";
import ImcAvr from "./Components/Pages/imcAvr";
import UserImcAvr from "./Components/Pages/UserImcAvr";
import Equipments from "./Components/Pages/Equipments";
import AddEquipments from "./Components/Pages/AddEquipments";
import AvailableEquipments from "./Components/Pages/AvailableEquipments";
import BookEquipments from "./Components/Pages/BookEquipments";
import UserBookEquipments from "./Components/Pages/UserBookEquipments";
import UserAvailableEquipments from "./Components/Pages/UserAvailableEquipments";
import AddTable from "./Components/Pages/AddTable";
import TutoringAvailableTable from "./Components/Pages/TutoringTable/TutoringAvailableTable";
import TutoringBookTable from "./Components/Pages/TutoringTable/TutoringBookTable";
import UserTutoringAvailableTable from "./Components/Pages/UserTutoringTable/UserTutoringAvailableTable";
import UserTutoringBookTable from "./Components/Pages/UserTutoringTable/UserTutoringBookTable";
import QrCode from "./Components/Pages/QrCode";
import Reschedule from "./Components/Pages/Reschedule";
import Courses from "./Components/Pages/Courses";
import AddCourses from "./Components/Pages/AddCourses";
import ReportsTable from "./Components/Pages/ReportsTable";
import LoginHistory from "./Components/Pages/LoginHistory";
import UserTransactionHistory from "./Components/Pages/UserTransactionHistory";
import UserBookBorrow from "./Components/Pages/UserBookBorrow";
import UserFAQ from "./Components/Pages/UserFAQ";
import UserGuidelinesAndPrivacy from "./Components/Pages/UserGuidelinesAndPrivacy";
import BookBorrow from "./Components/Pages/BookBorrow";

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/signin" element={<SignIn />} />
        <Route path="/LoginHistory" element={<LoginHistory />} />
        <Route path="/Dashboard" element={<Dashboard />} />
        <Route path="/Rooms" element={<Rooms />} />
        <Route path="/AddRoom" element={<AddRoom />} />
        <Route path="/AvailableRoom" element={<AvailableRoom />} />
        <Route path="/BookRoom" element={<BookRoom />} />
        <Route path="/Reports" element={<Reports />} />
        <Route path="/UserDashboard" element={<UserDashboard />} />
        <Route path="/UserAvailableRoom" element={<UserAvailableRoom />} />
        <Route path="/UserBookRoom" element={<UserBookRoom />} />
        <Route path="/ImcAvr" element={<ImcAvr />} />
        <Route path="/UserImcAvr" element={<UserImcAvr />} />
        <Route path="/Equipments" element={<Equipments />} />
        <Route path="/AddEquipments" element={<AddEquipments />} />
        <Route path="/AvailableEquipments" element={<AvailableEquipments />} />
        <Route path="/BookEquipments" element={<BookEquipments />} />
        <Route path="/UserBookEquipments" element={<UserBookEquipments />} />
        <Route
          path="/UserAvailableEquipments"
          element={<UserAvailableEquipments />}
        />
        <Route path="/AddTable" element={<AddTable />} />

        <Route
          path="/TutoringAvailableTable"
          element={<TutoringAvailableTable />}
        />
        <Route path="/TutoringBookTable" element={<TutoringBookTable />} />

        <Route
          path="/UserTutoringAvailableTable"
          element={<UserTutoringAvailableTable />}
        />
        <Route
          path="/UserTutoringBookTable"
          element={<UserTutoringBookTable />}
        />
        <Route path="/QrCode" element={<QrCode />} />
        <Route path="/Reschedule" element={<Reschedule />} />
        <Route path="/Courses" element={<Courses />} />
        <Route path="/AddCourses" element={<AddCourses />} />
        <Route path="/ReportsTable" element={<ReportsTable />} />
        <Route
          path="/UserTransactionHistory"
          element={<UserTransactionHistory />}
        />
        <Route path="/UserBookBorrow" element={<UserBookBorrow />} />
        <Route path="/UserFAQ" element={<UserFAQ />} />
        <Route
          path="/UserGuidelinesAndPrivacy"
          element={<UserGuidelinesAndPrivacy />}
        />
        <Route path="/BookBorrow" element={<BookBorrow />} />

        <Route path="/" element={<SignIn />} />
      </Routes>
    </Router>
  );
}

export default App;
