import React, { useState } from 'react';
import {
  map,
  filter,
  sortBy,
  groupBy,
  uniq,
  chunk,
  flatten,
  debounce,
  throttle,
  cloneDeep,
  merge,
  pick,
  omit,
  get,
  set,
  isEmpty,
  isEqual,
  capitalize,
  camelCase,
  kebabCase,
  random,
  sum,
  mean,
  max,
  min,
} from 'lodash';

export default function LodashDemo() {
  const [searchTerm, setSearchTerm] = useState('');
  const [clickCount, setClickCount] = useState(0);
  const [throttleCount, setThrottleCount] = useState(0);

  // Sample data
  const users = [
    { id: 1, name: 'John Doe', age: 30, department: 'Engineering', salary: 75000 },
    { id: 2, name: 'Jane Smith', age: 25, department: 'Design', salary: 65000 },
    { id: 3, name: 'Bob Johnson', age: 35, department: 'Engineering', salary: 85000 },
    { id: 4, name: 'Alice Brown', age: 28, department: 'Marketing', salary: 60000 },
    { id: 5, name: 'Charlie Wilson', age: 32, department: 'Design', salary: 70000 },
  ];

  const numbers = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
  const nestedArray = [
    [1, 2],
    [3, 4],
    [5, 6],
  ];
  const duplicateNumbers = [1, 2, 2, 3, 3, 3, 4, 5];

  // Debounced search function
  const debouncedSearch = debounce((term) => {
    console.log('Searching for:', term);
  }, 500);

  // Throttled click handler
  const throttledClick = throttle(() => {
    setThrottleCount((prev) => prev + 1);
  }, 1000);

  const handleSearchChange = (e) => {
    const value = e.target.value;
    setSearchTerm(value);
    debouncedSearch(value);
  };

  const handleClick = () => {
    setClickCount((prev) => prev + 1);
    throttledClick();
  };

  // Array operations
  const squaredNumbers = map(numbers, (n) => n * n);
  const evenNumbers = filter(numbers, (n) => n % 2 === 0);
  const sortedUsers = sortBy(users, ['age']);
  const usersByDepartment = groupBy(users, 'department');
  const uniqueNumbers = uniq(duplicateNumbers);
  const chunkedNumbers = chunk(numbers, 3);
  const flattenedArray = flatten(nestedArray);

  // Object operations
  const sampleObject = {
    user: {
      profile: {
        name: 'John',
        settings: {
          theme: 'dark',
        },
      },
    },
  };

  const clonedObject = cloneDeep(sampleObject);
  const mergedObject = merge({}, sampleObject, {
    user: { profile: { email: 'john@example.com' } },
  });
  const pickedData = pick(users[0], ['name', 'age']);
  const omittedData = omit(users[0], ['id', 'salary']);
  const nestedValue = get(sampleObject, 'user.profile.settings.theme', 'light');

  // String operations
  const sampleText = 'hello world example';
  const capitalizedText = capitalize(sampleText);
  const camelCaseText = camelCase(sampleText);
  const kebabCaseText = kebabCase(sampleText);

  // Math operations
  const salaries = map(users, 'salary');
  const totalSalary = sum(salaries);
  const averageSalary = mean(salaries);
  const maxSalary = max(salaries);
  const minSalary = min(salaries);
  const randomNumber = random(1, 100);

  // Utility checks
  const emptyCheck = isEmpty([]);
  const equalityCheck = isEqual([1, 2, 3], [1, 2, 3]);

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-4xl font-bold text-gray-900 mb-8 text-center">
          Lodash Utility Library Demo
        </h1>

        {/* Array Operations */}
        <section className="bg-white rounded-lg shadow-md p-6 mb-8">
          <h2 className="text-2xl font-semibold text-gray-800 mb-4">Array Operations</h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="text-lg font-medium text-gray-700 mb-2">Original Numbers</h3>
              <p className="text-gray-600 bg-gray-100 p-2 rounded">[{numbers.join(', ')}]</p>
            </div>

            <div>
              <h3 className="text-lg font-medium text-gray-700 mb-2">Squared (map)</h3>
              <p className="text-gray-600 bg-gray-100 p-2 rounded">[{squaredNumbers.join(', ')}]</p>
            </div>

            <div>
              <h3 className="text-lg font-medium text-gray-700 mb-2">Even Numbers (filter)</h3>
              <p className="text-gray-600 bg-gray-100 p-2 rounded">[{evenNumbers.join(', ')}]</p>
            </div>

            <div>
              <h3 className="text-lg font-medium text-gray-700 mb-2">Unique Numbers (uniq)</h3>
              <p className="text-gray-600 bg-gray-100 p-2 rounded">[{uniqueNumbers.join(', ')}]</p>
            </div>

            <div>
              <h3 className="text-lg font-medium text-gray-700 mb-2">Chunked (chunk by 3)</h3>
              <p className="text-gray-600 bg-gray-100 p-2 rounded">
                {JSON.stringify(chunkedNumbers)}
              </p>
            </div>

            <div>
              <h3 className="text-lg font-medium text-gray-700 mb-2">Flattened Array</h3>
              <p className="text-gray-600 bg-gray-100 p-2 rounded">[{flattenedArray.join(', ')}]</p>
            </div>
          </div>
        </section>

        {/* User Data Operations */}
        <section className="bg-white rounded-lg shadow-md p-6 mb-8">
          <h2 className="text-2xl font-semibold text-gray-800 mb-4">User Data Operations</h2>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div>
              <h3 className="text-lg font-medium text-gray-700 mb-2">Users Sorted by Age</h3>
              <div className="bg-gray-100 p-3 rounded max-h-48 overflow-y-auto">
                {sortedUsers.map((user) => (
                  <div key={user.id} className="mb-2 text-sm">
                    {user.name} - Age: {user.age}
                  </div>
                ))}
              </div>
            </div>

            <div>
              <h3 className="text-lg font-medium text-gray-700 mb-2">
                Users by Department (groupBy)
              </h3>
              <div className="bg-gray-100 p-3 rounded max-h-48 overflow-y-auto">
                {Object.entries(usersByDepartment).map(([dept, users]) => (
                  <div key={dept} className="mb-2">
                    <strong className="text-sm">{dept}:</strong>
                    <div className="ml-4">
                      {users.map((user) => (
                        <div key={user.id} className="text-sm text-gray-600">
                          {user.name}
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Object Operations */}
        <section className="bg-white rounded-lg shadow-md p-6 mb-8">
          <h2 className="text-2xl font-semibold text-gray-800 mb-4">Object Operations</h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="text-lg font-medium text-gray-700 mb-2">Pick (name, age only)</h3>
              <pre className="text-sm bg-gray-100 p-3 rounded overflow-x-auto">
                {JSON.stringify(pickedData, null, 2)}
              </pre>
            </div>

            <div>
              <h3 className="text-lg font-medium text-gray-700 mb-2">Omit (without id, salary)</h3>
              <pre className="text-sm bg-gray-100 p-3 rounded overflow-x-auto">
                {JSON.stringify(omittedData, null, 2)}
              </pre>
            </div>

            <div>
              <h3 className="text-lg font-medium text-gray-700 mb-2">Get Nested Value</h3>
              <p className="text-gray-600 bg-gray-100 p-2 rounded">Theme: {nestedValue}</p>
            </div>

            <div>
              <h3 className="text-lg font-medium text-gray-700 mb-2">Utility Checks</h3>
              <div className="bg-gray-100 p-2 rounded">
                <p className="text-sm">isEmpty([]): {emptyCheck.toString()}</p>
                <p className="text-sm">isEqual([1,2,3], [1,2,3]): {equalityCheck.toString()}</p>
              </div>
            </div>
          </div>
        </section>

        {/* String Operations */}
        <section className="bg-white rounded-lg shadow-md p-6 mb-8">
          <h2 className="text-2xl font-semibold text-gray-800 mb-4">String Operations</h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="text-lg font-medium text-gray-700 mb-2">Original Text</h3>
              <p className="text-gray-600 bg-gray-100 p-2 rounded">"{sampleText}"</p>
            </div>

            <div>
              <h3 className="text-lg font-medium text-gray-700 mb-2">Capitalize</h3>
              <p className="text-gray-600 bg-gray-100 p-2 rounded">"{capitalizedText}"</p>
            </div>

            <div>
              <h3 className="text-lg font-medium text-gray-700 mb-2">Camel Case</h3>
              <p className="text-gray-600 bg-gray-100 p-2 rounded">"{camelCaseText}"</p>
            </div>

            <div>
              <h3 className="text-lg font-medium text-gray-700 mb-2">Kebab Case</h3>
              <p className="text-gray-600 bg-gray-100 p-2 rounded">"{kebabCaseText}"</p>
            </div>
          </div>
        </section>

        {/* Math Operations */}
        <section className="bg-white rounded-lg shadow-md p-6 mb-8">
          <h2 className="text-2xl font-semibold text-gray-800 mb-4">Math Operations (Salaries)</h2>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <h3 className="text-lg font-medium text-gray-700">Total</h3>
              <p className="text-2xl font-bold text-green-600">${totalSalary.toLocaleString()}</p>
            </div>

            <div className="text-center">
              <h3 className="text-lg font-medium text-gray-700">Average</h3>
              <p className="text-2xl font-bold text-blue-600">
                ${Math.round(averageSalary).toLocaleString()}
              </p>
            </div>

            <div className="text-center">
              <h3 className="text-lg font-medium text-gray-700">Maximum</h3>
              <p className="text-2xl font-bold text-purple-600">${maxSalary.toLocaleString()}</p>
            </div>

            <div className="text-center">
              <h3 className="text-lg font-medium text-gray-700">Minimum</h3>
              <p className="text-2xl font-bold text-orange-600">${minSalary.toLocaleString()}</p>
            </div>
          </div>

          <div className="mt-4 text-center">
            <h3 className="text-lg font-medium text-gray-700">Random Number (1-100)</h3>
            <p className="text-3xl font-bold text-red-600">{randomNumber}</p>
          </div>
        </section>

        {/* Function Utilities */}
        <section className="bg-white rounded-lg shadow-md p-6 mb-8">
          <h2 className="text-2xl font-semibold text-gray-800 mb-4">Function Utilities</h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="text-lg font-medium text-gray-700 mb-2">Debounced Search</h3>
              <input
                type="text"
                value={searchTerm}
                onChange={handleSearchChange}
                placeholder="Type to search (debounced 500ms)"
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <p className="text-sm text-gray-600 mt-2">
                Check console for debounced search results
              </p>
            </div>

            <div>
              <h3 className="text-lg font-medium text-gray-700 mb-2">Throttled Button</h3>
              <button
                onClick={handleClick}
                className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 transition-colors"
              >
                Click Me! (Throttled)
              </button>
              <div className="mt-2 text-sm">
                <p>Total clicks: {clickCount}</p>
                <p>Throttled count: {throttleCount} (max 1 per second)</p>
              </div>
            </div>
          </div>
        </section>

        {/* Footer */}
        <div className="text-center text-gray-600 mt-8">
          <p>
            This demo showcases various lodash utility functions for arrays, objects, strings, math,
            and function utilities.
          </p>
        </div>
      </div>
    </div>
  );
}
