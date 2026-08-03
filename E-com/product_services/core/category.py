from sqlalchemy.orm import Session

from models.category import Category
from schemas.category import CategoryCreate, CategoryUpdate


def create_category(
    db: Session,
    category: CategoryCreate
):
    db_category = Category(
        name=category.name,
        image_url=category.image_url,
        description=category.description,
        is_active=category.is_active
    )

    db.add(db_category)
    db.commit()
    db.refresh(db_category)

    return db_category


def get_all_categories(db: Session):
    return db.query(Category).all()


def get_category_by_id(
    db: Session,
    category_id: str
):
    return (
        db.query(Category)
        .filter(Category.id == category_id)
        .first()
    )


def get_category_by_name(
    db: Session,
    name: str
):
    return (
        db.query(Category)
        .filter(Category.name == name)
        .first()
    )


def update_category(
    db: Session,
    db_category: Category,
    category: CategoryUpdate
):
    update_data = category.model_dump(exclude_unset=True)

    for key, value in update_data.items():
        setattr(db_category, key, value)

    db.commit()
    db.refresh(db_category)

    return db_category


def delete_category(
    db: Session,
    db_category: Category
):
    db.delete(db_category)
    db.commit()