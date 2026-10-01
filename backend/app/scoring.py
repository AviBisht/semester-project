"""
Priority Scoring Module for Flood & Emergency Incident Reporting.

Scoring Formula (College Mini-Project Specification):
    score = (severity * 10)
          + min(people_affected, 20)
          + (15 if vulnerable_people_involved else 0)
          + type_weight

Type Weights:
    - Medical Emergency: 10
    - Fire: 10
    - Flooding/Waterlogging: 6
    - Road Accident: 6
    - Road Blockage: 3
    - Other: 2

Priority Thresholds:
    - Critical: >= 60
    - High: >= 40
    - Medium: >= 25
    - Low: < 25
"""

# Weight dictionary according to specifications
TYPE_WEIGHTS = {
    "Medical Emergency": 10,
    "Fire": 10,
    "Flooding/Waterlogging": 6,
    "Road Accident": 6,
    "Road Blockage": 3,
    "Other": 2,
}

def calculate_priority_score(severity: int, people_affected: int, vulnerable_involved: bool, incident_type: str):
    """
    Computes priority score, categorical priority level, and detailed mathematical breakdown.
    
    Returns:
        tuple (score: int, priority_level: str, breakdown: dict)
    """
    # 1. Severity component (severity scale 1-5 multiplied by 10)
    severity_clamped = max(1, min(5, int(severity or 1)))
    severity_score = severity_clamped * 10

    # 2. People affected component (capped at 20)
    people_count = max(0, int(people_affected or 0))
    people_score = min(people_count, 20)

    # 3. Vulnerable individuals component (+15 points if elderly/children/disabled involved)
    vulnerable_score = 15 if bool(vulnerable_involved) else 0

    # 4. Incident type severity weight
    type_score = TYPE_WEIGHTS.get(incident_type, 2)

    # Total score calculation
    total_score = severity_score + people_score + vulnerable_score + type_score

    # Determine priority tier based on criteria
    if total_score >= 60:
        priority_level = "Critical"
    elif total_score >= 40:
        priority_level = "High"
    elif total_score >= 25:
        priority_level = "Medium"
    else:
        priority_level = "Low"

    # Breakdown dictionary for display on detail panel
    breakdown = {
        "severity_input": severity_clamped,
        "severity_score": severity_score,
        "people_affected_input": people_count,
        "people_score": people_score,
        "vulnerable_involved": bool(vulnerable_involved),
        "vulnerable_score": vulnerable_score,
        "incident_type": incident_type,
        "type_score": type_score,
        "total_score": total_score,
        "priority_level": priority_level,
    }

    return total_score, priority_level, breakdown
