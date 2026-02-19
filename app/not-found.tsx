export const dynamic = 'force-dynamic';

export default function NotFound() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center">
        <div className="text-6xl mb-4">🔍</div>
        <h1 className="text-2xl font-bold text-gray-900">Halaman tidak ditemukan</h1>
        <p className="text-gray-500 mt-2">Coba kembali ke dashboard</p>
        <a href="/dashboard" className="mt-4 inline-block text-blue-600 hover:underline">
          Ke Dashboard
        </a>
      </div>
    </div>
  );
}
