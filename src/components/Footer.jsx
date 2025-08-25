import React from 'react';

export default function Footer() {
  const year = new Date().getFullYear();
  return (
    <footer className="text-center p-4 bg-[#f5efe6] border-t border-[#e9e2d7] mt-10">
      <p className="text-sm text-gray-600">© {year} Triomatch</p>
    </footer>
  );
}
