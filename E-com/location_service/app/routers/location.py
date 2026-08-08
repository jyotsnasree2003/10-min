from typing import Optional

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app import models, schemas
from app.database import get_db
from app.geofence import point_in_polygon
from app.geohash_utils import get_candidate_hashes

router = APIRouter(prefix="/location", tags=["Location"])


def find_serving_warehouse(
    db: Session,
    lat: float,
    lng: float
) -> Optional[models.Warehouse]:
    """
    Two-phase lookup:

    Phase 1 — Geohash filter (fast)
        Compute the user's geohash cell + 8 neighbors.
        Keep only warehouses whose stored geohash_cells overlap
        with that set.  This cuts the candidate pool from ALL
        warehouses down to the 1-3 that are geographically close.

    Phase 2 — Precise polygon check (Shapely)
        Run point_in_polygon only on the filtered candidates.
        This is the expensive step, but now it runs on a tiny set.

    Fallback: if a warehouse has no geohash_cells stored (e.g. it was
    created before this feature was deployed), it is included as a
    candidate automatically so nothing is silently dropped.
    """

    user_hashes = get_candidate_hashes(lat, lng)

    active_warehouses = (
        db.query(models.Warehouse)
        .filter(models.Warehouse.is_active == True)
        .all()
    )

    print(f"[resolve] user=({lat}, {lng})  "
          f"total_active={len(active_warehouses)}  "
          f"user_hashes={user_hashes}")

    # ── Phase 1: geohash pre-filter ──────────────────────────────
    candidates = []
    for wh in active_warehouses:
        if wh.geohash_cells:
            warehouse_hashes = set(wh.geohash_cells)
            if user_hashes & warehouse_hashes:       # set intersection
                candidates.append(wh)
                print(f"  [geohash HIT]  {wh.name}")
            else:
                print(f"  [geohash MISS] {wh.name}")
        else:
            # No cells stored → include as fallback candidate
            candidates.append(wh)
            print(f"  [geohash SKIP] {wh.name} (no cells stored, included as fallback)")

    print(f"[resolve] candidates after geohash filter: {len(candidates)}")

    # ── Phase 2: precise polygon check ───────────────────────────
    for wh in candidates:
        if not wh.geofence or len(wh.geofence) < 3:
            print(f"  [polygon SKIP] {wh.name} — invalid geofence")
            continue
        try:
            if point_in_polygon(lat, lng, wh.geofence):
                print(f"  [polygon MATCH] {wh.name}")
                return wh
        except Exception as e:
            print(f"  [polygon ERROR] {wh.name} — {e}")

    print("[resolve] no warehouse matched")
    return None


@router.post("/resolve", response_model=schemas.ResolveResponse)
def resolve_location(
    payload: schemas.ResolveRequest,
    db: Session = Depends(get_db)
):
    warehouse = find_serving_warehouse(db, payload.lat, payload.lng)

    if warehouse:
        return schemas.ResolveResponse(
            serviceable=True,
            warehouse_id=str(warehouse.id),
            warehouse_name=warehouse.name,
        )

    return schemas.ResolveResponse(
        serviceable=False,
        warehouse_id=None,
        warehouse_name=None,
    )
