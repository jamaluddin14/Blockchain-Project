from fastapi import APIRouter, Depends, HTTPException, status
from app.schemas import UserResponse,AddFriendRequest
from app.models import User
from app.database import db
from app.utils import get_current_user
from typing import List

router = APIRouter()

@router.post("/", response_model=UserResponse)
def add_friend(friend:AddFriendRequest, current_user: User = Depends(get_current_user)):
    friend_id = friend.friend_id
    if friend_id == current_user.id:
        raise HTTPException(status_code=400, detail="You cannot add yourself as a friend")
    friend = db.users.find_one({"_id": friend_id})
    if not friend:
        raise HTTPException(status_code=404, detail="Friend not found")
    if friend_id in current_user.friends:
        raise HTTPException(status_code=400, detail="Friend already added")
    db.users.update_one({"_id": current_user.id}, {"$push": {"friends": friend_id}})
    db.users.update_one({"_id": friend_id}, {"$push": {"friends": current_user.id}})
    return UserResponse(**friend)

@router.get("/",response_model=List[UserResponse])
def list_friends(current_user: User = Depends(get_current_user)):
    friends_ids = current_user.friends
    if not friends_ids:
        return []

    friends = db.users.find({"_id": {"$in": friends_ids}})
    friends_list = []
    for friend in friends:
        friend["_id"] = str(friend["_id"])  # Convert ObjectId to string
        friends_list.append(UserResponse(**friend))

    return friends_list

@router.get("/search", response_model=List[UserResponse])
def search_friends(query: str, current_user: User = Depends(get_current_user)):
    # Define the search criteria
    search_criteria = {
        "$or": [
            {"username": {"$regex": query, "$options": "i"}},
            {"email": {"$regex": query, "$options": "i"}}
        ]
    }
    
    # Retrieve users matching the search criteria
    users = db.users.find(search_criteria)
    
    # Get the IDs of the current user's friends
    friends_ids = set(current_user.friends)  # Convert to set for faster lookup

    # Filter users to exclude those who are already friends or the current user
    filtered_users = [
        UserResponse(**user) 
        for user in users 
        if user["_id"] not in friends_ids and user["_id"] != current_user.id
    ]

    return filtered_users


@router.get("/top-scorers", response_model=List[UserResponse])
def top_scorers(current_user: User = Depends(get_current_user)):
    # Retrieve users excluding current user's friends and the current user
    users = db.users.find({
        "_id": {
            "$nin": current_user.friends + [current_user.id]  # Exclude friends and current user
        }
    }).sort("score", -1).limit(10)

    # Filter users to ensure they are not friends or the current user
    filtered_users = [
        UserResponse(**user) 
        for user in users 
        if user["_id"] not in current_user.friends and user["_id"] != current_user.id
    ]

    return filtered_users