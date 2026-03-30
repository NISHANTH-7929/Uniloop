/**
 * Evaluates and awards badges to a User based on DormDash order history and ratings.
 * Badges:
 * - "Reliable Dasher": dasher rating avg ≥ 4.5 AND ordersCompleted ≥ 10
 * - "Speed Demon": onTimeDeliveries ≥ 20
 * - "Top Requester": requester rating avg ≥ 4.5 AND ordersCompleted ≥ 10
 * - "Campus Dasher": ordersCompleted ≥ 50
 *
 * @param {Object} user 
 * @returns {boolean} true if a new badge was added
 */
export const checkAndAwardBadges = (user) => {
  if (!user || !user.dormDash) return false;

  let newBadgeAwarded = false;
  const { dormDash } = user;
  const badges = dormDash.badges || [];

  const updateBadge = (badgeName, condition) => {
    if (condition && !badges.includes(badgeName)) {
      badges.push(badgeName);
      newBadgeAwarded = true;
    }
  };

  const dasherAvg = dormDash.ratings.asDasher.count > 0 
    ? dormDash.ratings.asDasher.total / dormDash.ratings.asDasher.count 
    : 0;
  
  const requesterAvg = dormDash.ratings.asRequester.count > 0 
    ? dormDash.ratings.asRequester.total / dormDash.ratings.asRequester.count 
    : 0;

  // Rule: "Reliable Dasher"
  updateBadge("Reliable Dasher", dasherAvg >= 4.5 && dormDash.ordersCompleted >= 10);
  
  // Rule: "Speed Demon"
  updateBadge("Speed Demon", dormDash.onTimeDeliveries >= 20);
  
  // Rule: "Top Requester"
  updateBadge("Top Requester", requesterAvg >= 4.5 && dormDash.ordersCompleted >= 10);
  
  // Rule: "Campus Dasher"
  updateBadge("Campus Dasher", dormDash.ordersCompleted >= 50);

  user.dormDash.badges = badges;
  return newBadgeAwarded;
};
