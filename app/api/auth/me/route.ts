import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedUser } from '@/src/lib/auth/session';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const NO_STORE_HEADERS = {
  'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0',
  'Pragma': 'no-cache',
  'Expires': '0',
};

export async function GET(request: NextRequest) {
  try {
    const auth = await getAuthenticatedUser(request);

    if (!auth) {
      return NextResponse.json(
        {
          authenticated: false,
          user: null,
          workspace: null,
        },
        { status: 200, headers: NO_STORE_HEADERS }
      );
    }

    return NextResponse.json(
      {
        authenticated: true,
        user: auth.user,
        workspace: auth.workspace,
      },
      { status: 200, headers: NO_STORE_HEADERS }
    );
  } catch (err) {
    console.error('[VizPilot Auth] /me error:', err);
    return NextResponse.json(
      {
        authenticated: false,
        user: null,
        workspace: null,
      },
      { status: 200, headers: NO_STORE_HEADERS }
    );
  }
}
