from pydantic import BaseModel, Field
from datetime import datetime
from typing import Optional

class UserCreate(BaseModel):
    uuid: str
    email: str
    public_key: Optional[str] = None
    name: str

class AddPublicKey(BaseModel):
    public_key: str

class AddFriendRequest(BaseModel):
    friend_id: str

class VerifyUser(BaseModel):
    uuid: str

class UserResponse(BaseModel):
    id: str = Field(..., alias="_id")
    email: str
    name: str
    public_key: Optional[str] = None

class LoanRequest(BaseModel):
    lender_id: str
    amount: float
    collateral: str
    due_date: datetime  # Added due date

class LoanResponse(BaseModel):
    loanId: int
    borrower: str
    lender: str
    amount: float
    collateral: str
    status: str
    created_at: datetime  # Added created_at
    last_modified_at: datetime  # Added last_modified_at
    due_date: datetime  # Added due_date
    renegotiation_request: bool  # Added for renegotiation
    new_due_date: datetime  # Added for renegotiation
    borrower_id: str
    lender_id: str

class LoanActionResponse(BaseModel):
    transaction_hash: str

class ApproveRejectLoanRequest(BaseModel):
    loan_id: int

class RepayLoanRequest(BaseModel):
    loan_id: int
    amount: float

class RenegotiateDueDateRequest(BaseModel):  # Added for renegotiation
    loan_id: int
    new_due_date: datetime
