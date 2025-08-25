import React from 'react';
import { Link } from 'react-router-dom';

export default function Navbar() {
  return (
    <nav className="flex items-center justify-between px-6 py-4 bg-[#f5efe6]/80 backdrop-blur border-b border-[#e9e2d7]">
      <Link to="/" className="text-2xl font-semibold tracking-tight">Triomatch</Link>
      <div />
    </nav>
  );
}
