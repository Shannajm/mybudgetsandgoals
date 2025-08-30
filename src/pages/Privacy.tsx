import React from 'react';

const Privacy: React.FC = () => (
  <div className="p-6 max-w-3xl mx-auto space-y-4">
    <h1 className="text-3xl font-bold">Privacy Policy</h1>
    <p className="text-gray-600 dark:text-gray-300">This is a placeholder privacy policy. Replace with your actual policy before launch.</p>
    <ul className="list-disc pl-6 space-y-1 text-gray-600 dark:text-gray-300">
      <li>We store only the data necessary to operate the app.</li>
      <li>Your data is not sold to third parties.</li>
      <li>You can request deletion of your account and data at any time.</li>
    </ul>
  </div>
);

export default Privacy;

