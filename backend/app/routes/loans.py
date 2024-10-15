from fastapi import APIRouter, Depends, HTTPException, status
from typing import List
from app.schemas import LoanRequest, LoanResponse, ApproveRejectLoanRequest, RepayLoanRequest, RenegotiateDueDateRequest
from app.models import User
from app.database import db
from app.utils import get_current_user, loan_contract, send_transaction
from web3 import Web3

router = APIRouter()

@router.post("/request")
def request_loan(loan: LoanRequest, current_user: User = Depends(get_current_user)):
    lender = db.users.find_one({"_id": loan.lender_id})
    if not lender:
        raise HTTPException(status_code=404, detail="Lender not found")
    lender_dict = dict(lender)
    due_date_timestamp=int(loan.due_date.timestamp())  # Convert due date to timestamp
    # Send loan request transaction with due date
    tx_hash = send_transaction(
        loan_contract.functions.requestLoan(
            lender_dict["public_key"],
            Web3.to_wei(loan.amount, 'ether'),
            loan.collateral,
            due_date_timestamp
        ),
        current_user.public_key
    )

    return {"tx": tx_hash}

@router.post("/approve")
def approve_loan(loan_request: ApproveRejectLoanRequest, current_user: User = Depends(get_current_user)):
    loan = loan_contract.functions.loans(loan_request.loan_id).call()
    
    # Verify lender
    if Web3.to_checksum_address(current_user.public_key) != loan[2]:  # Lender address
        raise HTTPException(status_code=403, detail="Only the lender can approve the loan")
    
    # Approve loan and emit Transfer event
    tx_hash = send_transaction(
        loan_contract.functions.approveLoan(loan_request.loan_id),
        value=loan[3],  # Loan amount
        public_address=current_user.public_key
    )
    return {"tx": tx_hash}

@router.post("/reject")
def reject_loan(loan_request: ApproveRejectLoanRequest, current_user: User = Depends(get_current_user)):
    loan = loan_contract.functions.loans(loan_request.loan_id).call()
    
    # Verify lender
    if current_user.public_key != loan[2]:  # Lender address
        raise HTTPException(status_code=403, detail="Only the lender can reject the loan")
    
    # Reject loan
    tx_hash = send_transaction(
        loan_contract.functions.rejectLoan(loan_request.loan_id),
        public_address=current_user.public_key
    )
    return {"tx": tx_hash}

@router.post("/repay")
def repay_loan(loan_request: RepayLoanRequest, current_user: User = Depends(get_current_user)):
    loan = loan_contract.functions.loans(loan_request.loan_id).call()
    
    # Verify borrower
    if current_user.public_key != loan[1]:  # Borrower address
        raise HTTPException(status_code=403, detail="Only the borrower can repay the loan")
    
    # Ensure loan is not under renegotiation
    if loan[6] is True:  # Assuming loan[6] is `isRenegotiationPending`
        raise HTTPException(status_code=400, detail="Loan is under renegotiation, cannot repay at this time.")
    
    # Repay loan and emit Transfer event
    tx_hash = send_transaction(
        loan_contract.functions.repayLoan(loan_request.loan_id),
        value=loan[3],
        public_address=current_user.public_key
    )
    return {"tx": tx_hash}

@router.post("/request-renegotiation")
def request_renegotiation(renegotiation_request: RenegotiateDueDateRequest, current_user: User = Depends(get_current_user)):
    loan = loan_contract.functions.loans(renegotiation_request.loan_id).call()
    due_date_timestamp=int(renegotiation_request.new_due_date.timestamp())
    # Verify borrower
    if current_user.public_key != loan[1]:  # Borrower address
        raise HTTPException(status_code=403, detail="Only the borrower can request due date renegotiation.")
    
    # Request due date renegotiation
    tx_hash = send_transaction(
        loan_contract.functions.requestDueDateRenegotiation(renegotiation_request.loan_id, due_date_timestamp),
        public_address=current_user.public_key
    )
    return {"tx": tx_hash}

@router.post("/approve-renegotiation")
def approve_renegotiation(renegotiation_request:ApproveRejectLoanRequest , current_user: User = Depends(get_current_user)):
    loan = loan_contract.functions.loans(renegotiation_request.loan_id).call()
    
    # Verify lender
    if current_user.public_key != loan[2]:  # Lender address
        raise HTTPException(status_code=403, detail="Only the lender can approve due date renegotiation.")
    
    # Approve due date renegotiation
    tx_hash = send_transaction(
        loan_contract.functions.approveDueDateRenegotiation(renegotiation_request.loan_id),
        public_address=current_user.public_key
    )
    return {"tx": tx_hash}

@router.get("/")
def get_user_loans(is_borrower: bool = True, is_request: bool = False, current_user: User = Depends(get_current_user)):
    if current_user.public_key is None:
        return []
    
    # Retrieve loans for the user
    loans = loan_contract.functions.getUserLoans(Web3.to_checksum_address(current_user.public_key), is_borrower, is_request).call()

    # If no loans found, return an empty list
    if not loans:
        return []

    # Get all borrower and lender public keys from the loans in a single query
    public_keys = {loan[1] for loan in loans} | {loan[2] for loan in loans}  # Set of unique borrower/lender public keys

    # Fetch borrower and lender details in one query using the $in operator
    users = list(db.users.find({"public_key": {"$in": list(public_keys)}}))
    
    # Create a dictionary for quick lookup of user details by public_key (maps to user ID and name)
    user_lookup = {user["public_key"]: {"id": user["_id"], "name": user["name"]} for user in users}
    
    # Convert LoanStatus enum to string
    status_map = {0: "Pending", 1: "Approved" if is_borrower else "Lended", 2: "Repaid", 3: "Rejected"}

    # Map loans to LoanResponse schema
    filtered_loans = []
    for loan in loans:
        borrower_info = user_lookup.get(loan[1], {"id": "Unknown", "name": "Unknown"})
        lender_info = user_lookup.get(loan[2], {"id": "Unknown", "name": "Unknown"})
        
        filtered_loans.append(LoanResponse(
            loanId=loan[0],
            borrower=borrower_info["name"],
            borrower_id=str(borrower_info["id"]),  # Include borrower ID
            lender=lender_info["name"],
            lender_id=str(lender_info["id"]),  # Include lender ID
            amount=Web3.from_wei(loan[3], 'ether'),
            collateral=loan[4],
            status=status_map[loan[5]],
            created_at=loan[6],
            due_date=loan[7],  # Include due date in response
            last_modified_at=loan[8],  # Include last modified date
            renegotiation_request=loan[10],  # Include renegotiation request status
            new_due_date=loan[9]  # Include requested due date
        ))

    return filtered_loans

