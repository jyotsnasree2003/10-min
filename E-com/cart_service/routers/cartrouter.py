from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from uuid import UUID

from database.connection import get_db
from models.cartmodel import CartModel
from schemas.cartschema import CartCreate, CartUpdate, CartResponse
from core.authentication import get_current_user   

router = APIRouter(prefix="/cart", tags=["Cart"])


# -------------------- Add Item --------------------
@router.post("/", response_model=CartResponse, status_code=status.HTTP_201_CREATED)
def add_to_cart(
    cart: CartCreate,
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    user_id = current_user["user_id"]

    cart_item = CartModel(
        user_id=user_id,
        product_id=cart.product_id,
        warehouse_id=cart.warehouse_id,
        quantity=cart.quantity,
        price=cart.price,
    )

    db.add(cart_item)
    db.commit()
    db.refresh(cart_item)

    return cart_item


# -------------------- Get All Cart Items --------------------
@router.get("/", response_model=list[CartResponse])
def get_cart(
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    user_id = current_user["user_id"]

    cart_items = db.query(CartModel).filter(
        CartModel.user_id == user_id
    ).all()

    return cart_items


# -------------------- Get One Cart Item --------------------
@router.get("/{cart_id}", response_model=CartResponse)
def get_cart_item(
    cart_id: UUID,
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    user_id = current_user["user_id"]

    cart_item = db.query(CartModel).filter(
        CartModel.id == cart_id,
        CartModel.user_id == user_id
    ).first()

    if not cart_item:
        raise HTTPException(
            status_code=404,
            detail="Cart item not found"
        )

    return cart_item


# -------------------- Update Quantity --------------------
@router.put("/{cart_id}", response_model=CartResponse)
def update_cart_item(
    cart_id: UUID,
    cart: CartUpdate,
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    user_id = current_user["user_id"]

    cart_item = db.query(CartModel).filter(
        CartModel.id == cart_id,
        CartModel.user_id == user_id
    ).first()

    if not cart_item:
        raise HTTPException(
            status_code=404,
            detail="Cart item not found"
        )

    cart_item.quantity = cart.quantity

    db.commit()
    db.refresh(cart_item)

    return cart_item


# -------------------- Delete One Cart Item --------------------
@router.delete("/{cart_id}")
def delete_cart_item(
    cart_id: UUID,
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    user_id = current_user["user_id"]

    cart_item = db.query(CartModel).filter(
        CartModel.id == cart_id,
        CartModel.user_id == user_id
    ).first()

    if not cart_item:
        raise HTTPException(
            status_code=404,
            detail="Cart item not found"
        )

    db.delete(cart_item)
    db.commit()

    return {
        "message": "Cart item deleted successfully"
    }


# -------------------- Clear Entire Cart --------------------
@router.delete("/")
def clear_cart(
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    user_id = current_user["user_id"]

    db.query(CartModel).filter(
        CartModel.user_id == user_id
    ).delete()

    db.commit()

    return {
        "message": "Cart cleared successfully"
    }