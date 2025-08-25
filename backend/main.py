import os
from typing import Dict, List, Optional

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, EmailStr
from motor.motor_asyncio import AsyncIOMotorClient
from dotenv import load_dotenv
import smtplib
from email.mime.text import MIMEText
import httpx

load_dotenv()

MONGODB_URI = os.getenv("MONGODB_URI", "mongodb://localhost:27017")
DB_NAME = os.getenv("DB_NAME", "course_reco_db")

SMTP_HOST = os.getenv("SMTP_HOST")
SMTP_PORT = int(os.getenv("SMTP_PORT", "587"))
SMTP_USER = os.getenv("SMTP_USER")
SMTP_PASS = os.getenv("SMTP_PASS")
SMTP_FROM = os.getenv("SMTP_FROM", SMTP_USER or "noreply@example.com")

MBTI_BASE = "https://16personalities-api.com"

app = FastAPI(title="Course Recommendation API")

app.add_middleware(
	CORSMiddleware,
	allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"],
	allow_credentials=True,
	allow_methods=["*"],
	allow_headers=["*"],
)

mongo_client: Optional[AsyncIOMotorClient] = None
_db = None


@app.on_event("startup")
async def on_startup() -> None:
	global mongo_client, _db
	mongo_client = AsyncIOMotorClient(MONGODB_URI)
	_db = mongo_client[DB_NAME]


@app.on_event("shutdown")
async def on_shutdown() -> None:
	if mongo_client is not None:
		mongo_client.close()


class ProfileCreate(BaseModel):
	name: str
	email: EmailStr
	temperament_answers: Dict[str, str]
	temperament_primary: Optional[str] = None
	temperament_breakdown: Optional[Dict[str, int]] = None
	scores: Dict[str, str]
	strengths: List[str] = []
	interests: List[str] = []
	scores_file_name: Optional[str] = None


class Recommendation(BaseModel):
	career: str
	courses: List[str]
	rationale: Optional[str] = None


def make_recommendation(strengths: List[str], interests: List[str]) -> Recommendation:
	if "Software/AI" in interests or any(s in strengths for s in ["Analytical", "Problem-Solving"]):
		return Recommendation(
			career="Software Engineer",
			courses=["Computer Science", "Software Engineering", "AI/ML"],
			rationale="Analytical/problem-solving strengths align with software and AI."
		)
	if "Design/Media" in interests or "Creative" in strengths:
		return Recommendation(
			career="UX/UI Designer",
			courses=["Design", "HCI", "Media"],
			rationale="Creative strengths align with design and media."
		)
	if "Education" in interests or any(s in strengths for s in ["Empathy", "Communication"]):
		return Recommendation(
			career="Educator/Trainer",
			courses=["Education", "Psychology"],
			rationale="People-centered strengths suggest teaching and mentorship."
		)
	if "Engineering" in interests:
		return Recommendation(
			career="Mechanical/Electrical Engineer",
			courses=["Mechanical Engineering", "Electrical Engineering"],
			rationale="Hands-on and systems thinking align with engineering."
		)
	if "Healthcare" in interests:
		return Recommendation(
			career="Healthcare Professional",
			courses=["Nursing", "Public Health", "Pre-Med"],
			rationale="Service and empathy align with healthcare."
		)
	if "Entrepreneurship" in interests or "Leadership" in strengths:
		return Recommendation(
			career="Product Manager/Founder",
			courses=["Business Administration", "Entrepreneurship"],
			rationale="Leadership and initiative align with product and business."
		)
	if "Environment" in interests:
		return Recommendation(
			career="Environmental Scientist/Engineer",
			courses=["Environmental Science", "Civil Engineering"],
			rationale="Interest in sustainability suggests environmental careers."
		)
	return Recommendation(
		career="Generalist Analyst",
		courses=["Liberal Arts", "Interdisciplinary Studies"],
		rationale="Broad profile suggests an exploratory, cross-disciplinary path."
	)


@app.post("/api/submit_profile")
async def submit_profile(profile: ProfileCreate):
	rec = make_recommendation(profile.strengths, profile.interests)
	doc = profile.model_dump()
	doc["recommendation"] = rec.model_dump()
	result = await _db["profiles"].insert_one(doc)
	return {"_id": str(result.inserted_id), "recommendation": doc["recommendation"]}


class SendEmailRequest(BaseModel):
	email: EmailStr
	recommendation: Optional[Recommendation] = None


@app.post("/api/send_results_email")
async def send_results_email(payload: SendEmailRequest):
	if not (SMTP_HOST and SMTP_USER and SMTP_PASS):
		return {"ok": False, "message": "Email not configured"}
	subject = "Your Triomatch assessment results"
	body_lines = ["Thanks for using Triomatch! Here are your results:"]
	if payload.recommendation:
		body_lines.append(f"Suggested career: {payload.recommendation.career}")
		body_lines.append("Recommended courses: " + ", ".join(payload.recommendation.courses))
		if payload.recommendation.rationale:
			body_lines.append("")
			body_lines.append(payload.recommendation.rationale)
	body = "\n".join(body_lines)
	msg = MIMEText(body)
	msg["Subject"] = subject
	msg["From"] = SMTP_FROM
	msg["To"] = payload.email

	srv = smtplib.SMTP(SMTP_HOST, SMTP_PORT)
	srv.starttls()
	srv.login(SMTP_USER, SMTP_PASS)
	srv.sendmail(SMTP_FROM, [payload.email], msg.as_string())
	srv.quit()
	return {"ok": True}


# 16Personalities proxy endpoints
@app.get("/api/personality/questions")
async def proxy_personality_questions():
	url = f"{MBTI_BASE}/api/personality/questions"
	async with httpx.AsyncClient(timeout=20) as client:
		resp = await client.get(url)
		resp.raise_for_status()
		return resp.json()


class PersonalitySubmitRequest(BaseModel):
	answers: List[Dict]
	gender: Optional[str] = None


@app.post("/api/personality/submit")
async def proxy_personality_submit(req: PersonalitySubmitRequest):
	url = f"{MBTI_BASE}/api/personality/submit"
	async with httpx.AsyncClient(timeout=30) as client:
		resp = await client.post(url, json=req.model_dump())
		resp.raise_for_status()
		return resp.json()


# Backward compatible routes
@app.get("/api/mbti/questions")
async def get_mbti_questions():
	return await proxy_personality_questions()


class MbtiSubmitRequest(BaseModel):
	answers: List[Dict]
	gender: Optional[str] = None


@app.post("/api/mbti/submit")
async def submit_mbti(req: MbtiSubmitRequest):
	return await proxy_personality_submit(PersonalitySubmitRequest(**req.model_dump()))
