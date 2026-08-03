from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from core.brand import (
    create_brand,
    delete_brand,
    get_all_brands,
    get_brand_by_id,
    get_brand_by_name,
    update_brand,
)

from database.dependencies import get_db

from schemas.brand import (
    BrandCreate,
    BrandResponse,
    BrandUpdate,
)

from core.authentication import get_admin_user


router = APIRouter(
    prefix="/brands",
    tags=["Brands"]
)


# --------------------------------------------------------
# Create Brand
# --------------------------------------------------------

@router.post(
    "",
    response_model=BrandResponse,
    status_code=status.HTTP_201_CREATED
)
def create_new_brand(
    brand: BrandCreate,
    db: Session = Depends(get_db),
    admin: dict = Depends(get_admin_user())
):

    existing = get_brand_by_name(db, brand.name)

    if existing:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Brand name already exists."
        )

    return create_brand(db, brand)


# --------------------------------------------------------
# Get All Brands
# --------------------------------------------------------

@router.get(
    "",
    response_model=list[BrandResponse]
)
def get_brands(
    db: Session = Depends(get_db)
):
    return get_all_brands(db)


# --------------------------------------------------------
# Get Brand By ID
# --------------------------------------------------------

@router.get(
    "/{brand_id}",
    response_model=BrandResponse
)
def get_brand(
    brand_id: UUID,
    db: Session = Depends(get_db)
):

    brand = get_brand_by_id(db, brand_id)

    if not brand:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Brand not found."
        )

    return brand


# --------------------------------------------------------
# Update Brand
# --------------------------------------------------------

@router.put(
    "/{brand_id}",
    response_model=BrandResponse
)
def update_existing_brand(
    brand_id: UUID,
    brand: BrandUpdate,
    db: Session = Depends(get_db),
    admin: dict = Depends(get_admin_user())
):

    db_brand = get_brand_by_id(db, brand_id)

    if not db_brand:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Brand not found."
        )

    if (
        brand.name
        and brand.name != db_brand.name
        and get_brand_by_name(db, brand.name)
    ):
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Brand name already exists."
        )

    return update_brand(
        db,
        db_brand,
        brand
    )


# --------------------------------------------------------
# Delete Brand
# --------------------------------------------------------

@router.delete(
    "/{brand_id}",
    status_code=status.HTTP_204_NO_CONTENT
)
def remove_brand(
    brand_id: UUID,
    db: Session = Depends(get_db),
    admin: dict = Depends(get_admin_user())
):

    db_brand = get_brand_by_id(db, brand_id)

    if not db_brand:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Brand not found."
        )

    delete_brand(
        db,
        db_brand
    )

    return