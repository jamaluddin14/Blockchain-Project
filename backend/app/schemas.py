from pydantic import BaseModel
from pydantic.fields import Field
from datetime import datetime

class UserCreate(BaseModel):
    username: str
    password: str
    email: str
    public_key: str

class AddFriendRequest(BaseModel):
    friend_id: str
class UserLogin(BaseModel):
    username: str
    password: str
    public_key: str

class UserResponse(BaseModel):
    id: str = Field(..., alias="_id")
    username: str
    email: str
    score: int

class LoanRequest(BaseModel):
    lender_id: str
    amount: float
    collateral: str

class LoanResponse(BaseModel):
    loanId: int
    borrower: str
    lender: str
    amount: float
    collateral: str
    status: str

class LoanActionResponse(BaseModel):
    transaction_hash: str

class ApproveRejectLoanRequest(BaseModel):
    loan_id: int

class RepayLoanRequest(BaseModel):
    loan_id: int
    amount: float