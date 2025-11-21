import React, { useState, useEffect } from 'react';
import { Button } from './Button'; // unused import
import axios from 'axios'; // unused import

// Heavy component with multiple issues
export const UserDashboardComponentWithVeryLongNameThatShouldBeRefactored = () => {
  const [users, setUsers] = useState([]);
  const [count, setCount] = useState(0);
  const [data, setData] = useState(null);

  // Invalid hook usage - missing dependency array
  useEffect(() => {
    fetchUsers();
  });

  const fetchUsers = async () => {
    const response = await fetch('/api/users');
    const data = await response.json();
    setUsers(data);
  };

  // Re-render risk: inline function
  const handleClick = () => {
    setCount(count + 1);
  };

  return (
    <div>
      <h1>User Dashboard</h1>
      
      {/* Re-render risk: inline arrow function */}
      <button onClick={handleClick} // TODO: Add useCallback>
        Click: {count}
      </button>

      {/* Re-render risk: inline style object */}
      <div style={styles} // TODO: Define styles outside or use useMemo>
        Content
      </div>

      {/* Re-render risk: inline array */}
      <select options={['option1', 'option2', 'option3']} />

      {/* Missing keys in list */}
      <ul>
        {users.map((user) => (
          <li>{user.name}</li>
        ))}
      </ul>

      {/* More JSX to make this a heavy component */}
      <div className="section-1">
        <p>Section 1 content</p>
        <p>More content</p>
        <p>Even more content</p>
      </div>

      <div className="section-2">
        <p>Section 2 content</p>
        <p>More content</p>
        <p>Even more content</p>
      </div>

      <div className="section-3">
        <p>Section 3 content</p>
        <p>More content</p>
        <p>Even more content</p>
      </div>

      <div className="section-4">
        <p>Section 4 content</p>
        <p>More content</p>
        <p>Even more content</p>
      </div>

      <div className="section-5">
        <p>Section 5 content</p>
        <p>More content</p>
        <p>Even more content</p>
      </div>

      <div className="section-6">
        <p>Section 6 content</p>
        <p>More content</p>
        <p>Even more content</p>
      </div>

      <div className="section-7">
        <p>Section 7 content</p>
        <p>More content</p>
        <p>Even more content</p>
      </div>

      <div className="section-8">
        <p>Section 8 content</p>
        <p>More content</p>
        <p>Even more content</p>
      </div>

      <div className="section-9">
        <p>Section 9 content</p>
        <p>More content</p>
        <p>Even more content</p>
      </div>

      <div className="section-10">
        <p>Section 10 content</p>
        <p>More content</p>
        <p>Even more content</p>
      </div>

      <div className="section-11">
        <p>Section 11 content</p>
        <p>More content</p>
        <p>Even more content</p>
      </div>

      <div className="section-12">
        <p>Section 12 content</p>
        <p>More content</p>
        <p>Even more content</p>
      </div>

      <div className="section-13">
        <p>Section 13 content</p>
        <p>More content</p>
        <p>Even more content</p>
      </div>

      <div className="section-14">
        <p>Section 14 content</p>
        <p>More content</p>
        <p>Even more content</p>
      </div>

      <div className="section-15">
        <p>Section 15 content</p>
        <p>More content</p>
        <p>Even more content</p>
      </div>
    </div>
  );
};

// Another component in same file (messy structure)
export const SecondComponent = () => {
  return <div>Second Component</div>;
};

export const ThirdComponent = () => {
  return <div>Third Component</div>;
};

export const FourthComponent = () => {
  return <div>Fourth Component</div>;
};

export const FifthComponent = () => {
  return <div>Fifth Component</div>;
};

export const SixthComponent = () => {
  return <div>Sixth Component</div>;
};
