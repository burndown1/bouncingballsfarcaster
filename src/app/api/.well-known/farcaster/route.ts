import { NextResponse } from 'next/server';

export async function GET() {
  const manifest = {
    accountAssociation: {
      header: "farcaster-verify",
    },
    appUrl: "https://bouncingballsfarcaster.vercel.app/index.html",
    imageUrl: "https://bouncingballsfarcaster.vercel.app/app-icon-512.png",
    "app_name": "Bouncing Balls Game",
    "app_description": "An arcade football game with bouncing balls"
  };

  return NextResponse.json(manifest, {
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
    },
  });
}
