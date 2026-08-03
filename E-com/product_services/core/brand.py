from sqlalchemy.orm import Session

from models.brand import Brand
from schemas.brand import BrandCreate, BrandUpdate


def create_brand(db: Session, brand: BrandCreate):
    db_brand = Brand(
        name=brand.name,
        description=brand.description,
        is_active=brand.is_active
    )

    db.add(db_brand)
    db.commit()
    db.refresh(db_brand)

    return db_brand


def get_all_brands(db: Session):
    return db.query(Brand).all()


def get_brand_by_id(db: Session, brand_id: str):
    return (
        db.query(Brand)
        .filter(Brand.id == brand_id)
        .first()
    )


def get_brand_by_name(db: Session, name: str):
    return (
        db.query(Brand)
        .filter(Brand.name == name)
        .first()
    )


def update_brand(
    db: Session,
    db_brand: Brand,
    brand: BrandUpdate
):
    update_data = brand.model_dump(exclude_unset=True)

    for key, value in update_data.items():
        setattr(db_brand, key, value)

    db.commit()
    db.refresh(db_brand)

    return db_brand


def delete_brand(
    db: Session,
    db_brand: Brand
):
    db.delete(db_brand)
    db.commit()