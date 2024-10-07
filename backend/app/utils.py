from passlib.context import CryptContext
from datetime import datetime, timedelta
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from jose import JWTError, jwt
from app.models import User
from app.database import db
from web3 import Web3
import json
import os
import hashlib
from base64 import b64encode, b64decode
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()

# Configure password hashing
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# JWT settings
SECRET_KEY = os.getenv("SECRET_KEY")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 30
# Web3 settings
ganache_url = os.getenv("GANACHE_URL")
web3 = Web3(Web3.HTTPProvider(ganache_url))

# Load contract ABI and address
contract_address = web3.to_checksum_address(os.getenv("CONTRACT_ADDRESS"))
contract_abi_path = os.getenv("CONTRACT_ABI_PATH")
with open(contract_abi_path) as f:
    contract_abi = json.load(f)["abi"]

loan_contract = web3.eth.contract(address=contract_address, abi=contract_abi)

# Password hashing functions
def verify_password(plain_password, hashed_password):
    return pwd_context.verify(plain_password, hashed_password)

def get_password_hash(password):
    return pwd_context.hash(password)

# Encode private key function
def encode_private_key(private_key: str) -> str:
    return b64encode(private_key.encode()).decode('utf-8')

# Decode private key function
def decode_private_key(encoded_key: str) -> str:
    return b64decode(encoded_key).decode('utf-8')

# JWT token creation function
def create_access_token(data: dict, expires_delta: timedelta = None):
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

# OAuth2 scheme
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="auth/login")

# Get current user function
def get_current_user(token: str = Depends(oauth2_scheme)):
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        username: str = payload.get("sub")
        if username is None:
            raise credentials_exception
    except JWTError:
        raise credentials_exception
    user = db.users.find_one({"username": username})
    if user is None:
        raise credentials_exception
    print(user)
    return User(**user)

# Send transaction function
def send_transaction(function, public_address,value=0):
    # Get the nonce using the public address
    nonce = web3.eth.get_transaction_count(web3.to_checksum_address(public_address))
    gas_price = web3.eth.gas_price  # get current gas price
    txn = function.build_transaction({
    'gas': 3000000,
    'nonce': nonce,
    'value': value,
    'gasPrice': gas_price
    })
    return txn