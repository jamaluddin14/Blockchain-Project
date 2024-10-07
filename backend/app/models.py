from pydantic import BaseModel, Field
from typing import List, Dict
import uuid

class User(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()), alias="_id")
    username: str
    password: str
    email: str
    public_key: str
    friends: List[str] = []
    score: int = 0
    transactions: List[str] = []
