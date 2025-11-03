/**
 * Tournament Context Utility
 * Manages which tournament (userId) to view for both authenticated and non-authenticated users
 */

import { DEFAULT_TOURNAMENT_ID } from "../firebase/config";

const TOURNAMENT_ID_KEY = "viewingTournamentId";

/**
 * Get the tournament ID to view
 * - For authenticated users: returns their own userId
 * - For non-authenticated users: returns the stored tournament ID from localStorage, or the default tournament ID
 * @param {Object} currentUser - The authenticated user object (or null)
 * @returns {string|null} - The userId/tournament ID to load data from
 */
export function getTournamentId(currentUser) {
  if (currentUser) {
    // Authenticated user: use their own userId
    return currentUser.uid;
  }

  // Non-authenticated user: check for stored tournament ID first, then fall back to default
  const storedId = localStorage.getItem(TOURNAMENT_ID_KEY);
  return storedId || DEFAULT_TOURNAMENT_ID;
}

/**
 * Set the tournament ID to view (for non-authenticated users)
 * Also automatically set when an admin signs in
 * @param {string} tournamentId - The userId/tournament ID to view
 */
export function setTournamentId(tournamentId) {
  if (tournamentId) {
    localStorage.setItem(TOURNAMENT_ID_KEY, tournamentId);
  }
}

/**
 * Clear the tournament ID (sign out)
 */
export function clearTournamentId() {
  localStorage.removeItem(TOURNAMENT_ID_KEY);
}

/**
 * Check if a tournament ID is set (for viewing)
 * @returns {boolean}
 */
export function hasTournamentId() {
  return !!localStorage.getItem(TOURNAMENT_ID_KEY);
}
