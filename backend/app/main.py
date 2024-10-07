from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.routes import auth, friends, loans

app = FastAPI()

# Allow CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allows all origins
    allow_credentials=True,
    allow_methods=["*"],  # Allows all methods
    allow_headers=["*"],  # Allows all headers
)

app.include_router(auth.router, prefix="/auth", tags=["auth"])
app.include_router(friends.router, prefix="/friends", tags=["friends"])
app.include_router(loans.router, prefix="/loans", tags=["loans"])

@app.get("/")
def read_root():
    return {"message": "Welcome to the P2P Lending Tracker API"}
