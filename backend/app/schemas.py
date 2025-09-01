from pydantic import BaseModel, Field
from datetime import date

class UserCreate(BaseModel):
    firstname: str = Field(..., min_length=1)
    lastname: str = Field(..., min_length=1)
    age: int = Field(..., ge=0)
    date_of_birth: date

class UserOut(BaseModel):
    user_id: int
    firstname: str
    lastname: str
    age: int
    date_of_birth: date

    class Config:
        orm_mode = True
