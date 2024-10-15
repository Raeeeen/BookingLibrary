import React, { useState } from "react";

interface UserSelectionProps {
  users: { id: string; name: string }[]; // ensure that users are well-defined
  selectedUsers: string[];
  onSelect: (selected: string[]) => void;
  onCancel: () => void;
}

const AddStudentsUserSelection: React.FC<UserSelectionProps> = ({
  users,
  selectedUsers,
  onSelect,
  onCancel,
}) => {
  const [selected, setSelected] = useState<string[]>(selectedUsers);
  const [searchTerm, setSearchTerm] = useState<string>("");

  const handleToggleUser = (userId: string) => {
    setSelected((prevSelected) =>
      prevSelected.includes(userId)
        ? prevSelected.filter((id) => id !== userId)
        : [...prevSelected, userId]
    );
  };

  const handleConfirm = () => {
    onSelect(selected);
  };

  const filteredUsers = users.filter(
    (user) => user?.name?.toLowerCase().includes(searchTerm.toLowerCase()) // ensure user and name are defined
  );

  return (
    <div className="bg-white p-6 rounded shadow-lg w-96 relative">
      {/* Close Button */}
      <button
        onClick={onCancel}
        className="absolute top-2 right-2 text-black text-lg font-bold hover:text-red-600"
      >
        &times;
      </button>

      <h2 className="text-lg font-bold mb-4 text-black">Select Students</h2>

      {/* Search bar */}
      <div className="relative mb-4 mt-2">
        <input
          type="text"
          placeholder="Search..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-3 pr-3 py-2 rounded bg-white text-black font-bold placeholder-gray-500 border border-black focus:border-black focus:outline-none"
          style={{ boxSizing: "border-box" }}
        />
      </div>

      {/* Scrollable list of users */}
      <ul className="max-h-[50vh] overflow-y-auto mb-4 border-t border-b border-gray-200 pt-2">
        {filteredUsers.map((user) => (
          <li key={user.id} className="flex items-center mb-2 text-black">
            <input
              type="checkbox"
              checked={selected.includes(user.id)}
              onChange={() => handleToggleUser(user.id)}
              className="mr-2"
            />
            {user.name}
          </li>
        ))}
      </ul>

      {/* Fixed buttons at the bottom */}
      <div className="flex justify-end">
        <button
          onClick={onCancel}
          className="p-2 bg-red-600 text-white rounded mr-2"
        >
          Cancel
        </button>
        <button
          onClick={handleConfirm}
          className="p-2 bg-green-600 text-white rounded"
        >
          Confirm
        </button>
      </div>
    </div>
  );
};

export default AddStudentsUserSelection;
