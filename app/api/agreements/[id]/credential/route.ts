import { NextResponse } from 'next/server';

/** Verifiable credential issuance disabled — wallet auth removed for this version */
export async function GET() {
  return NextResponse.json(
    { error: 'Verifiable credentials are disabled in this version.' },
    { status: 501 }
  );
}
