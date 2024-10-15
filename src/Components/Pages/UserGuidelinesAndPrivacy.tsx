import schoolLogo from "../../assets/scclogo.png";
import dashboardlogo from "../../assets/dashboardlogo.png";
import historyLogo from "../../assets/reportslogo.png";
import borrowLogo from "../../assets/borrowicon.png";
import faqLogo from "../../assets/faqlogo.png";
import guidelinesLogo from "../../assets/guidelineslogo.png";

function UserGuidelinesAndPrivacy() {
  return (
    <div className="min-h-screen flex flex-col md:flex-row">
      <aside className="w-full md:w-64 bg-green-800 p-4 h-screen overflow-y-auto scrollbar-hide">
        <div className="mb-8 flex justify-center">
          <img
            src={schoolLogo}
            alt="Logo"
            className="h-24 w-24 md:h-40 md:w-32 rounded-full" // Adjusted size for the logo
          />
        </div>
        <nav>
          <ul>
            <li className="mb-4">
              <a
                href="/UserDashboard"
                className="flex items-center p-2 hover:bg-green-600 rounded-md"
              >
                <img src={dashboardlogo} alt="Dashboard" className="h-6 w-6" />
                <span className="ml-2 text-white font-bold">Dashboard</span>
              </a>
            </li>
            <li className="mb-4">
              <a
                href="/UserBookBorrow"
                className="flex items-center p-2 hover:bg-green-600 rounded-md"
              >
                <img src={borrowLogo} alt="Book/Borrow" className="h-6 w-6" />
                <span className="ml-2 text-white font-bold">Book/Borrow</span>
              </a>
            </li>
            <li className="mb-4">
              <a
                href="/UserTransactionHistory"
                className="flex items-center p-2 hover:bg-green-600 rounded-md"
              >
                <img
                  src={historyLogo}
                  alt="Transaction History"
                  className="h-6 w-6"
                />
                <span className="ml-2 text-white font-bold">
                  Transaction History
                </span>
              </a>
            </li>
            <li className="mb-4">
              <a
                href="/UserFAQ"
                className="flex items-center p-2 hover:bg-green-600 rounded-md"
              >
                <img src={faqLogo} alt="FAQ" className="h-6 w-6" />
                <span className="ml-2 text-white font-bold">FAQ</span>
              </a>
            </li>
            <li className="mb-4 bg-green-800 border-2 border-green-600 rounded-full p-1">
              <a
                href="/UserGuidelinesAndPrivacy"
                className="flex items-center p-2 hover:bg-green-600 rounded-md"
              >
                <img
                  src={guidelinesLogo}
                  alt="Guidelines and Privacy"
                  className="h-6 w-6"
                />
                <span className="ml-2 text-white font-bold">
                  Guidelines and Privacy
                </span>
              </a>
            </li>
          </ul>
        </nav>
      </aside>

      <main className="flex-1 p-6 bg-white h-screen overflow-y-auto">
        <div className="bg-white shadow-lg rounded px-8 pt-6 pb-8 mt-6 mb-6 border border-gray-200">
          <h2 className="text-2xl font-bold mb-4 text-black">
            Rules and Guidelines
          </h2>
          <div className="space-y-4">
            {/* Conference Room */}
            <div className="bg-white shadow-lg rounded px-8 pt-6 pb-8 border border-gray-200">
              <h3 className="font-bold text-lg mb-2 text-black">
                Conference Room
              </h3>
              <ul className="list-disc pl-5 text-black">
                <li>
                  The Conference Room can accommodate a group of 8-10 people
                  only.
                </li>
                <li>
                  It is strictly reserved for formal meetings and conferences.
                  Other activities not indicated are subject to approval.
                </li>
                <li>
                  It can be booked for a maximum of 4 hours of use. (If you are
                  using the online booking, make your reservation 3 days before
                  your actual use.)
                </li>
                <li>
                  Failure to appear thirty (30) minutes after the reserved time
                  will automatically cancel the reservation.
                </li>
              </ul>
            </div>

            {/* Collaboration Room */}
            <div className="bg-white shadow-lg rounded px-8 pt-6 pb-8 border border-gray-200">
              <h3 className="font-bold text-lg mb-2 text-black">
                Collaboration Room
              </h3>
              <ul className="list-disc pl-5 text-black">
                <li>
                  The Collaboration Room can accommodate a group of 10-15 people
                  only.
                </li>
                <li>
                  It is primarily reserved for lectures, classes, orientation,
                  and defense. However, if the space is unoccupied, it can be
                  reserved for other purposes.
                </li>
                <li>
                  It can be booked for a maximum of 4 hours of use. (If you are
                  using the online booking, make your reservation 3 days before
                  your actual use. For other purposes, immediate reservations
                  can be made through a walk-in process in our SCC Learning
                  Commons Room.)
                </li>
                <li>
                  Failure to appear thirty (30) minutes after the reserved time
                  will automatically cancel the reservation.
                </li>
              </ul>
            </div>

            {/* Tutoring Room */}
            <div className="bg-white shadow-lg rounded px-8 pt-6 pb-8 border border-gray-200">
              <h3 className="font-bold text-lg mb-2 text-black">
                Tutoring Room
              </h3>
              <ul className="list-disc pl-5 text-black">
                <li>
                  The Tutoring Room can accommodate a group of 2-4 people per
                  table.
                </li>
                <li>This room is reserved for students who are studying.</li>
                <li>It can be booked for a maximum of 3 hours of use.</li>
                <li>The same group can only reserve once a day.</li>
              </ul>
            </div>

            {/* Equipment */}
            <div className="bg-white shadow-lg rounded px-8 pt-6 pb-8 border border-gray-200">
              <h3 className="font-bold text-lg mb-2 text-black">Equipment</h3>
              <ul className="list-disc pl-5 text-black">
                <li>
                  The equipment is strictly reserved for class, meetings,
                  conferences, and other school activities.
                </li>
                <li>
                  Any damage to the equipment will be the responsibility of the
                  borrower.
                </li>
                <li>
                  Equipment must be returned in the same condition it was
                  borrowed, and all accessories should be included.
                </li>
                <li>
                  Failure to appear 15 minutes after the reserved time will
                  automatically cancel the reservation.
                </li>
              </ul>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

export default UserGuidelinesAndPrivacy;
