# mongodb_config.py
import os
from dotenv import load_dotenv
from pymongo import MongoClient

load_dotenv()

MONGO_URI = os.getenv("MONGO_URI", "mongodb://localhost:27017/")
DB_NAME = os.getenv("DB_NAME", "safepulse")

client = MongoClient(MONGO_URI)
db = client[DB_NAME]
print(f" Connected to MongoDB database: {DB_NAME}")
