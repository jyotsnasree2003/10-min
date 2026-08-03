from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from database.dependencies import get_db
from core.authentication import get_admin_user

from core.brand import get_brand_by_id
from core.category import get_category_by_id
from core.products import (
    create_product,
    delete_product,
    get_all_products,
    get_product_by_id,
    get_product_by_name,
    update_product,
    get_products_by_category,
    get_products_by_brand,
)

from schemas.products import (
    ProductCreate,
    ProductResponse,
    ProductUpdate,
)

router = APIRouter(
    prefix="/products",
    tags=["Products"]
)

# =====================================================
# Create Product (Admin)
# =====================================================

@router.post(
    "",
    response_model=ProductResponse,
    status_code=status.HTTP_201_CREATED,
)
def create_new_product(
    product: ProductCreate,
    db: Session = Depends(get_db),
    admin=Depends(get_admin_user())
):

    if not get_brand_by_id(db, product.brand_id):
        raise HTTPException(
            status_code=404,
            detail="Brand not found."
        )

    if not get_category_by_id(db, product.category_id):
        raise HTTPException(
            status_code=404,
            detail="Category not found."
        )

    if get_product_by_name(db, product.name):
        raise HTTPException(
            status_code=409,
            detail="Product name already exists."
        )

    return create_product(db, product)


# =====================================================
# Get All Products
# =====================================================

@router.get(
    "",
    response_model=list[ProductResponse]
)
def get_products(
    db: Session = Depends(get_db)
):
    return get_all_products(db)


# =====================================================
# Get Product By Id
# Used by Inventory Service
# =====================================================

@router.get(
    "/{product_id}",
    response_model=ProductResponse
)
def get_product(
    product_id: str,
    db: Session = Depends(get_db)
):

    product = get_product_by_id(
        db,
        product_id
    )

    if not product:
        raise HTTPException(
            status_code=404,
            detail="Product not found."
        )

    return product
# =====================================================
# Get Products By Category
# =====================================================

@router.get(
    "/category/{category_id}",
    response_model=list[ProductResponse]
)
def get_products_category(
    category_id: str,
    db: Session = Depends(get_db)
):
    if not get_category_by_id(db, category_id):
        raise HTTPException(
            status_code=404,
            detail="Category not found."
        )

    return get_products_by_category(
        db,
        category_id
    )
# =====================================================
# Get Products By Brand
# =====================================================

@router.get(
    "/brand/{brand_id}",
    response_model=list[ProductResponse]
)
def get_products_brand(
    brand_id: str,
    db: Session = Depends(get_db)
):
    # print(brand_id)
    # print(get_products_by_brand(
    #         db,
    #         brand_id
    #     ))
    # print ("******************")
    if not get_brand_by_id(db, brand_id):
        raise HTTPException(
            status_code=404,
            detail="Brand not found."
        )
    
    return get_products_by_brand(
        db,
        brand_id
    )


# =====================================================
# Update Product (Admin)
# =====================================================

@router.put(
    "/{product_id}",
    response_model=ProductResponse
)
def update_existing_product(
    product_id: str,
    product: ProductUpdate,
    db: Session = Depends(get_db),
    admin=Depends(get_admin_user())
):

    db_product = get_product_by_id(
        db,
        product_id
    )

    if not db_product:
        raise HTTPException(
            status_code=404,
            detail="Product not found."
        )

    if (
        product.brand_id
        and not get_brand_by_id(db, product.brand_id)
    ):
        raise HTTPException(
            status_code=404,
            detail="Brand not found."
        )

    if (
        product.category_id
        and not get_category_by_id(db, product.category_id)
    ):
        raise HTTPException(
            status_code=404,
            detail="Category not found."
        )

    if product.name:
        existing = get_product_by_name(
            db,
            product.name
        )

        if existing and existing.id != db_product.id:
            raise HTTPException(
                status_code=409,
                detail="Product name already exists."
            )

    return update_product(
        db,
        db_product,
        product
    )


# =====================================================
# Delete Product (Admin)
# =====================================================

@router.delete(
    "/{product_id}",
    status_code=status.HTTP_204_NO_CONTENT
)
def remove_product(
    product_id: str,
    db: Session = Depends(get_db),
    admin=Depends(get_admin_user())
):

    db_product = get_product_by_id(
        db,
        product_id
    )

    if not db_product:
        raise HTTPException(
            status_code=404,
            detail="Product not found."
        )

    delete_product(
        db,
        db_product
    )

    return