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
    due_date_timestamp=int(renogotiation_request.new_due_date.timestamp())
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
def approve_renegotiation(renegotiation_request: RenegotiateDueDateRequest, current_user: User = Depends(get_current_user)):
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

