import schoolLogo from "../../assets/scclogo.png";
import dashboardlogo from "../../assets/dashboardlogo.png";
import historyLogo from "../../assets/reportslogo.png";
import borrowLogo from "../../assets/borrowicon.png";
import faqLogo from "../../assets/faqlogo.png";
import guidelinesLogo from "../../assets/guidelineslogo.png";
import { useNavigate } from "react-router-dom";

function UserBookBorrow() {
  const navigate = useNavigate();

  const handleRoomsClick = () => {
    navigate("/UserAvailableRoom");
  };

  const handleBorrowClick = () => {
    navigate("/UserAvailableEquipments");
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
                href="/UserDashboard"
                className="flex items-center p-2 hover:bg-gray-300 rounded-md"
              >
                <img src={dashboardlogo} alt="Dashboard" className="h-6 w-6" />
                <span className="ml-2 text-black font-bold">Dashboard</span>
              </a>
            </li>
            <li className="mb-4 bg-gray-200 border-2 border-gray-200 rounded-full p-1">
              <a
                href="/UserBookBorrow"
                className="flex items-center p-2 hover:bg-gray-300 rounded-md"
              >
                <img src={borrowLogo} alt="Borrow" className="h-6 w-6" />
                <span className="ml-2 text-black font-bold">Book/Borrow</span>
              </a>
            </li>
            <li className="mb-4">
              <a
                href="/UserTransactionHistory"
                className="flex items-center p-2 hover:bg-gray-300 rounded-md"
              >
                <img
                  src={historyLogo}
                  alt="Transaction History"
                  className="h-6 w-6"
                />
                <span className="ml-2 text-black font-bold">
                  Transaction History
                </span>
              </a>
            </li>
            <li className="mb-4">
              <a
                href="/UserFAQ"
                className="flex items-center p-2 hover:bg-gray-300 rounded-md"
              >
                <img src={faqLogo} alt="Dashboard" className="h-6 w-6" />
                <span className="ml-2 text-black font-bold">FAQ</span>
              </a>
            </li>
            <li className="mb-4">
              <a
                href="/UserGuidelinesAndPrivacy"
                className="flex items-center p-2 hover:bg-gray-300 rounded-md"
              >
                <img src={guidelinesLogo} alt="Dashboard" className="h-6 w-6" />
                <span className="ml-2 text-black font-bold">
                  Guidelines and Privacy
                </span>
              </a>
            </li>
          </ul>
        </nav>
      </aside>
      <main className="flex-1 p-6 bg-white flex items-center justify-center">
        <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-6 mb-6">
          <div className="card bg-white shadow-lg p-6 rounded-lg transition-transform transform hover:scale-105 flex flex-col items-center mr-6">
            <h2 className="text-lg text-black mb-2 font-semibold">Book</h2>
            <p className="mb-4 text-black text-3xl font-bold">Rooms</p>
            <button
              onClick={handleRoomsClick}
              className="btn text-white font-bold mt-2 w-3/4 bg-green-700 hover:bg-black rounded-lg transition duration-200"
            >
              Proceed
            </button>
          </div>
          <div className="card bg-white shadow-lg p-6 rounded-lg transition-transform transform hover:scale-105 flex flex-col items-center ml-6">
            <h2 className="text-lg text-black mb-2 font-semibold">Borrow</h2>
            <p className="mb-4 text-black text-3xl font-bold">Equipments</p>
            <button
              className="btn text-white font-bold mt-2 w-3/4 bg-green-700 hover:bg-black rounded-lg transition duration-200"
              onClick={handleBorrowClick}
            >
              Proceed
            </button>
          </div>
        </section>
      </main>
    </div>
  );
}

export default UserBookBorrow;
