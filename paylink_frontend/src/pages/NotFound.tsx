import { useNavigate } from 'react-router';

export default function NotFoundPage() {
  const navigate = useNavigate();
  
  return (
    <div className="text-center space-y-4">
      <h2 className="text-6xl font-bold text-gray-300">404</h2>
      <h3 className="text-2xl font-semibold">Page Not Found</h3>
      <p className="text-gray-600">The page you're looking for doesn't exist.</p>
      <button 
        onClick={() => navigate('/')}
        className="px-6 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition"
      >
        Go Home
      </button>
    </div>
  );
}
