const API_BASE = import.meta.env.VITE_API_BASE || 'http://127.0.0.1:8000';

export async function submitProfile(profile) {
	const res = await fetch(`${API_BASE}/api/submit_profile`, {
		method: 'POST',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify(profile),
	});
	if (!res.ok) {
		const text = await res.text();
		throw new Error(`HTTP ${res.status}: ${text}`);
	}
	return res.json();
}
