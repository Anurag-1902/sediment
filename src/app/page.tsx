export default function Home() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-8">
      <main className="max-w-4xl text-center space-y-6">
        <h1 className="text-6xl font-bold tracking-tight text-gray-900">
          Your product is being built
        </h1>
        <p className="text-6xl font-bold text-cyan-400 tracking-tight">
          Please wait...
        </p>
        <p className="text-xl text-gray-600 pt-4">
          We're working on creating your desired product
        </p>
      </main>
    </div>
  );
}
