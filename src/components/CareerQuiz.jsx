import React, { useEffect, useState } from 'react';
import { sendResultsEmail, submitProfile } from '../services/api';
import personalityTex from '../assets/personality.tex?raw';

export default function CareerQuiz() {
	const [currentStep, setCurrentStep] = useState(1);
	const totalSteps = 3;

	// Basic user info
	const [name, setName] = useState('');
	const [email, setEmail] = useState('');

	// Step 1: Personality questions from LaTeX file
	const [temperamentQuestions, setTemperamentQuestions] = useState([]);
	const [loadingQuestions, setLoadingQuestions] = useState(false);
	useEffect(() => {
		setLoadingQuestions(true);
		try {
			// Parse blocks like: \item Question ... \begin{enumerate}[label=(\Alph*)] ... \item Opt ... \end{enumerate}
			const blocks = [];
			const blockRegex = /\\item\s+([\s\S]*?)\\begin\{enumerate\}\[[^\]]*\]([\s\S]*?)\\end\{enumerate\}/g;
			let match;
			let idx = 0;
			while ((match = blockRegex.exec(personalityTex)) !== null) {
				const rawQuestion = match[1].trim().replace(/\n+/g, ' ');
				const optionsBlock = match[2];
				const optionRegex = /\\item\s+(.+?)\n/g;
				const opts = [];
				let optMatch;
				let letterCode = 65; // 'A'
				while ((optMatch = optionRegex.exec(optionsBlock)) !== null) {
					const label = optMatch[1].trim();
					const value = String.fromCharCode(letterCode);
					opts.push({ label, value });
					letterCode += 1;
				}
				if (rawQuestion && opts.length > 0) {
					blocks.push({ id: `q_${idx + 1}`, question: rawQuestion, options: opts });
					idx += 1;
				}
			}
			setTemperamentQuestions(blocks);
		} catch (e) {
			setTemperamentQuestions([]);
		} finally {
			setLoadingQuestions(false);
		}
	}, []);
	const [temperamentAnswers, setTemperamentAnswers] = useState({});

	// Step 2: Scores (Kenyan education subjects)
	const [scores, setScores] = useState({
		math: '',
		english: '',
		kiswahili: '',
		biology: '',
		physics: '',
		chemistry: '',
		geography: '',
		history: '',
		business_studies: '',
		computer_science: '',
	});
	const [scoresFile, setScoresFile] = useState(null);

	// Step 3: Interests / passions
	const [interests, setInterests] = useState([]);
	const interestOptions = [
		'Healthcare & Helping People (medicine, nursing, pharmacy)',
		'Science & Research (biology, chemistry, physics, labs)',
		'Technology & Computing (coding, AI, robotics, IT)',
		'Engineering & Problem-Solving (building, designing, innovation)',
		'Mathematics & Analytics (data, finance, statistics)',
		'Business & Entrepreneurship (leadership, startups, sales)',
		'Law, Justice & Governance (law, politics, public policy)',
		'Arts & Design (visual arts, graphics, fashion, creative design)',
		'Media & Communication (journalism, public relations, film, content creation)',
		'Education & Mentorship (teaching, training, coaching)',
		'Social Sciences & Community Work (psychology, sociology, social work)',
		'Environment & Sustainability (agriculture, climate, conservation)',
		'Travel & Hospitality (tourism, hotel management, customer service)',
		'Sports & Physical Wellness (athletics, physiotherapy, fitness, coaching)'
	];

	const [submitting, setSubmitting] = useState(false);
	const [result, setResult] = useState(null);
	const [error, setError] = useState('');
	const [sending, setSending] = useState(false);
	const [sendMsg, setSendMsg] = useState('');
	const [primaryTemperament, setPrimaryTemperament] = useState(null);
	const [temperamentBreakdown, setTemperamentBreakdown] = useState(null);

	const progressPercent = Math.round((currentStep / totalSteps) * 100);

	function toggleArrayValue(list, value) {
		return list.includes(value) ? list.filter((v) => v !== value) : [...list, value];
	}

	function computeTemperament() {
		const counts = { A: 0, B: 0, C: 0, D: 0 };
		Object.values(temperamentAnswers).forEach((val) => {
			if (val === 'A') counts.A += 1;
			else if (val === 'B') counts.B += 1;
			else if (val === 'C') counts.C += 1;
			else if (val === 'D') counts.D += 1;
		});
		const total = Math.max(1, temperamentQuestions.length);
		const perc = {
			Sanguine: Math.round((counts.A / total) * 100),
			Choleric: Math.round((counts.B / total) * 100),
			Melancholic: Math.round((counts.C / total) * 100),
			Phlegmatic: Math.round((counts.D / total) * 100),
		};
		const entries = [
			['Sanguine', perc.Sanguine],
			['Choleric', perc.Choleric],
			['Melancholic', perc.Melancholic],
			['Phlegmatic', perc.Phlegmatic],
		].sort((a, b) => b[1] - a[1]);
		const primary = entries[0][0];
		const secondary = entries[1][1] > 0 ? entries[1][0] : null;
		const combined = secondary ? `${primary}-${secondary}` : primary;
		return { primary: combined, percents: perc };
	}

	function canContinueFromStep(step) {
		if (step === 1) {
			return (
				name.trim() &&
				email.trim() &&
				temperamentQuestions.length > 0 &&
				Object.keys(temperamentAnswers).length === temperamentQuestions.length
			);
		}
		if (step === 2) {
			// allow continuing if at least one score entered or a file uploaded
			return Object.values(scores).some((v) => String(v).trim() !== '') || Boolean(scoresFile);
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
			const t = computeTemperament();
			setPrimaryTemperament(t.primary);
			setTemperamentBreakdown(t.percents);
			const payload = {
				name,
				email,
				temperament_answers: temperamentAnswers,
				temperament_primary: t.primary,
				temperament_breakdown: t.percents,
				scores,
				strengths: [],
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
		setScores({
			math: '',
			english: '',
			kiswahili: '',
			biology: '',
			physics: '',
			chemistry: '',
			geography: '',
			history: '',
			business_studies: '',
			computer_science: '',
		});
		setScoresFile(null);
		setInterests([]);
		setResult(null);
		setError('');
		setSendMsg('');
		setPrimaryTemperament(null);
		setTemperamentBreakdown(null);
	}

	return (
		<div className="container-page py-8">
			<div className="mb-6">
				<div className="flex items-center justify-between mb-2">
					<h1 className="text-2xl font-bold">Assessment</h1>
					<span className="text-sm text-gray-600">Step {Math.min(currentStep, 3)} of {totalSteps}</span>
				</div>
				<div className="w-full bg-gray-200 rounded-full h-2">
					<div className="bg-blue-700 h-2 rounded-full transition-all" style={{ width: `${Math.min(progressPercent, 100)}%` }} />
				</div>
				<div className="mt-3 grid grid-cols-3 text-center text-sm">
					<div className={`font-medium ${currentStep >= 1 ? 'text-blue-700' : 'text-gray-500'}`}>Personality</div>
					<div className={`font-medium ${currentStep >= 2 ? 'text-blue-700' : 'text-gray-500'}`}>Scores</div>
					<div className={`font-medium ${currentStep >= 3 ? 'text-blue-700' : 'text-gray-500'}`}>Interests</div>
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

					{loadingQuestions ? (
						<p className="text-sm text-gray-500">Loading questions…</p>
					) : (
						<div className="space-y-5">
							{temperamentQuestions.map((q) => (
								<div key={q.id}>
									<p className="font-medium mb-2">{q.question}</p>
									<div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
										{q.options.map((opt) => {
											const selected = temperamentAnswers[q.id] === opt.value;
											return (
												<button
													key={`${q.id}-${opt.value}`}
													type="button"
													onClick={() => setTemperamentAnswers((prev) => ({ ...prev, [q.id]: opt.value }))}
													className={`px-4 py-2 border rounded-md text-left transition-colors ${selected ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-gray-800 border-gray-300 hover:bg-gray-100'}`}
												>
													{opt.label}
												</button>
											);
										})}
									</div>
								</div>
							))}
						</div>
					)}

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
										<span className="text-gray-700 capitalize">{k.replace('_', ' ')}</span>
										<input type="number" min="0" max="100" value={v} onChange={(e) => setScores((prev) => ({ ...prev, [k]: e.target.value }))} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500" placeholder="e.g. 85" />
									</label>
								))}
							</div>
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
					{primaryTemperament ? (
						<div className="mb-6">
							<p className="text-xl"><strong>Primary Temperament:</strong> {primaryTemperament}</p>
							{temperamentBreakdown ? (
								<p className="text-sm text-gray-600 mt-1">
									Sanguine {temperamentBreakdown.Sanguine}% • Choleric {temperamentBreakdown.Choleric}% • Melancholic {temperamentBreakdown.Melancholic}% • Phlegmatic {temperamentBreakdown.Phlegmatic}%
								</p>
							) : null}
						</div>
					) : null}
					{result?.recommendation ? (
						<div className="space-y-2">
							<p className="text-xl"><strong>Suggested Career:</strong> {result.recommendation.career}</p>
							<p className="text-lg text-gray-700"><strong>Recommended Courses:</strong> {result.recommendation.courses?.join(', ')}</p>
							{result.recommendation.rationale ? (<p className="text-gray-600 text-sm mt-2">{result.recommendation.rationale}</p>) : null}
						</div>
					) : (
						<p className="text-gray-700">Thanks! Your profile has been saved.</p>
					)}
					<div className="mt-8 flex flex-col items-center gap-3">
						<div className="flex gap-3">
							<button onClick={resetAll} className="px-5 py-2 rounded-md border border-gray-300 text-gray-700 hover:bg-gray-50">Start over</button>
							<a href="/" className="px-5 py-2 rounded-md bg-blue-600 text-white hover:bg-blue-700">Go Home</a>
						</div>
						<div className="flex items-center gap-2">
							<button disabled={sending} onClick={async () => {
								if (!email) return;
								setSendMsg('');
								setSending(true);
								try {
									await sendResultsEmail(email, result?.recommendation || null);
									setSendMsg('Sent! Check your inbox.');
								} catch (e) {
									setSendMsg('Failed to send email.');
								} finally {
									setSending(false);
								}
							}} className={`px-5 py-2 rounded-md ${sending ? 'bg-gray-400' : 'bg-green-600 hover:bg-green-700'} text-white`}>
								{sending ? 'Sending…' : 'Send results to my email'}
							</button>
							{sendMsg ? <span className="text-sm text-gray-600">{sendMsg}</span> : null}
						</div>
					</div>
				</section>
			)}
		</div>
	);
}
