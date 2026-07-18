import React from 'react';
import { Link } from 'react-router-dom';

export default function NotFound() {
  return (
    <div className="py-24 text-center">
      <p className="text-5xl font-bold text-dark-300">404</p>
      <p className="mt-2 text-dark-500">This report doesn’t exist.</p>
      <Link to="/" className="btn-primary mt-4">Back to dashboard</Link>
    </div>
  );
}
