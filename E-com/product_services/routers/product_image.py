import os
import uuid

from fastapi import (
    APIRouter,
    Depends,
    File,
    Form,
    HTTPException,
    UploadFile,
    status,
)
from sqlalchemy.orm import Session

from database.dependencies import get_db

from core.authentication import get_admin_user

from core.products import get_product_by_id
from core.product_image import (
    create_product_image,
    delete_product_image,
    get_all_product_images,
    get_images_by_product,
    get_product_image_by_id,
    update_product_image,
)

from schemas.product_image import (
    ProductImageResponse,
    ProductImageUpdate,
)

router = APIRouter(
    prefix="/product-images",
    tags=["Product Images"],
)

UPLOAD_FOLDER = "uploads/products"
os.makedirs(UPLOAD_FOLDER, exist_ok=True)


# ===================================================
# Upload Product Image (Admin)
# ===================================================

@router.post(
    "",
    response_model=ProductImageResponse,
    status_code=status.HTTP_201_CREATED,
)
def create_image(
    product_id: str = Form(...),
    image: UploadFile = File(...),
    db: Session = Depends(get_db),
    admin=Depends(get_admin_user())
):

    product = get_product_by_id(db, product_id)

    if not product:
        raise HTTPException(
            status_code=404,
            detail="Product not found."
        )

    extension = os.path.splitext(image.filename)[1]

    filename = f"{uuid.uuid4()}{extension}"

    file_path = os.path.join(
        UPLOAD_FOLDER,
        filename
    )

    with open(file_path, "wb") as buffer:
        buffer.write(image.file.read())

    return create_product_image(
        db=db,
        product_id=product_id,
        image_url=file_path
    )


# ===================================================
# Get All Images
# ===================================================

@router.get(
    "",
    response_model=list[ProductImageResponse]
)
def get_images(
    db: Session = Depends(get_db)
):
    return get_all_product_images(db)


# ===================================================
# Get Image By Id
# ===================================================
from fastapi.responses import FileResponse

@router.get(
    "/{image_id}"
)
def get_image(
    image_id: str,
    db: Session = Depends(get_db)
):

    image = get_product_image_by_id(
        db,
        image_id
    )

    if not image:
        raise HTTPException(
            status_code=404,
            detail="Image not found."
        )

    return FileResponse(image.image_url)



# ===================================================
# Get Images Of A Product
# ===================================================

@router.get(
    "/product/{product_id}",
    response_model=list[ProductImageResponse]
)
def get_product_images(
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

    return get_images_by_product(
        db,
        product_id
    )


# ===================================================
# Update Image (Admin)
# ===================================================

@router.put(
    "/{image_id}",
    response_model=ProductImageResponse
)
def update_image(
    image_id: str,
    image: ProductImageUpdate,
    db: Session = Depends(get_db),
    admin=Depends(get_admin_user())
):

    db_image = get_product_image_by_id(
        db,
        image_id
    )

    if not db_image:
        raise HTTPException(
            status_code=404,
            detail="Image not found."
        )

    return update_product_image(
        db,
        db_image,
        image
    )


# ===================================================
# Delete Image (Admin)
# ===================================================

@router.delete(
    "/{image_id}",
    status_code=status.HTTP_204_NO_CONTENT
)
def delete_image(
    image_id: str,
    db: Session = Depends(get_db),
    admin=Depends(get_admin_user())
):

    db_image = get_product_image_by_id(
        db,
        image_id
    )

    if not db_image:
        raise HTTPException(
            status_code=404,
            detail="Image not found."
        )

    delete_product_image(
        db,
        db_image
    )