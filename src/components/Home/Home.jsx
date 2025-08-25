import React from 'react';
import { Link } from 'react-router-dom';

export default function Home() {
  return (
    <section className="container-page py-24 text-center">
      <h1 className="text-6xl font-extrabold tracking-tight">Triomatch</h1>
      <p className="mt-4 max-w-2xl mx-auto text-lg text-[#5f5b53]">
        Discover the best study path by matching your personality, strengths, and interests.
      </p>
      <div className="mt-10">
        <Link to="/assessment" className="inline-block px-8 py-3 rounded-md bg-[#1f2937] text-white hover:bg-black transition">
          Get Started
        </Link>
      </div>
    </section>
  );
}
