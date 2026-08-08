import geohash2 as gh
from typing import List, Set

# Precision 6 = ~1.2km x 0.6km per cell
# Good fit for dark-store / warehouse delivery zones
PRECISION = 6


def encode(lat: float, lng: float) -> str:
    """Encode a lat/lng to a geohash string."""
    return gh.encode(lat, lng, PRECISION)


def get_neighbors(geohash_str: str) -> List[str]:
    """
    Return the geohash cell + its 8 surrounding neighbors.
    Uses bounding-box offsets so we never miss a point sitting
    right on a cell boundary.
    """
    lat, lng, lat_err, lng_err = gh.decode_exactly(geohash_str)

    cells: Set[str] = {geohash_str}

    offsets = [
        ( lat_err * 2.5,  0),
        (-lat_err * 2.5,  0),
        ( 0,  lng_err * 2.5),
        ( 0, -lng_err * 2.5),
        ( lat_err * 2.5,  lng_err * 2.5),
        ( lat_err * 2.5, -lng_err * 2.5),
        (-lat_err * 2.5,  lng_err * 2.5),
        (-lat_err * 2.5, -lng_err * 2.5),
    ]

    for dlat, dlng in offsets:
        cells.add(gh.encode(lat + dlat, lng + dlng, PRECISION))

    return list(cells)


def compute_warehouse_geohashes(
    lat: float,
    lng: float,
    geofence: List[List[float]],
) -> List[str]:
    """
    Compute all geohash cells that this warehouse's geofence could touch.

    Strategy:
      1. Encode the warehouse center + all geofence vertices.
      2. For each encoded cell, also include its 8 neighbors.

    This guarantees full coverage: even if a user sits on the edge of
    a geohash cell boundary, they will still match a candidate warehouse
    before the precise Shapely polygon check runs.
    """
    cells: Set[str] = set()

    # Center of warehouse
    center_hash = encode(lat, lng)
    cells.update(get_neighbors(center_hash))

    # Every vertex of the geofence polygon
    for point in geofence:
        vertex_hash = encode(point[0], point[1])
        cells.update(get_neighbors(vertex_hash))

    return list(cells)


def get_candidate_hashes(lat: float, lng: float) -> Set[str]:
    """
    Return the user's geohash cell + its 8 neighbors.
    Matching any of these against a warehouse's stored geohash_cells
    gives us a fast candidate set before the expensive polygon check.
    """
    user_hash = encode(lat, lng)
    return set(get_neighbors(user_hash))
