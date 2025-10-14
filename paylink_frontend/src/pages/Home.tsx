import { Link } from 'react-router';

export default function HomePage() {
  return (
    <div className="min-h-screen max-w-5xl mx-auto flex flex-col">
      <main className="flex flex-col items-center justify-center flex-1 px-6 text-center">
        <h2 className="text-4xl font-bold mb-4">
          Send and claim funds easily with Paylinks
        </h2>
        <p className="text-gray-600 max-w-xl mb-8">
          Create a link, share it, and let anyone claim your funds securely on-chain.
        </p>
        <div className="flex gap-4">
          <Link
            to="/create"
            className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700"
          >
            Create Paylink
          </Link>
          <Link
            to="/dashboard"
            className="px-6 py-3 border border-gray-300 rounded-lg hover:bg-gray-50"
          >
            View Dashboard
          </Link>
        </div>
      </main>

      <section className="py-16 bg-green-300">
        <h3 className="text-2xl font-bold text-center mb-8">How it works</h3>
        <div className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto text-center">
          <div>
            <h4 className="font-semibold mb-2">1. Create Paylink</h4>
            <p className="text-gray-600">Lock your funds in a paylink contract.</p>
          </div>
          <div>
            <h4 className="font-semibold mb-2">2. Share the link</h4>
            <p className="text-gray-600">Send the link to anyone you want.</p>
          </div>
          <div>
            <h4 className="font-semibold mb-2">3. Claim or Reclaim</h4>
            <p className="text-gray-600">
              Recipient claims funds, or you reclaim if unclaimed.
            </p>
          </div>
        </div>
      </section>

      <footer className="py-6 text-center text-sm text-gray-500">
        Built on <span className="font-semibold">Celo</span> 🚀 |{" "}
        <Link to="https://github.com/yourrepo" target="_blank">
          GitHub
        </Link>
      </footer>
    </div>
  );
}
