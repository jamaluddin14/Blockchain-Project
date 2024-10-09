from pydantic import BaseModel, Field
from typing import List, Dict
import uuid
from typing import Optional
class User(BaseModel):
    id: str = Field(alias="_id")
    email: str
    public_key: Optional[str] = None
    friends: List[str] = []
