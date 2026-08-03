from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from core.category import (
    create_category,
    delete_category,
    get_all_categories,
    get_category_by_id,
    get_category_by_name,
    update_category,
)

from database.dependencies import get_db

from schemas.category import (
    CategoryCreate,
    CategoryResponse,
    CategoryUpdate,
)

from core.authentication import get_admin_user


router = APIRouter(
    prefix="/categories",
    tags=["Categories"]
)


# --------------------------------------------------------
# Create Category
# --------------------------------------------------------

@router.post(
    "",
    response_model=CategoryResponse,
    status_code=status.HTTP_201_CREATED
)
def create_new_category(
    category: CategoryCreate,
    db: Session = Depends(get_db),
    admin: dict = Depends(get_admin_user())
):

    existing = get_category_by_name(db, category.name)

    if existing:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Category name already exists."
        )

    return create_category(db, category)


# --------------------------------------------------------
# Get All Categories
# --------------------------------------------------------

@router.get(
    "",
    response_model=list[CategoryResponse]
)
def get_categories(
    db: Session = Depends(get_db)
):
    return get_all_categories(db)


# --------------------------------------------------------
# Get Category By ID
# --------------------------------------------------------

@router.get(
    "/{category_id}",
    response_model=CategoryResponse
)
def get_category(
    category_id: UUID,
    db: Session = Depends(get_db)
):

    category = get_category_by_id(db, category_id)

    if not category:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Category not found."
        )

    return category


# --------------------------------------------------------
# Update Category
# --------------------------------------------------------

@router.put(
    "/{category_id}",
    response_model=CategoryResponse
)
def update_existing_category(
    category_id: UUID,
    category: CategoryUpdate,
    db: Session = Depends(get_db),
    admin: dict = Depends(get_admin_user())
):

    db_category = get_category_by_id(db, category_id)

    if not db_category:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Category not found."
        )

    if (
        category.name
        and category.name != db_category.name
        and get_category_by_name(db, category.name)
    ):
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Category name already exists."
        )

    return update_category(
        db,
        db_category,
        category
    )


# --------------------------------------------------------
# Delete Category
# --------------------------------------------------------

@router.delete(
    "/{category_id}",
    status_code=status.HTTP_204_NO_CONTENT
)
def remove_category(
    category_id: UUID,
    db: Session = Depends(get_db),
    admin: dict = Depends(get_admin_user())
):

    db_category = get_category_by_id(db, category_id)

    if not db_category:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Category not found."
        )

    delete_category(
        db,
        db_category
    )

    return