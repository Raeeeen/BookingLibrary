import React, { useState } from "react";

interface CourseSelectionProps {
  courses: { id: string; description: string }[];
  selectedCourses: string[];
  onSelect: (selected: string[]) => void;
  onCancel: () => void;
}

const CourseSelection: React.FC<CourseSelectionProps> = ({
  courses,
  selectedCourses,
  onSelect,
  onCancel,
}) => {
  const [selected, setSelected] = useState<string[]>(selectedCourses);
  const [searchTerm, setSearchTerm] = useState<string>("");

  const handleToggleUser = (courseId: string) => {
    setSelected(
      (prevSelected) => (prevSelected.includes(courseId) ? [] : [courseId]) // Only one course allowed
    );
  };

  const handleConfirm = () => {
    onSelect(selected);
  };

  // Filter courses based on the search term
  const filteredCourses = courses.filter((course) =>
    course.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="bg-white p-6 rounded shadow-lg w-96 relative">
      {/* Close Button */}
      <button
        onClick={onCancel}
        className="absolute top-2 right-2 text-black text-lg font-bold hover:text-red-600"
      >
        &times; {/* This is the X symbol */}
      </button>

      <h2 className="text-lg font-bold mb-4 text-black">Select Course</h2>

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

      {/* Scrollable list of courses */}
      <ul className="max-h-[50vh] overflow-y-auto mb-4 border-t border-b border-gray-200 pt-2">
        {filteredCourses.map((course) => (
          <li key={course.id} className="flex items-center mb-2 text-black">
            <input
              type="checkbox"
              checked={selected.includes(course.id)}
              onChange={() => handleToggleUser(course.id)}
              className="mr-2"
            />
            {course.description}
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

export default CourseSelection;
