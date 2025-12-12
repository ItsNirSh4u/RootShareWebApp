import { Link } from 'react-router-dom';

export function HomePage(): JSX.Element {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-b from-green-50 to-green-100">
      <div className="text-center space-y-6 p-8">
        <h1 className="text-5xl font-bold text-green-800">🌱 RootShare</h1>
        <p className="text-xl text-green-700 max-w-md">
          Connect with plant enthusiasts, share your green journey, and trade plants with your
          community
        </p>
        <div className="flex gap-4 justify-center mt-8">
          <Link
            to="/login"
            className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
          >
            Login
          </Link>
          <Link
            to="/register"
            className="px-6 py-3 bg-white text-green-600 border-2 border-green-600 rounded-lg hover:bg-green-50 transition-colors"
          >
            Register
          </Link>
        </div>
      </div>
    </div>
  );
}
