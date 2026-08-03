from sqlalchemy.orm import Session

from models.product_image import ProductImage
from schemas.product_image import ProductImageUpdate


def create_product_image(
    db: Session,
    product_id: str,
    image_url: str,
):
    db_image = ProductImage(
        product_id=product_id,
        image_url=image_url,
    )

    db.add(db_image)
    db.commit()
    db.refresh(db_image)

    return db_image


def get_all_product_images(
    db: Session
):
    return db.query(ProductImage).all()


def get_product_image_by_id(
    db: Session,
    image_id: str
):
    return (
        db.query(ProductImage)
        .filter(ProductImage.id == image_id)
        .first()
    )


def get_images_by_product(
    db: Session,
    product_id: str
):
    return (
        db.query(ProductImage)
        .filter(ProductImage.product_id == product_id)
        .order_by(ProductImage.display_order)
        .all()
    )


def update_product_image(
    db: Session,
    db_image: ProductImage,
    image: ProductImageUpdate
):
    update_data = image.model_dump(exclude_unset=True)

    for key, value in update_data.items():
        setattr(db_image, key, value)

    db.commit()
    db.refresh(db_image)

    return db_image


def delete_product_image(
    db: Session,
    db_image: ProductImage
):
    db.delete(db_image)
    db.commit()