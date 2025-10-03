"use client";

export default function LoadingScreen() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-900 to-black">
      <div className="text-center">
        <div className="animate-spin rounded-full h-32 w-32 border-t-4 border-b-4 border-purple-500 mx-auto mb-8"></div>
        <h1 className="text-4xl font-bold text-white mb-2">Ox Board</h1>
        <p className="text-purple-300">Loading DJ Interface...</p>
      </div>
    </div>
  );
}
