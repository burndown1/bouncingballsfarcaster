import { NextRequest, NextResponse } from 'next/server';
import { updateStats, GameResult } from '@/lib/kv';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Validate required fields
    const requiredFields = ['winnerFid', 'loserFid', 'winnerUsername', 'loserUsername', 
                           'winnerScore', 'loserScore', 'winnerDisplayName', 'loserDisplayName',
                           'winnerPfpUrl', 'loserPfpUrl'];
    
    for (const field of requiredFields) {
      if (body[field] === undefined || body[field] === null) {
        return NextResponse.json(
          { error: `Missing required field: ${field}` },
          { status: 400 }
        );
      }
    }
    
    const gameResult: GameResult = {
      winnerFid: body.winnerFid,
      loserFid: body.loserFid,
      winnerUsername: body.winnerUsername,
      loserUsername: body.loserUsername,
      winnerDisplayName: body.winnerDisplayName,
      loserDisplayName: body.loserDisplayName,
      winnerPfpUrl: body.winnerPfpUrl,
      loserPfpUrl: body.loserPfpUrl,
      winnerScore: body.winnerScore,
      loserScore: body.loserScore,
      timestamp: Date.now(),
    };
    
    // Update stats in KV storage
    await updateStats(gameResult);
    
    return NextResponse.json({ 
      success: true,
      message: 'Game result saved successfully' 
    });
    
  } catch (error) {
    console.error('Error saving game result:', error);
    return NextResponse.json(
      { error: 'Failed to save game result' },
      { status: 500 }
    );
  }
}
