from fastapi import Depends, FastAPI, Query, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from .database import get_db, wait_for_db
from .models import User
from .schemas import UserCreate, UserOut
from contextlib import asynccontextmanager


app = FastAPI(title="User Management API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://127.0.0.1:3000",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
@asynccontextmanager
async def lifespan(app: FastAPI):
    # startup
    wait_for_db()
    yield
    # shutdown (if 

#fetch users
@app.get("/users")
def fetch_users(db: Session = Depends(get_db)):
    return db.query(User).all()

#create user
@app.post("/users/create", response_model=UserOut,status_code=201)
def create_user(user: UserCreate, db: Session = Depends(get_db)):
    user = User(
        firstname=user.firstname, 
        lastname=user.lastname, 
        age=user.age, 
        date_of_birth=user.date_of_birth)
    db.add(user)
    db.commit()
    db.refresh(user)
    return user

# delete user
@app.delete("/user")
def delete_user(user_id: int = Query(...,description="Id of user to delete"), db: Session = Depends(get_db)):
    user = db.query(User).filter(User.user_id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    db.delete(user)
    db.commit()
    return {"deleted": True, "user_id": user_id}


