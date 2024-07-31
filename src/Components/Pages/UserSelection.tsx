import React, { useState } from "react";

interface UserSelectionProps {
  users: { id: string; name: string }[];
  selectedUsers: string[];
  onSelect: (selected: string[]) => void;
  onCancel: () => void;
}

const UserSelection: React.FC<UserSelectionProps> = ({
  users,
  selectedUsers,
  onSelect,
  onCancel,
}) => {
  const [selected, setSelected] = useState<string[]>(selectedUsers);

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

  return (
    <div className="bg-white p-4 rounded shadow-lg">
      <h2 className="text-lg font-bold mb-4 text-black">Select Users</h2>
      <ul>
        {users.map((user) => (
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
      <div className="flex justify-end mt-4">
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

export default UserSelection;
