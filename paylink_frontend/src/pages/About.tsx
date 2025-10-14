import { useNavigate } from 'react-router';

export default function AboutPage() {
  const navigate = useNavigate();
  
  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold">About Us</h2>
      <p className="text-gray-600">This is a demo of React Router in a Vite application.</p>
      <div className="bg-blue-50 p-4 rounded-lg">
        <h3 className="font-semibold mb-2">Features:</h3>
        <ul className="list-disc list-inside space-y-1 text-gray-700">
          <li>Dynamic routing with React Router</li>
          <li>Nested routes and layouts</li>
          <li>Programmatic navigation</li>
          <li>URL parameters</li>
        </ul>
      </div>
      <button 
        onClick={() => navigate('/')}
        className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition"
      >
        Go Back Home
      </button>
    </div>
  );
}

