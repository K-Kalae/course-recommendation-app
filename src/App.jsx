import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';

import Navbar from './components/Navbar';
import Footer from './components/Footer';
import Home from './components/Home/Home';
import CareerQuiz from './components/CareerQuiz';

function App() {
  return (
    <Router>
      <div className="flex flex-col min-h-screen bg-[#f5efe6] text-[#2b2a28]">
        <Navbar />
        <main className="flex-grow">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/assessment" element={<CareerQuiz />} />
          </Routes>
        </main>
        <Footer />
      </div>
    </Router>
  );
}

export default App;
