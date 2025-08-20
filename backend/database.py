from motor.motor_asyncio import AsyncIOMotorClient
import os
from dotenv import load_dotenv

load_dotenv()

MONGO_URI = os.getenv("MONGODB_URI")

# Create async Mongo client
client = AsyncIOMotorClient(MONGO_URI)

# Select database
db = client["course_reco_db"]
