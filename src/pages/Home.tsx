import { Link } from 'react-router-dom';

export default function Home() {
  return (
    <div className="min-h-screen bg-[#EBF1FF] flex items-center justify-center">
      <div className="flex gap-6">
        <Link to="/doctor">
          <button className="w-48 py-4 rounded-full border-2 border-[#1E40AF] bg-[#1E40AF] text-white font-semibold text-lg hover:bg-[#1e3a8a] transition-colors shadow-md">
            Doctor Portal
          </button>
        </Link>
        <Link to="/patient">
          <button className="w-48 py-4 rounded-full border-2 border-[#1E40AF] text-[#1E40AF] font-semibold text-lg hover:bg-white transition-colors box-border">
            View My Report
          </button>
        </Link>
      </div>
    </div>
  );
}
