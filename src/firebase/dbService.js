import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  collection,
  query,
  where,
  getDocs,
  onSnapshot,
} from "firebase/firestore";
import { db } from "./config";

/**
 * Database service for managing tournament data in Firestore
 * All data is scoped by user ID to ensure proper data isolation
 */

// Collection name
const TOURNAMENT_DATA_COLLECTION = "tournamentData";

/**
 * Get the document reference for a user's tournament data
 * @param {string} userId - The authenticated user's ID
 * @returns {DocumentReference} Firestore document reference
 */
const getUserDocRef = (userId) => {
  if (!userId) {
    throw new Error("User ID is required for database operations");
  }
  return doc(db, TOURNAMENT_DATA_COLLECTION, userId);
};

/**
 * Get all tournament data for a user
 * @param {string} userId - The authenticated user's ID
 * @returns {Promise<Object>} Tournament data object
 */
export const getTournamentData = async (userId) => {
  try {
    const docRef = getUserDocRef(userId);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      return docSnap.data();
    }
    return null;
  } catch (error) {
    console.error("Error getting tournament data:", error);
    throw error;
  }
};

/**
 * Set a specific field in tournament data
 * @param {string} userId - The authenticated user's ID
 * @param {string} field - The field name
 * @param {any} value - The value to set
 * @returns {Promise<void>}
 */
export const setTournamentField = async (userId, field, value) => {
  try {
    const docRef = getUserDocRef(userId);
    await setDoc(docRef, { [field]: value }, { merge: true });
  } catch (error) {
    console.error(`Error setting ${field}:`, error);
    throw error;
  }
};

/**
 * Get a specific field from tournament data
 * @param {string} userId - The authenticated user's ID
 * @param {string} field - The field name
 * @returns {Promise<any>} The field value or null if not found
 */
export const getTournamentField = async (userId, field) => {
  try {
    const data = await getTournamentData(userId);
    return data?.[field] || null;
  } catch (error) {
    console.error(`Error getting ${field}:`, error);
    throw error;
  }
};

/**
 * Delete a specific field from tournament data
 * @param {string} userId - The authenticated user's ID
 * @param {string} field - The field name
 * @returns {Promise<void>}
 */
export const deleteTournamentField = async (userId, field) => {
  try {
    const docRef = getUserDocRef(userId);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      const data = docSnap.data();
      delete data[field];
      await setDoc(docRef, data);
    }
  } catch (error) {
    console.error(`Error deleting ${field}:`, error);
    throw error;
  }
};

/**
 * Update multiple fields in tournament data
 * @param {string} userId - The authenticated user's ID
 * @param {Object} updates - Object containing field:value pairs to update
 * @returns {Promise<void>}
 */
export const updateTournamentData = async (userId, updates) => {
  try {
    const docRef = getUserDocRef(userId);
    await setDoc(docRef, updates, { merge: true });
  } catch (error) {
    console.error("Error updating tournament data:", error);
    throw error;
  }
};

/**
 * Clear all tournament data for a user
 * @param {string} userId - The authenticated user's ID
 * @returns {Promise<void>}
 */
export const clearAllTournamentData = async (userId) => {
  try {
    const docRef = getUserDocRef(userId);
    await deleteDoc(docRef);
  } catch (error) {
    console.error("Error clearing tournament data:", error);
    throw error;
  }
};

/**
 * Subscribe to real-time updates for tournament data
 * @param {string} userId - The authenticated user's ID
 * @param {Function} callback - Callback function to handle data updates
 * @returns {Function} Unsubscribe function
 */
export const subscribeTournamentData = (userId, callback) => {
  try {
    const docRef = getUserDocRef(userId);
    return onSnapshot(docRef, (doc) => {
      if (doc.exists()) {
        callback(doc.data());
      } else {
        callback(null);
      }
    });
  } catch (error) {
    console.error("Error subscribing to tournament data:", error);
    throw error;
  }
};

// Specific field getters and setters for convenience

// Tournament Settings
export const getTournamentSettings = (userId) =>
  getTournamentField(userId, "tournamentSettings");
export const setTournamentSettings = (userId, settings) =>
  setTournamentField(userId, "tournamentSettings", settings);

// Participants
export const getParticipantNames = (userId) =>
  getTournamentField(userId, "participantNames");
export const setParticipantNames = (userId, participants) =>
  setTournamentField(userId, "participantNames", participants);
export const deleteParticipantNames = (userId) =>
  deleteTournamentField(userId, "participantNames");

// Ordered Participants (with clubs)
export const getParticipants = (userId) =>
  getTournamentField(userId, "participants");
export const setParticipants = (userId, participants) =>
  setTournamentField(userId, "participants", participants);
export const deleteParticipants = (userId) =>
  deleteTournamentField(userId, "participants");

// Available Clubs
export const getAvailableClubs = (userId) =>
  getTournamentField(userId, "availableClubs");
export const setAvailableClubs = (userId, clubs) =>
  setTournamentField(userId, "availableClubs", clubs);
export const deleteAvailableClubs = (userId) =>
  deleteTournamentField(userId, "availableClubs");

// Groups
export const getGroups = (userId) => getTournamentField(userId, "groups");
export const setGroups = (userId, groups) =>
  setTournamentField(userId, "groups", groups);
export const deleteGroups = (userId) => deleteTournamentField(userId, "groups");

// Group Standings
export const getGroupStandings = (userId) =>
  getTournamentField(userId, "groupStandings");
export const setGroupStandings = (userId, standings) =>
  setTournamentField(userId, "groupStandings", standings);
export const deleteGroupStandings = (userId) =>
  deleteTournamentField(userId, "groupStandings");

// Match History
export const getMatchHistory = (userId) =>
  getTournamentField(userId, "matchHistory");
export const setMatchHistory = (userId, matches) =>
  setTournamentField(userId, "matchHistory", matches);
export const deleteMatchHistory = (userId) =>
  deleteTournamentField(userId, "matchHistory");

// Knockout Matches
export const getKnockoutMatches = (userId) =>
  getTournamentField(userId, "knockoutMatches");
export const setKnockoutMatches = (userId, matches) =>
  setTournamentField(userId, "knockoutMatches", matches);
export const deleteKnockoutMatches = (userId) =>
  deleteTournamentField(userId, "knockoutMatches");

// Migration flag
export const getUserIdMigrationComplete = (userId) =>
  getTournamentField(userId, "userIdMigrationComplete");
export const setUserIdMigrationComplete = (userId, value) =>
  setTournamentField(userId, "userIdMigrationComplete", value);
