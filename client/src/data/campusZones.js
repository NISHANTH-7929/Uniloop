// Export array of defined campus zones
export const campusZonesList = [
  "Hostel Block A",
  "Hostel Block B",
  "Main Canteen",
  "Library",
  "Admin Block",
  "Lab Complex",
  "Sports Ground",
  "Koturpuram",
  "Adyar",
  "Guindy",
  "Kotturpuram Gate",
  "College Main Gate"
];

// Distance mapping between nodes, representing approximate walking minutes or arbitrary distance units
const zoneDistancesMap = {
  "Hostel Block A": { "Hostel Block A": 0, "Hostel Block B": 5, "Main Canteen": 10, "Library": 8, "Admin Block": 12, "Lab Complex": 15, "Sports Ground": 20 },
  "Hostel Block B": { "Hostel Block A": 5, "Hostel Block B": 0, "Main Canteen": 12, "Library": 10, "Admin Block": 14, "Lab Complex": 18, "Sports Ground": 25 },
  "Main Canteen": { "Hostel Block A": 10, "Hostel Block B": 12, "Main Canteen": 0, "Library": 3, "Admin Block": 5, "Lab Complex": 8, "Sports Ground": 15 },
  "Library": { "Hostel Block A": 8, "Hostel Block B": 10, "Main Canteen": 3, "Library": 0, "Admin Block": 4, "Lab Complex": 7, "Sports Ground": 18 },
  "Admin Block": { "Hostel Block A": 12, "Hostel Block B": 14, "Main Canteen": 5, "Library": 4, "Admin Block": 0, "Lab Complex": 6, "Sports Ground": 20 },
  "Lab Complex": { "Hostel Block A": 15, "Hostel Block B": 18, "Main Canteen": 8, "Library": 7, "Admin Block": 6, "Lab Complex": 0, "Sports Ground": 22 },
  "Sports Ground": { "Hostel Block A": 20, "Hostel Block B": 25, "Main Canteen": 15, "Library": 18, "Admin Block": 20, "Lab Complex": 22, "Sports Ground": 0 },
  "Koturpuram": { "Koturpuram": 0 },
  "Adyar": { "Adyar": 0 },
  "Guindy": { "Guindy": 0 },
  "Kotturpuram Gate": { "Kotturpuram Gate": 0 },
  "College Main Gate": { "College Main Gate": 0 }
};

/**
 * Given a free-text location, attempts to find a matching zone name.
 * Default is "Unknown".
 */
export const extractZone = (locationString) => {
  const loc = locationString.toLowerCase();
  for (const zone of campusZonesList) {
    if (loc.includes(zone.toLowerCase())) {
      return zone;
    }
  }
  return null;
};

/**
 * Returns estimated distance string between two free text locations.
 */
export const getEstimatedDistance = (loc1, loc2) => {
  const z1 = extractZone(loc1);
  const z2 = extractZone(loc2);
  if (!z1 || !z2 || !zoneDistancesMap[z1] || zoneDistancesMap[z1][z2] === undefined) {
    return "Unknown distance";
  }
  const dist = zoneDistancesMap[z1][z2];
  return `${dist} min walk`;
};
