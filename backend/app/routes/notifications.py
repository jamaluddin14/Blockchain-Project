from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field
from typing import List
from uuid import uuid4
from app.utils import send_notification
from app.utils import User, get_current_user
from app.utils import db
router = APIRouter()


# Define a Pydantic model for the notification request
class NotificationRequest(BaseModel):
    to: str
    title: str
    body: str
class AddToken(BaseModel):
    token: str

@router.post("/send")
async def send_notification_route(notification_request: NotificationRequest):
    """
    Send a notification to a specific user.
    """
    token=db.users.find_one({"_id": notification_request.to})
    if token is None:
        raise HTTPException(status_code=404, detail="User not found.")

    if 'FCM_token' not in token or len(token['FCM_token'])==0:
        raise HTTPException(status_code=400, detail="FCM token is required.")
    for i in token["FCM_token"]:
        send_notification(i, notification_request.title, notification_request.body)
    return {"detail": "Notification sent successfully."}

@router.post("/store-token")
async def store_token(token: AddToken, current_user: User = Depends(get_current_user)):
    """
    Store the FCM token for the current user.
    """
    token=token.token
    if not token:
        raise HTTPException(status_code=400, detail="FCM token is required.")
    
    user=db.users.find_one({"_id": current_user.id})
    if "FCM_token" not in user:
        db.users.update_one({"_id": current_user.id}, {"$set": {"FCM_token": [token]}})
    elif token in user["FCM_token"]:
        return {"detail": "FCM token already stored."}
    else:
        db.users.update_one({"_id": current_user.id}, {"$push": {"FCM_token": token}})
    return {"detail": "FCM token stored successfully."}


class NotificationInDB(BaseModel):
    id:str=Field(default_factory=uuid4, alias="_id")
    user_id: str
    title: str
    body: str
    timestamp: int

@router.post("/store")
async def store_notification(notification: NotificationRequest):
    """
    Store a notification in the database.
    """
    user=db.users.find_one({"FCM_token":{ "$in": [notification.to]}})
    if not user:
        raise HTTPException(status_code=404, detail="User not found.")
    notification=notification.dict()
    notification["user_id"]=user["_id"]
    notification["_id"]=str(uuid4())
    notification.pop("to")
    db.notifications.insert_one(notification)
    return {"detail": "Notification stored successfully."}

@router.get("/list")
async def list_notifications(current_user: User = Depends(get_current_user)):
    """
    List all notifications for the current user.
    """
    notifications = db.notifications.find({"user_id": current_user.id})
    print(notifications)
    return[notification for notification in notifications]

@router.delete("/delete/{notification_id}")
async def delete_notification(notification_id: str, current_user: User = Depends(get_current_user)):
    """
    Delete a notification by ID.
    """
    notification = db.notifications.find_one({"_id": notification_id})
    if not notification:
        raise HTTPException(status_code=404, detail="Notification not found.")
    if notification["user_id"] != current_user.id:
        raise HTTPException(status_code=403, detail="You are not authorized to delete this notification.")
    db.notifications.delete_one({"_id": notification_id})
    return {"detail": "Notification deleted successfully."}