// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract LoanContract {
    string public constant name = "LoanToken";
    string public constant symbol = "LTK";

    mapping(address => mapping(address => uint256)) public allowance;

    enum LoanStatus { Pending, Approved, Repaid, Rejected }

    struct Loan {
        uint loanId;
        address borrower;
        address lender;
        uint amount;
        string collateral;
        LoanStatus status;
        uint createdAt;
        uint dueDate;
        uint lastModifiedAt;
        uint requestedDueDate;
        bool renegotiationRequested;
    }

    uint public loanCounter;
    mapping(uint => Loan) public loans;
    mapping(address => uint[]) public userLoans;

    event Transfer(address indexed from, address indexed to, uint256 value);
    event LoanRequested(uint indexed loanId, address indexed borrower, address indexed lender, uint amount, string collateral, uint dueDate);
    event LoanApproved(uint indexed loanId);
    event LoanRejected(uint indexed loanId);
    event LoanRepaid(uint indexed loanId);
    event DueDateRenegotiationRequested(uint indexed loanId, uint requestedDueDate);
    event DueDateRenegotiationApproved(uint indexed loanId, uint newDueDate);

    function requestLoan(address _lender, uint _amount, string memory _collateral, uint _dueDate) public {
        require(_amount > 0, "Loan amount must be greater than 0");
        require(_lender != address(0), "Invalid lender address");
        require(_dueDate > block.timestamp, "Due date must be in the future");

        loanCounter++;
        loans[loanCounter] = Loan(
            loanCounter,
            msg.sender,
            _lender,
            _amount,
            _collateral,
            LoanStatus.Pending,
            block.timestamp,
            _dueDate,
            block.timestamp,
            0,
            false
        );

        userLoans[msg.sender].push(loanCounter);
        userLoans[_lender].push(loanCounter);

        emit LoanRequested(loanCounter, msg.sender, _lender, _amount, _collateral, _dueDate);
    }

    function approveLoan(uint _loanId) public payable {
        Loan storage loan = loans[_loanId];
        require(msg.sender == loan.lender, "Only the lender can approve the loan");
        require(loan.status == LoanStatus.Pending, "Loan is not pending");
        require(msg.value == loan.amount, "Must send the exact loan amount");

        loan.status = LoanStatus.Approved;

        (bool success, ) = loan.borrower.call{value: loan.amount}("");
        require(success, "Transfer to borrower failed");

        loan.lastModifiedAt = block.timestamp;

        emit LoanApproved(_loanId);
    }

    function rejectLoan(uint _loanId) public {
        Loan storage loan = loans[_loanId];
        require(msg.sender == loan.lender, "Only the lender can reject the loan");
        require(loan.status == LoanStatus.Pending, "Loan is not pending");

        loan.status = LoanStatus.Rejected;
        loan.lastModifiedAt = block.timestamp;

        emit LoanRejected(_loanId);
    }

    function repayLoan(uint _loanId) public payable {
        Loan storage loan = loans[_loanId];
        require(msg.sender == loan.borrower, "Only the borrower can repay the loan");
        require(loan.status == LoanStatus.Approved, "Loan is not approved");
        require(msg.value == loan.amount, "Must repay the exact loan amount");
        require(!loan.renegotiationRequested, "Cannot repay while renegotiation is in progress");

        loan.status = LoanStatus.Repaid;

        (bool success, ) = loan.lender.call{value: loan.amount}("");
        require(success, "Transfer to lender failed");

        loan.lastModifiedAt = block.timestamp;

        emit LoanRepaid(_loanId);
    }

    function requestDueDateRenegotiation(uint _loanId, uint _newDueDate) public {
        Loan storage loan = loans[_loanId];
        require(msg.sender == loan.borrower, "Only the borrower can request renegotiation");
        require(loan.status == LoanStatus.Approved, "Loan must be approved to renegotiate");
        require(_newDueDate > block.timestamp, "New due date must be in the future");

        loan.requestedDueDate = _newDueDate;
        loan.renegotiationRequested = true;

        emit DueDateRenegotiationRequested(_loanId, _newDueDate);
    }

    function approveDueDateRenegotiation(uint _loanId) public {
        Loan storage loan = loans[_loanId];
        require(msg.sender == loan.lender, "Only the lender can approve renegotiation");
        require(loan.renegotiationRequested, "Renegotiation not requested");
        require(loan.requestedDueDate > block.timestamp, "New due date must be in the future");

        loan.dueDate = loan.requestedDueDate;
        loan.lastModifiedAt = block.timestamp;
        loan.renegotiationRequested = false;

        emit DueDateRenegotiationApproved(_loanId, loan.dueDate);
    }

    function getAllLoans() public view returns (Loan[] memory) {
        Loan[] memory allLoans = new Loan[](loanCounter);

        for (uint i = 1; i <= loanCounter; i++) {
            allLoans[i - 1] = loans[i];
        }

        return allLoans;
    }

    function getUserLoans(address _user, bool _isBorrower, bool _requests) public view returns (Loan[] memory) {
        uint[] storage loanIds = userLoans[_user];
        uint count = 0;

        for (uint i = 0; i < loanIds.length; i++) {
            Loan storage loan = loans[loanIds[i]];
            bool isUserLoan = (_isBorrower && loan.borrower == _user) || (!_isBorrower && loan.lender == _user);
            bool matchesRequestStatus = (_requests && (loan.status == LoanStatus.Pending || loan.renegotiationRequested)) || 
                                        (!_requests && (loan.status == LoanStatus.Approved || loan.status == LoanStatus.Repaid || loan.status == LoanStatus.Rejected));
            
            if (isUserLoan && matchesRequestStatus) {
                count++;
            }
        }

        Loan[] memory filteredLoans = new Loan[](count);
        count = 0;

        for (uint i = 0; i < loanIds.length; i++) {
            Loan storage loan = loans[loanIds[i]];
            bool isUserLoan = (_isBorrower && loan.borrower == _user) || (!_isBorrower && loan.lender == _user);
            bool matchesRequestStatus = (_requests && (loan.status == LoanStatus.Pending || loan.renegotiationRequested)) || 
                                        (!_requests && (loan.status == LoanStatus.Approved || loan.status == LoanStatus.Repaid || loan.status == LoanStatus.Rejected));
            
            if (isUserLoan && matchesRequestStatus) {
                filteredLoans[count] = loan;
                count++;
            }
        }

        return filteredLoans;
    }
}