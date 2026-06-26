import { NextResponse } from 'next/server';

/** Wallet / EIP-712 signing disabled — approvals use email session in lib/agreements.ts */
export async function POST() {
  return NextResponse.json(
    { error: 'Wallet signing is disabled in this version.' },
    { status: 501 }
  );
}
