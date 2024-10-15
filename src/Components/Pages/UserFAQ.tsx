import schoolLogo from "../../assets/scclogo.png";
import dashboardlogo from "../../assets/dashboardlogo.png";
import historyLogo from "../../assets/reportslogo.png";
import borrowLogo from "../../assets/borrowicon.png";
import faqLogo from "../../assets/faqlogo.png";
import guidelinesLogo from "../../assets/guidelineslogo.png";

function UserFAQ() {
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
                <img src={borrowLogo} alt="Borrow" className="h-6 w-6" />
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
            <li className="mb-4 bg-green-800 border-2 border-green-600 rounded-full p-1">
              <a
                href="/UserFAQ"
                className="flex items-center p-2 hover:bg-green-600 rounded-md"
              >
                <img src={faqLogo} alt="FAQ" className="h-6 w-6" />
                <span className="ml-2 text-white font-bold">FAQ</span>
              </a>
            </li>
            <li className="mb-4">
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
          <h2 className="text-2xl font-bold mb-4 text-black">FAQs</h2>
          <div className="space-y-4">
            <div className="bg-white shadow-lg rounded px-8 pt-6 pb-8 border border-gray-200">
              <h3 className="font-bold text-lg mb-2 text-black">
                1. How do I reserve a room and equipment?
              </h3>
              <p className="text-black">
                You can reserve a room and equipment online through our booking
                system. Please ensure to make your reservation at least 3 days
                before your intended use. If you wish to use the room or
                equipment immediately, you can book or borrow them through the
                walk-in process in our SCC Learning Commons Room.
              </p>
            </div>

            <div className="bg-white shadow-lg rounded px-8 pt-6 pb-8 border border-gray-200">
              <h3 className="font-bold text-lg mb-2 text-black">
                2. What should I do if I need to cancel my reservation?
              </h3>
              <p className="text-black">
                If you need to cancel your reservation, please visit our SCC
                Learning Commons Room and inform the librarian of the reason for
                your cancellation.
              </p>
            </div>

            <div className="bg-white shadow-lg rounded px-8 pt-6 pb-8 border border-gray-200">
              <h3 className="font-bold text-lg mb-2 text-black">
                3. Can I use the rooms for activities other than what is
                specified?
              </h3>
              <p className="text-black">
                The Conference Room and Collaboration Room are primarily
                reserved for specific activities. Any other use must be approved
                by the librarian. You must book through the walk-in process in
                our SCC Learning Commons Room for approval.
              </p>
            </div>

            <div className="bg-white shadow-lg rounded px-8 pt-6 pb-8 border border-gray-200">
              <h3 className="font-bold text-lg mb-2 text-black">
                4. What happens if I exceed the maximum booking or borrowing
                time?
              </h3>
              <p className="text-black">
                You are only allowed to book or borrow for the specified maximum
                time. The system will not approve your reservation if the time
                exceeds the maximum limit.
              </p>
            </div>

            <div className="bg-white shadow-lg rounded px-8 pt-6 pb-8 border border-gray-200">
              <h3 className="font-bold text-lg mb-2 text-black">
                5. What do I do if the equipment is damaged during my use?
              </h3>
              <p className="text-black">
                If any damage occurs, you must report it immediately. You will
                be held responsible for any repair or replacement costs, as
                stated in the equipment guidelines.
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

export default UserFAQ;
