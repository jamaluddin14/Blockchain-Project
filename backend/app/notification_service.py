from fastapi import FastAPI
from apscheduler.schedulers.background import BackgroundScheduler
from datetime import datetime, timedelta
from app.utils import loan_contract, db, send_notification  # Import the notification function

scheduler = BackgroundScheduler()

# Function to check loans and send notifications
def check_due_loans():
    now = datetime.now()
    due_date_threshold = now + timedelta(days=2)

    try:
        # Call the contract function to get all loans
        all_loans = loan_contract.functions.getAllLoans().call()

        # Iterate through loans and check due dates
        for loan in all_loans:
            loan_id = loan[0]
            due_date = datetime.fromtimestamp(loan[7])  # Assuming loan[7] is the due date as a timestamp
            borrower_public_key = loan[1]  # Assuming loan[1] is the borrower's public key
            lender_public_key = loan[2]    # Assuming loan[2] is the lender's public key

            # If due date is less than two days from now, send notification
            if due_date < due_date_threshold:
                # Fetch borrower details from the database
                borrower = db.users.find_one({"public_key": borrower_public_key})
                # Fetch lender details from the database to get the lender's name
                lender = db.users.find_one({"public_key": lender_public_key})

                if borrower and lender:
                    lender_name = lender.get('name', 'Your lender')  # Get lender's name or default
                    fcm_tokens = borrower.get('FCM_token', [])  # Get the FCM tokens as a list

                    # Send notification to each token
                    for fcm_token in fcm_tokens:
                        if fcm_token:  # Check if the FCM token exists
                            message = f"Don't forget to pay your loan due on {due_date.strftime('%Y-%m-%d')} from {lender_name}."
                            send_notification(fcm_token, "Loan Due", message)

    except Exception as e:
        pass  # Handle exceptions silently or as needed

# Function to start the scheduler
def start_scheduler():
    # Run the loan check immediately
    check_due_loans()  # Execute immediately on startup

    # Start the background scheduler
    scheduler.add_job(check_due_loans, 'interval', minutes=60)  # Check every 2 minutes
    scheduler.start()

# Function to shut down the scheduler
def shutdown_scheduler():
    scheduler.shutdown()
