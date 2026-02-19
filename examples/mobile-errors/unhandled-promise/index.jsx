import { useEffect } from 'react';

export default function Fetcher() {
  useEffect(() => {
    new Promise((resolve, reject) => {
      setTimeout(() => {
        reject(new Error('This is an unhandled promise rejection'));
      }, 1000);
    });
  }, []);
  return <div>unhandled promise</div>;
}
