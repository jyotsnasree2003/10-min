from fastapi import APIRouter, Depends, HTTPException, Response
from schema.admin_schema import ModifyUser, GetUserResponse
from auth.role import required_role
from sqlalchemy import or_
from models.usermodel import UserModel
from database.connection import Session
from database.dependencies import get_db
from uuid import UUID
from auth.security import get_current_user
from auth.password import hash_password
from auth.role import required_role

router = APIRouter()

@router.get('/', response_model=list[GetUserResponse])
def get_user_and_seller(db: Session= Depends(get_db), user: dict = Depends(required_role("Admin", "admin"))):
    db_data = db.query(UserModel).filter(or_(
            UserModel.role == "customer",
            UserModel.role == "inventory manager"
        )).all()
    return db_data

@router.get('/inventory_mgr', response_model=list[GetUserResponse])
def get_seller(db: Session= Depends(get_db), user: dict = Depends(required_role("Admin", "admin"))):
    db_data = db.query(UserModel).filter(
            UserModel.role == "inventory manager"
        ).all()
    return db_data

@router.get('/customer', response_model=list[GetUserResponse])
def get_customer(db: Session= Depends(get_db), user: dict = Depends(required_role("Admin", "admin"))):
    db_data = db.query(UserModel).filter(
            UserModel.role == "customer"
        ).all()
    return db_data
    

@router.get('/{id}', response_model=GetUserResponse)
def get_user(id: UUID, db: Session = Depends(get_db), user: dict = Depends(required_role("Admin", "admin"))):
    db_data =  db.query(UserModel).get(UserModel,id)
    print(db_data)
    return db_data

@router.patch('/{id}', response_model=GetUserResponse)
def role_change(data: ModifyUser,id: UUID ,user: dict = Depends(required_role("Admin", "admin")), db : Session = Depends(get_db)):
    user_data = data.model_dump(exclude_unset=True)
    db_data =  db.query(UserModel).filter(UserModel.id==id).first()
    for key, value in user_data.items():
        setattr(db_data, key, value)
    db.commit()
    db.refresh(db_data)
    return db_data

@router.delete('/inventory_mgr/{id}')
def remove_seller(id: UUID, user: dict = Depends(required_role("Admin", "admin")), db: Session= Depends(get_db)):
    db_data = db.query(UserModel).filter(
        (UserModel.id==id),(UserModel.role=="inventory manager")
        ).first()
    if not db_data:
        raise HTTPException(404, detail="user not found")
    else:
        db.delete(db_data)
        db.commit()
    return Response({'message': "user removed successfully"}, status_code=200)

@router.delete('/customer/{id}')
def remove_customer(id: UUID, user: dict = Depends(required_role("Admin", "admin")), db: Session= Depends(get_db)):
    db_data = db.query(UserModel).filter(
        (UserModel.id==id),(UserModel.role=="customer")
        ).first()
    if not db_data:
        raise HTTPException(404, detail="user not found")
    else:
        db.delete(db_data)
        db.commit()
    return Response({'message': "user removed successfully"})


