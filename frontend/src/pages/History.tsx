import React from 'react';

export default function History() {
  return (
    <div className="py-9">
      <div className="text-center">
        <h1 className="text-3xl font-bold text-gray-900 mb-4">
          Prediction History
        </h1>
        <p className="text-gray-600 mb-8">
          View your past predictions and their outcomes
        </p>
        
        <div className="bg-gray-50 rounded-lg p-8">
          <p className="text-gray-500">
            No prediction history yet. Start making predictions to see them here!
          </p>
        </div>
      </div>
    </div>
  );
}
