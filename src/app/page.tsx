'use client';

export default function Home() {
  if (typeof window !== 'undefined') {
    window.location.href = '/index.html';
  }
  return <div>Loading...</div>;
}
