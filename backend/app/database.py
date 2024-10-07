import logging
from pymongo import MongoClient
from pymongo.errors import ServerSelectionTimeoutError
from dotenv import load_dotenv
import os

load_dotenv()
MONGO_URI = os.getenv("MONGO_URI")
# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

try:
    client = MongoClient(MONGO_URI, serverSelectionTimeoutMS=5000)
    db = client.p2p_lending
    # Test the connection
    client.admin.command('ping')
    logger.info("Successfully connected to the MongoDB database.")
except ServerSelectionTimeoutError:
    logger.error("Failed to connect to the MongoDB database.")
