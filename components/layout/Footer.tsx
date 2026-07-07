import Link from 'next/link';

export function Footer() {
  return (
    <footer className="border-t border-gray-200 dark:border-gray-700 mt-auto">
      <div className="container mx-auto px-4 py-6">
        <Link
          href="/facilitation-guide"
          className="text-sm text-gray-500 dark:text-gray-400 hover:text-primary transition-colors"
        >
          Facilitation Guide
        </Link>
      </div>
    </footer>
  );
}
