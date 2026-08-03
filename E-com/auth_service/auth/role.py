from fastapi import status, Depends, HTTPException
from .security import get_current_user

def required_role(*role):
    def role_checker(user=Depends(get_current_user)):
        if user['role'] not in role:
            raise HTTPException(
               status_code=status.HTTP_403_FORBIDDEN,
               detail="permission denied" 
            )
        return user
    return role_checker