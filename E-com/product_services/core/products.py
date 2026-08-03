from sqlalchemy.orm import Session

from models.products import Product
from schemas.products import ProductCreate, ProductUpdate



def get_product_by_id(
    db: Session,
    product_id: str
):
    return (
        db.query(Product)
        .filter(Product.id == product_id)
        .first()
    )


def get_product_by_name(
    db: Session,
    name: str
):
    return (
        db.query(Product)
        .filter(Product.name == name)
        .first()
    )


def get_all_products(
    db: Session
):
    return db.query(Product).all()


def create_product(
    db: Session,
    product: ProductCreate
):
    db_product = Product(
        **product.model_dump()
    )

    db.add(db_product)
    db.commit()
    db.refresh(db_product)

    return db_product


def update_product(
    db: Session,
    db_product: Product,
    product: ProductUpdate
):
    update_data = product.model_dump(exclude_unset=True)

    for key, value in update_data.items():
        setattr(db_product, key, value)

    db.commit()
    db.refresh(db_product)

    return db_product


def delete_product(
    db: Session,
    db_product: Product
):
    db.delete(db_product)
    db.commit()


def get_products_by_category(db: Session, category_id: str):
    return (
        db.query(Product)
        .filter(Product.category_id == category_id)
        .all()
    )


def get_products_by_brand(db: Session, brand_id: str):
    return (
        db.query(Product)
        .filter(Product.brand_id == brand_id)
        .all()
    )