import { NextRequest, NextResponse } from 'next/server';
import { getLeaderboard } from '@/lib/kv';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const period = searchParams.get('period') || '30d';
    
    // Validate period
    if (!['1d', '7d', '30d'].includes(period)) {
      return NextResponse.json(
        { error: 'Invalid period. Must be 1d, 7d, or 30d' },
        { status: 400 }
      );
    }
    
    // Get leaderboard
    const leaderboard = await getLeaderboard(period as '1d' | '7d' | '30d');
    
    return NextResponse.json({ 
      success: true,
      period,
      leaderboard 
    });
    
  } catch (error) {
    console.error('Error fetching leaderboard:', error);
    return NextResponse.json(
      { error: 'Failed to fetch leaderboard' },
      { status: 500 }
    );
  }
}
