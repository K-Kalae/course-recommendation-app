import os
from typing import Dict, List, Optional

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, EmailStr
from motor.motor_asyncio import AsyncIOMotorClient
from dotenv import load_dotenv

load_dotenv()

MONGODB_URI = os.getenv("MONGODB_URI", "mongodb://localhost:27017")
DB_NAME = os.getenv("DB_NAME", "course_reco_db")

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


@app.get("/")
async def root():
    # just a test collection
    collection = _db["test_collection"]
    doc = await collection.insert_one({"msg": "Hello Mongo!"})
    saved = await collection.find_one({"_id": doc.inserted_id})
    return {"saved": saved}


@app.post("/api/submit_profile")
async def submit_profile(profile: ProfileCreate):
	# Persist profile and recommendation
	rec = make_recommendation(profile.strengths, profile.interests)
	doc = profile.model_dump()
	doc["recommendation"] = rec.model_dump()
	result = await _db["profiles"].insert_one(doc)
	return {"_id": str(result.inserted_id), "recommendation": doc["recommendation"]}
