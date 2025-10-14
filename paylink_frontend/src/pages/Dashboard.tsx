export default function DashboardPage() {
  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold">Dashboard</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="p-6 bg-purple-50 rounded-lg">
          <h3 className="font-semibold mb-2">Statistics</h3>
          <p className="text-3xl font-bold text-purple-600">1,234</p>
          <p className="text-sm text-gray-600">Total Views</p>
        </div>
        <div className="p-6 bg-orange-50 rounded-lg">
          <h3 className="font-semibold mb-2">Activity</h3>
          <p className="text-3xl font-bold text-orange-600">89%</p>
          <p className="text-sm text-gray-600">Engagement Rate</p>
        </div>
      </div>
    </div>
  );
}
