import React, { useState } from 'react';

const questions = [
  {
    id: 1,
    question: "Which of these do you find easiest to do?",
    options: [
      "Solve math problems",
      "Write stories or essays",
      "Organize group projects",
      "Build or fix things",
      "Create art or designs",
      "Explain concepts to others",
    ],
  },
  {
    id: 2,
    question: "What activity makes you lose track of time?",
    options: [
      "Drawing/creating",
      "Solving problems",
      "Debating ideas",
      "Helping others",
      "Playing with technology",
      "Exploring the outdoors",
    ],
  },
  {
    id: 3,
    question: "Do you prefer working alone or in a team?",
    options: [
      "Always Alone",
      "Mostly Alone",
      "Team",
      "Depends",
    ],
  },
];

const resultMapping = {
  tech: ["Solve math problems", "Playing with technology"],
  creative: ["Create art or designs", "Drawing/creating"],
  social: ["Organize group projects", "Helping others"],
};

export default function CareerQuiz() {
  const [answers, setAnswers] = useState({});
  const [showResult, setShowResult] = useState(false);

  const handleAnswer = (questionId, option) => {
    setAnswers({ ...answers, [questionId]: option });
  };

  const calculateResult = () => {
    const chosenAnswers = Object.values(answers);
    let scores = { tech: 0, creative: 0, social: 0 };

    chosenAnswers.forEach((ans) => {
      for (const [key, values] of Object.entries(resultMapping)) {
        if (values.includes(ans)) scores[key] += 1;
      }
    });

    const bestFit = Object.entries(scores).sort((a, b) => b[1] - a[1])[0][0];
    return bestFit;
  };

  const handleSubmit = () => {
    // Validate all questions answered
    if (Object.keys(answers).length < questions.length) {
      alert('Please answer all questions before submitting.');
      return;
    }
    setShowResult(true);
  };

  const recommendation = {
    tech: {
      career: "Software Developer or Engineer",
      course: "Computer Science, Electrical Engineering",
    },
    creative: {
      career: "UX Designer or Content Creator",
      course: "Design, Media, Communication",
    },
    social: {
      career: "Teacher or Psychologist",
      course: "Education, Psychology, Social Work",
    },
  };

  const resultKey = calculateResult();

  return (
    <div className="max-w-3xl mx-auto p-6">
      {!showResult ? (
        <div className="space-y-8">
          {questions.map((q) => (
            <div key={q.id} className="bg-white shadow rounded-lg p-6">
              <h2 className="text-xl font-semibold mb-4">{q.question}</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {q.options.map((option) => (
                  <button
                    key={option}
                    onClick={() => handleAnswer(q.id, option)}
                    className={`px-4 py-2 border rounded-md text-left transition-colors duration-200
                      ${
                        answers[q.id] === option
                          ? 'bg-blue-600 text-white border-blue-600'
                          : 'bg-white text-gray-800 border-gray-300 hover:bg-gray-100'
                      }`}
                  >
                    {option}
                  </button>
                ))}
              </div>
            </div>
          ))}

          <div className="text-center">
            <button
              onClick={handleSubmit}
              className="mt-4 px-6 py-3 bg-green-600 text-white font-semibold rounded-md hover:bg-green-700 transition-colors duration-200"
            >
              See My Results
            </button>
          </div>
        </div>
      ) : (
        <div className="bg-white shadow rounded-lg p-8 text-center">
          <h2 className="text-3xl font-bold mb-6">Your Ideal Path</h2>
          <p className="text-xl mb-4">
            <strong>Suggested Career:</strong> {recommendation[resultKey].career}
          </p>
          <p className="text-xl">
            <strong>Recommended Course(s):</strong> {recommendation[resultKey].course}
          </p>
          <button
            onClick={() => {
              setShowResult(false);
              setAnswers({});
            }}
            className="mt-8 px-5 py-3 bg-gray-600 text-white rounded-md hover:bg-gray-700"
          >
            Take Quiz Again
          </button>
        </div>
      )}
    </div>
  );
}
