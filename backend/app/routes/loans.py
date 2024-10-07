from fastapi import APIRouter, Depends, HTTPException, status
from typing import List
from app.schemas import LoanRequest, LoanResponse, ApproveRejectLoanRequest, RepayLoanRequest
from app.models import User
from app.database import db
from app.utils import get_current_user,loan_contract, send_transaction
from web3 import Web3

router = APIRouter()

@router.post("/request")
def request_loan(loan: LoanRequest, current_user: User = Depends(get_current_user)):
    lender = db.users.find_one({"_id": loan.lender_id})
    if not lender:
        raise HTTPException(status_code=404, detail="Lender not found")
    lender_dict = dict(lender)
    
    # Send loan request transaction
    tx_hash = send_transaction(
        loan_contract.functions.requestLoan(
            Web3.to_checksum_address(lender_dict["public_key"]),
            Web3.to_wei(loan.amount, 'ether'),
            loan.collateral
        ),
        current_user.public_key
    )

    return {"tx":tx_hash}

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
    if Web3.to_checksum_address(current_user.public_key) != loan[2]:  # Lender address
        raise HTTPException(status_code=403, detail="Only the lender can reject the loan")
    
    # Reject loan
    tx_hash = send_transaction(
        loan_contract.functions.rejectLoan(loan_request.loan_id),
        public_address=current_user.public_key
    )
    return {"tx":tx_hash}

@router.post("/repay")
def repay_loan(loan_request: RepayLoanRequest, current_user: User = Depends(get_current_user)):
    loan = loan_contract.functions.loans(loan_request.loan_id).call()
    print(current_user.public_key)
    print(loan[1])
    # Verify borrower
    if Web3.to_checksum_address(current_user.public_key) != loan[1]:  # Borrower address
        raise HTTPException(status_code=403, detail="Only the borrower can repay the loan")
    
    # Repay loan and emit Transfer event
    tx_hash = send_transaction(
        loan_contract.functions.repayLoan(loan_request.loan_id),
        value=loan[3],
        public_address=current_user.public_key
    )
    return {"tx": tx_hash}

@router.get("/")
def get_user_loans(is_borrower: bool = True, current_user: User = Depends(get_current_user)):
    loans = loan_contract.functions.getUserLoans(Web3.to_checksum_address(current_user.public_key), is_borrower).call()
    
    # If no loans found, return an empty list
    if not loans:
        return []
    
    print(loans)
    # Convert LoanStatus enum to string
    status_map = {0: "Pending", 1: "Approved", 2: "Repaid", 3: "Rejected"}
    
    # Use a set to keep track of unique loan IDs
    unique_loan_ids = set()
    filtered_loans = []
    
    # Map loans to LoanResponse schema and filter out duplicates
    for loan in loans:
        loan_id = loan[0]
        if loan_id not in unique_loan_ids:
            unique_loan_ids.add(loan_id)
            filtered_loans.append(LoanResponse(
                loanId=loan_id,
                borrower=loan[1],
                lender=loan[2],
                amount=Web3.from_wei(loan[3], 'ether'),
                collateral=loan[4],
                status=status_map[loan[5]]  # Convert status enum to string
            ))
    
    return filtered_loans
