'use client';

import { Suspense } from 'react';
import { LoginForm } from '@/components/auth/LoginForm';
import Link from 'next/link';

function LoginContent() {
  return (
    <div className="max-w-md mx-auto space-y-6">
      <div className="text-center">
        <Link href="/" className="text-sm text-gray-500 hover:text-primary">
          ← Back to home
        </Link>
      </div>
      <LoginForm />
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="text-center py-12">Loading…</div>}>
      <LoginContent />
    </Suspense>
  );
}
