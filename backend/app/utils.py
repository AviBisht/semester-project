import math

def haversine_distance_km(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    """
    Calculate the great circle distance between two points on Earth
    using the Haversine formula.
    
    Formula:
        a = sin²(Δφ/2) + cos(φ1) * cos(φ2) * sin²(Δλ/2)
        c = 2 * atan2(√a, √(1−a))
        d = R * c
    where:
        φ is latitude, λ is longitude, R is Earth radius (~6371 km).
        
    Returns:
        Distance in kilometers (float rounded to 2 decimal places).
    """
    EARTH_RADIUS_KM = 6371.0

    phi1 = math.radians(lat1)
    phi2 = math.radians(lat2)
    delta_phi = math.radians(lat2 - lat1)
    delta_lambda = math.radians(lon2 - lon1)

    a = (math.sin(delta_phi / 2.0) ** 2 +
         math.cos(phi1) * math.cos(phi2) *
         math.sin(delta_lambda / 2.0) ** 2)

    c = 2.0 * math.atan2(math.sqrt(a), math.sqrt(1.0 - a))
    distance = EARTH_RADIUS_KM * c

    return round(distance, 2)


def get_suitable_resource_type(incident_type: str) -> str:
    """
    Map an incident type to its suitable emergency response resource type:
    - Medical Emergency -> ambulance
    - Fire -> fire unit
    - Flooding/Waterlogging, Road Accident, Road Blockage, Other -> rescue team
    """
    mapping = {
        "Medical Emergency": "ambulance",
        "Fire": "fire unit",
        "Flooding/Waterlogging": "rescue team",
        "Road Accident": "rescue team",
        "Road Blockage": "rescue team",
        "Other": "rescue team",
    }
    return mapping.get(incident_type, "rescue team")


def check_blockage_proximity(incident_lat: float, incident_lon: float, blockages: list, threshold_meters: float = 500.0):
    """
    Check if an incident location is within threshold_meters (default 500m)
    of any active road blockage.
    
    Returns:
        list of dicts containing details of nearby blockages, if any.
    """
    nearby_blockages = []
    for blockage in blockages:
        dist_km = haversine_distance_km(incident_lat, incident_lon, blockage.latitude, blockage.longitude)
        dist_meters = dist_km * 1000.0

        if dist_meters <= threshold_meters:
            nearby_blockages.append({
                "blockage_id": blockage.id,
                "tracking_id": blockage.tracking_id,
                "description": blockage.description,
                "distance_meters": round(dist_meters, 0),
            })
    return nearby_blockages
