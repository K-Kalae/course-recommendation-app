import React, { useMemo, useState } from 'react';
import { submitProfile } from '../services/api';

export default function CareerQuiz() {
	const [currentStep, setCurrentStep] = useState(1);
	const totalSteps = 3;

	// Basic user info
	const [name, setName] = useState('');
	const [email, setEmail] = useState('');

	// Step 1: Personality (temperament) questions
	const temperamentQuestions = useMemo(
		() => [
			{ id: 't1', question: 'In a new group, you usually…', options: ['Take the lead', 'Observe quietly first', 'Crack jokes and connect', 'Ask clarifying questions'] },
			{ id: 't2', question: 'You prefer tasks that are…', options: ['Structured with clear rules', 'Open-ended and creative', 'Hands-on and practical', 'Collaborative and people-focused'] },
			{ id: 't3', question: 'When solving problems, you…', options: ['Use logic and analytics', 'Brainstorm multiple angles', 'Prototype quickly', 'Discuss with others'] },
			{ id: 't4', question: 'You gain energy from…', options: ['Building/tech tinkering', 'Art/design/content', 'Helping/teaching others', 'Planning/organizing'] },
			{ id: 't5', question: 'Under pressure, you…', options: ['Focus and optimize', 'Innovate a new approach', 'Rally the team', 'Document and prioritize'] },
		],
		[]
	);
	const [temperamentAnswers, setTemperamentAnswers] = useState({});

	// Step 2: Scores upload + strengths
	const [scores, setScores] = useState({ math: '', english: '', science: '', arts: '' });
	const [scoresFile, setScoresFile] = useState(null);
	const [strengths, setStrengths] = useState([]);
	const strengthOptions = ['Analytical', 'Creative', 'Leadership', 'Communication', 'Empathy', 'Problem-Solving', 'Attention to Detail'];

	// Step 3: Interests / passions
	const [interests, setInterests] = useState([]);
	const interestOptions = ['Software/AI', 'Design/Media', 'Entrepreneurship', 'Healthcare', 'Education', 'Engineering', 'Environment'];

	const [submitting, setSubmitting] = useState(false);
	const [result, setResult] = useState(null);
	const [error, setError] = useState('');

	const progressPercent = useMemo(() => Math.round((currentStep / totalSteps) * 100), [currentStep]);

	function toggleArrayValue(list, value) {
		return list.includes(value) ? list.filter((v) => v !== value) : [...list, value];
	}

	function canContinueFromStep(step) {
		if (step === 1) {
			return name.trim() && email.trim() && Object.keys(temperamentAnswers).length === temperamentQuestions.length;
		}
		if (step === 2) {
			return strengths.length > 0 || Object.values(scores).some((v) => String(v).trim() !== '') || Boolean(scoresFile);
		}
		if (step === 3) {
			return interests.length > 0;
		}
		return true;
	}

	async function handleSubmitAll() {
		setError('');
		if (!canContinueFromStep(3)) return;
		setSubmitting(true);
		try {
			const payload = {
				name,
				email,
				temperament_answers: temperamentAnswers,
				scores,
				strengths,
				interests,
				scores_file_name: scoresFile?.name || null,
			};
			const data = await submitProfile(payload);
			setResult(data);
			setCurrentStep(4); // show result screen
		} catch (e) {
			setError(e.message || 'Submission failed');
		} finally {
			setSubmitting(false);
		}
	}

	function resetAll() {
		setCurrentStep(1);
		setName('');
		setEmail('');
		setTemperamentAnswers({});
		setScores({ math: '', english: '', science: '', arts: '' });
		setScoresFile(null);
		setStrengths([]);
		setInterests([]);
		setResult(null);
		setError('');
	}

	return (
		<div className="container-page py-8">
			<div className="mb-6">
				<div className="flex items-center justify-between mb-2">
					<h1 className="text-2xl font-bold">Career Path Wizard</h1>
					<span className="text-sm text-gray-500">Step {Math.min(currentStep, 3)} of {totalSteps}</span>
				</div>
				<div className="w-full bg-gray-200 rounded-full h-2">
					<div className="bg-blue-600 h-2 rounded-full transition-all" style={{ width: `${Math.min(progressPercent, 100)}%` }} />
				</div>
				<div className="mt-3 grid grid-cols-3 text-center text-sm">
					<div className={`font-medium ${currentStep >= 1 ? 'text-blue-600' : 'text-gray-500'}`}>Personality</div>
					<div className={`font-medium ${currentStep >= 2 ? 'text-blue-600' : 'text-gray-500'}`}>Scores & Strengths</div>
					<div className={`font-medium ${currentStep >= 3 ? 'text-blue-600' : 'text-gray-500'}`}>Interests</div>
				</div>
			</div>

			{error ? (
				<div className="mb-4 rounded-md border border-red-300 bg-red-50 p-3 text-red-800">{error}</div>
			) : null}

			{currentStep === 1 && (
				<section className="bg-white rounded-lg shadow p-6 space-y-6">
					<div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
						<div>
							<label className="block text-sm font-medium text-gray-700">Full name</label>
							<input value={name} onChange={(e) => setName(e.target.value)} type="text" className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500" placeholder="Jane Doe" />
						</div>
						<div>
							<label className="block text-sm font-medium text-gray-700">Email</label>
							<input value={email} onChange={(e) => setEmail(e.target.value)} type="email" className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500" placeholder="jane@example.com" />
						</div>
					</div>

					<div className="space-y-5">
						{temperamentQuestions.map((q) => (
							<div key={q.id}>
								<p className="font-medium mb-2">{q.question}</p>
								<div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
									{q.options.map((opt) => (
										<button key={opt} type="button" onClick={() => setTemperamentAnswers((prev) => ({ ...prev, [q.id]: opt }))} className={`px-4 py-2 border rounded-md text-left transition-colors ${temperamentAnswers[q.id] === opt ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-gray-800 border-gray-300 hover:bg-gray-100'}`}>{opt}</button>
									))}
								</div>
							</div>
						))}
					</div>

					<div className="flex justify-end gap-3">
						<button disabled={!canContinueFromStep(1)} onClick={() => setCurrentStep(2)} className={`px-5 py-2 rounded-md text-white ${canContinueFromStep(1) ? 'bg-blue-600 hover:bg-blue-700' : 'bg-gray-400 cursor-not-allowed'}`}>Continue</button>
					</div>
				</section>
			)}

			{currentStep === 2 && (
				<section className="bg-white rounded-lg shadow p-6 space-y-6">
					<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
						<div>
							<h3 className="font-semibold mb-2">Upload test scores (optional)</h3>
							<input type="file" accept=".pdf,.jpg,.jpeg,.png,.doc,.docx" onChange={(e) => setScoresFile(e.target.files?.[0] || null)} className="block w-full text-sm text-gray-700 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100" />
							{scoresFile ? <p className="text-xs text-gray-500 mt-1">Selected: {scoresFile.name}</p> : null}
						</div>
						<div>
							<h3 className="font-semibold mb-2">Enter subject scores (optional)</h3>
							<div className="grid grid-cols-2 gap-3">
								{Object.entries(scores).map(([k, v]) => (
									<label key={k} className="text-sm">
										<span className="text-gray-700 capitalize">{k}</span>
										<input type="number" min="0" max="100" value={v} onChange={(e) => setScores((prev) => ({ ...prev, [k]: e.target.value }))} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500" placeholder="e.g. 85" />
									</label>
								))}
							</div>
						</div>
					</div>

					<div>
						<h3 className="font-semibold mb-2">Select your strengths</h3>
						<div className="flex flex-wrap gap-2">
							{strengthOptions.map((opt) => (
								<button key={opt} type="button" onClick={() => setStrengths((prev) => toggleArrayValue(prev, opt))} className={`px-3 py-1 rounded-full border ${strengths.includes(opt) ? 'bg-green-600 text-white border-green-600' : 'bg-white text-gray-800 border-gray-300 hover:bg-gray-100'}`}>{opt}</button>
							))}
						</div>
					</div>

					<div className="flex justify-between">
						<button onClick={() => setCurrentStep(1)} className="px-5 py-2 rounded-md border border-gray-300 text-gray-700 hover:bg-gray-50">Back</button>
						<button disabled={!canContinueFromStep(2)} onClick={() => setCurrentStep(3)} className={`px-5 py-2 rounded-md text-white ${canContinueFromStep(2) ? 'bg-blue-600 hover:bg-blue-700' : 'bg-gray-400 cursor-not-allowed'}`}>Continue</button>
					</div>
				</section>
			)}

			{currentStep === 3 && (
				<section className="bg-white rounded-lg shadow p-6 space-y-6">
					<div>
						<h3 className="font-semibold mb-2">Choose your interests and passions</h3>
						<div className="flex flex-wrap gap-2">
							{interestOptions.map((opt) => (
								<button key={opt} type="button" onClick={() => setInterests((prev) => toggleArrayValue(prev, opt))} className={`px-3 py-1 rounded-full border ${interests.includes(opt) ? 'bg-purple-600 text-white border-purple-600' : 'bg-white text-gray-800 border-gray-300 hover:bg-gray-100'}`}>{opt}</button>
							))}
						</div>
					</div>

					<div className="flex justify-between">
						<button onClick={() => setCurrentStep(2)} className="px-5 py-2 rounded-md border border-gray-300 text-gray-700 hover:bg-gray-50">Back</button>
						<button disabled={submitting || !canContinueFromStep(3)} onClick={handleSubmitAll} className={`px-5 py-2 rounded-md text-white ${canContinueFromStep(3) ? 'bg-green-600 hover:bg-green-700' : 'bg-gray-400 cursor-not-allowed'}`}>{submitting ? 'Submitting…' : 'See My Results'}</button>
					</div>
				</section>
			)}

			{currentStep === 4 && result && (
				<section className="bg-white rounded-lg shadow p-8 text-center">
					<h2 className="text-3xl font-bold mb-4">Your Ideal Path</h2>
					{result?.recommendation ? (
						<div className="space-y-2">
							<p className="text-xl"><strong>Suggested Career:</strong> {result.recommendation.career}</p>
							<p className="text-lg text-gray-700"><strong>Recommended Courses:</strong> {result.recommendation.courses?.join(', ')}</p>
							{result.recommendation.rationale ? (<p className="text-gray-600 text-sm mt-2">{result.recommendation.rationale}</p>) : null}
						</div>
					) : (
						<p className="text-gray-700">Thanks! Your profile has been saved.</p>
					)}
					<div className="mt-8 flex justify-center gap-3">
						<button onClick={resetAll} className="px-5 py-2 rounded-md border border-gray-300 text-gray-700 hover:bg-gray-50">Start over</button>
						<a href="/" className="px-5 py-2 rounded-md bg-blue-600 text-white hover:bg-blue-700">Go Home</a>
					</div>
				</section>
			)}
		</div>
	);
}
