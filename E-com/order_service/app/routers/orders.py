from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from uuid import UUID

from app.database import get_db
from app.models.ordermodel import Order
from app.models.orderitemmodel import OrderItem
from app.schemas import (
    OrderCreate,
    OrderResponse,
)
from app.auth import (
    get_admin_user,
    get_customer_user,
    get_authenticated_user,
)
from app.schemas import (
    OrderStatusUpdate,
    PaymentStatusUpdate,
)

router = APIRouter(
    prefix="/orders",
    tags=["Orders"]
)


# ======================================================
# CREATE ORDER (Customer Only)
# ======================================================
@router.post(
    "/",
    response_model=OrderResponse,
    status_code=status.HTTP_201_CREATED,
)
def create_order(
    order: OrderCreate,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_customer_user()),
):

    total_amount = 0

    new_order = Order(
        user_id=current_user["id"],
        warehouse_id=order.warehouse_id,
        delivery_address=order.delivery_address,
        payment_method=order.payment_method,
        payment_status="Pending",
        order_status="Pending",
        total_amount=0,
    )

    db.add(new_order)
    db.flush()

    order_items = []

    for item in order.items:

        subtotal = item.quantity * item.price
        total_amount += subtotal

        order_item = OrderItem(
            order_id=new_order.id,
            product_id=item.product_id,
            quantity=item.quantity,
            price=item.price,
            subtotal=subtotal,
        )

        db.add(order_item)
        order_items.append(order_item)

    new_order.total_amount = total_amount

    db.commit()
    db.refresh(new_order)

    return {
        **new_order.__dict__,
        "items": order_items,
    }


# ======================================================
# GET ALL ORDERS (ADMIN ONLY)
# ======================================================
@router.get(
    "/",
    response_model=list[OrderResponse],
)
def get_all_orders(
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_admin_user()),
):

    orders = db.query(Order).all()

    response = []

    for order in orders:

        items = (
            db.query(OrderItem)
            .filter(OrderItem.order_id == order.id)
            .all()
        )

        response.append(
            {
                **order.__dict__,
                "items": items,
            }
        )

    return response


# ======================================================
# GET MY ORDERS
# ======================================================
@router.get(
    "/my-orders",
    response_model=list[OrderResponse],
)
def get_my_orders(
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_authenticated_user()),
):

    orders = (
        db.query(Order)
        .filter(Order.user_id == current_user["id"])
        .all()
    )

    response = []

    for order in orders:

        items = (
            db.query(OrderItem)
            .filter(OrderItem.order_id == order.id)
            .all()
        )

        response.append(
            {
                **order.__dict__,
                "items": items,
            }
        )

    return response


# ======================================================
# GET ORDER BY ID
# (Customer can view own order, Admin can view any order)
# ======================================================
@router.get(
    "/{order_id}",
    response_model=OrderResponse,
)
def get_order_by_id(
    order_id: UUID,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_authenticated_user()),
):

    order = db.query(Order).filter(Order.id == order_id).first()

    if not order:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Order not found",
        )

    if (
        current_user["role"].lower() != "admin"
        and str(order.user_id) != current_user["id"]
    ):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You are not authorized to view this order",
        )

    items = (
        db.query(OrderItem)
        .filter(OrderItem.order_id == order.id)
        .all()
    )

    return {
        **order.__dict__,
        "items": items,
    }


# ======================================================
# UPDATE ORDER STATUS (ADMIN ONLY)
# ======================================================
@router.put(
    "/{order_id}/status",
    response_model=OrderResponse,
)
def update_order_status(
    order_id: UUID,
    status_update: OrderStatusUpdate,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_admin_user()),
):

    order = db.query(Order).filter(Order.id == order_id).first()

    if not order:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Order not found",
        )

    order.order_status = status_update.order_status

    db.commit()
    db.refresh(order)

    items = (
        db.query(OrderItem)
        .filter(OrderItem.order_id == order.id)
        .all()
    )

    return {
        **order.__dict__,
        "items": items,
    }


# ======================================================
# UPDATE PAYMENT STATUS (ADMIN ONLY)
# ======================================================
@router.put(
    "/{order_id}/payment",
    response_model=OrderResponse,
)
def update_payment_status(
    order_id: UUID,
    payment_update: PaymentStatusUpdate,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_admin_user()),
):

    order = db.query(Order).filter(Order.id == order_id).first()

    if not order:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Order not found",
        )

    order.payment_status = payment_update.payment_status

    db.commit()
    db.refresh(order)

    items = (
        db.query(OrderItem)
        .filter(OrderItem.order_id == order.id)
        .all()
    )

    return {
        **order.__dict__,
        "items": items,
    }


# ======================================================
# DELETE ORDER (ADMIN ONLY)
# ======================================================
@router.delete(
    "/{order_id}",
    status_code=status.HTTP_200_OK,
)
def delete_order(
    order_id: UUID,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_admin_user()),
):

    order = db.query(Order).filter(Order.id == order_id).first()

    if not order:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Order not found",
        )

    db.delete(order)
    db.commit()

    return {
        "message": "Order deleted successfully"
    }