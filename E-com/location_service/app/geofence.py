from typing import List, Sequence
from shapely.geometry import Point, Polygon
def point_in_polygon(lat: float, lng: float, polygon_points: Sequence[Sequence[float]]):
    """
    Shapely works in (x, y) = (lng, lat) order, so we flip the pairs before
    building the Polygon.
    """
    if len(polygon_points) < 3:
        return False
    polygon = Polygon([(p[1], p[0]) for p in polygon_points])
    point = Point(lng, lat)
    return polygon.contains(point) or polygon.touches(point)
