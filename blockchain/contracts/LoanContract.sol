// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract LoanContract {
    // Token details for the loan contract
    string public name = "LoanToken";
    string public symbol = "LTK";

    mapping(address => mapping(address => uint256)) public allowance;

    // Enum to track loan status
    enum LoanStatus { Pending, Approved, Repaid, Rejected }

    // Struct for storing loan details
    struct Loan {
        uint loanId;
        address borrower;
        address lender;
        uint amount;
        string collateral;
        LoanStatus status; // Use enum for status
    }

    uint public loanCounter; // Counter for loan IDs
    mapping(uint => Loan) public loans; // Mapping to store loans by ID
    mapping(address => uint[]) public userLoans; // Mapping to store loans associated with each user

    // Events for logging actions on the blockchain
    event Transfer(address indexed from, address indexed to, uint256 value);
    event LoanRequested(uint loanId, address borrower, address lender, uint amount, string collateral);
    event LoanApproved(uint loanId);
    event LoanRejected(uint loanId);
    event LoanRepaid(uint loanId);

    // Function to request a loan
    function requestLoan(address _lender, uint _amount, string memory _collateral) public {
        require(_amount > 0, "Loan amount must be greater than 0");
        require(_lender != address(0), "Invalid lender address");

        loanCounter++;
        loans[loanCounter] = Loan(loanCounter, msg.sender, _lender, _amount, _collateral, LoanStatus.Pending);
        userLoans[msg.sender].push(loanCounter); // Add loan ID to borrower's list
        userLoans[_lender].push(loanCounter);    // Add loan ID to lender's list

        emit LoanRequested(loanCounter, msg.sender, _lender, _amount, _collateral);
    }

    // Function for the lender to approve a loan and send Ether to the borrower
    function approveLoan(uint _loanId) public payable {
        Loan storage loan = loans[_loanId];
        require(msg.sender == loan.lender, "Only the lender can approve the loan");
        require(loan.status == LoanStatus.Pending, "Loan is not pending");
        require(msg.value == loan.amount, "Must send the exact loan amount");
        loan.status = LoanStatus.Approved;
        (bool success, ) = loan.borrower.call{value: loan.amount}("");
        require(success, "Transfer to borrower failed");
        emit LoanApproved(_loanId);
    }

    // Function for the lender to reject a loan
    function rejectLoan(uint _loanId) public {
        Loan storage loan = loans[_loanId];
        require(msg.sender == loan.lender, "Only the lender can reject the loan");
        require(loan.status == LoanStatus.Pending, "Loan is not pending");
        loan.status = LoanStatus.Rejected;
        emit LoanRejected(_loanId);
    }

    // Function for the borrower to repay a loan and send Ether back to the lender
    function repayLoan(uint _loanId) public payable {
        Loan storage loan = loans[_loanId];
        require(msg.sender == loan.borrower, "Only the borrower can repay the loan");
        require(loan.status == LoanStatus.Approved, "Loan is not approved");
        require(msg.value == loan.amount, "Must repay the exact loan amount");

        loan.status = LoanStatus.Repaid;

        // Transfer the repaid amount to the lender
        (bool success, ) = loan.lender.call{value: loan.amount}("");
        require(success, "Transfer to lender failed");

        emit LoanRepaid(_loanId);
    }

    // Function to get loans of a user (either as borrower or lender)
    function getUserLoans(address _user, bool _isBorrower) public view returns (Loan[] memory) {
        uint[] storage loanIds = userLoans[_user];
        uint count = 0;

        // Count the number of relevant loans for the user
        for (uint i = 0; i < loanIds.length; i++) {
            if ((_isBorrower && loans[loanIds[i]].borrower == _user) || 
                (!_isBorrower && loans[loanIds[i]].lender == _user)) {
                count++;
            }
        }

        // Create an array to hold the user's loans
        Loan[] memory userLoansList = new Loan[](count); // Fixed memory allocation
        uint index = 0;

        // Fill the user's loan list
        for (uint i = 0; i < loanIds.length; i++) {
            if ((_isBorrower && loans[loanIds[i]].borrower == _user) || 
                (!_isBorrower && loans[loanIds[i]].lender == _user)) {
                userLoansList[index] = loans[loanIds[i]];
                index++;
            }
        }
        return userLoansList;
    }
}