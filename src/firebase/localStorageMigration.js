import {
  setTournamentSettings,
  setParticipantNames,
  setParticipants,
  setAvailableClubs,
  setGroups,
  setGroupStandings,
  setMatchHistory,
  setKnockoutMatches,
  getTournamentData,
} from "./dbService";

/**
 * Migration utility to transfer data from localStorage to Firestore
 * This should be run once when a user first authenticates after the migration
 */

const MIGRATION_FLAG = "firestore_migration_completed";

/**
 * Check if migration has already been completed
 */
export function isMigrationCompleted() {
  return localStorage.getItem(MIGRATION_FLAG) === "true";
}

/**
 * Mark migration as completed
 */
function markMigrationCompleted() {
  localStorage.setItem(MIGRATION_FLAG, "true");
}

/**
 * Check if there's any data in localStorage that needs migration
 */
function hasLocalStorageData() {
  const keys = [
    "tournamentSettings",
    "participantNames",
    "participants",
    "availableClubs",
    "groups",
    "groupStandings",
    "matchHistory",
    "knockoutMatches",
  ];

  return keys.some((key) => localStorage.getItem(key) !== null);
}

/**
 * Migrate all localStorage data to Firestore for a given user
 * @param {string} userId - The authenticated user's ID
 * @returns {Promise<Object>} Migration result with success status and details
 */
export async function migrateLocalStorageToFirestore(userId) {
  if (!userId) {
    return {
      success: false,
      error: "User ID is required for migration",
    };
  }

  // Check if migration already completed
  if (isMigrationCompleted()) {
    console.log("Migration already completed, skipping...");
    return {
      success: true,
      skipped: true,
      message: "Migration already completed",
    };
  }

  // Check if there's any data to migrate
  if (!hasLocalStorageData()) {
    console.log("No localStorage data found to migrate");
    markMigrationCompleted();
    return {
      success: true,
      skipped: true,
      message: "No data to migrate",
    };
  }

  try {
    // Check if user already has data in Firestore
    const existingData = await getTournamentData(userId);
    if (existingData && Object.keys(existingData).length > 0) {
      console.log("User already has data in Firestore, skipping migration");
      markMigrationCompleted();
      return {
        success: true,
        skipped: true,
        message: "User already has Firestore data",
      };
    }

    const migratedData = {};
    const errors = [];

    // Migrate tournament settings
    try {
      const tournamentSettings = localStorage.getItem("tournamentSettings");
      if (tournamentSettings) {
        const parsed = JSON.parse(tournamentSettings);
        await setTournamentSettings(userId, parsed);
        migratedData.tournamentSettings = true;
        console.log("✓ Migrated tournament settings");
      }
    } catch (error) {
      errors.push({ field: "tournamentSettings", error: error.message });
      console.error("Error migrating tournament settings:", error);
    }

    // Migrate participant names
    try {
      const participantNames = localStorage.getItem("participantNames");
      if (participantNames) {
        const parsed = JSON.parse(participantNames);
        await setParticipantNames(userId, parsed);
        migratedData.participantNames = true;
        console.log("✓ Migrated participant names");
      }
    } catch (error) {
      errors.push({ field: "participantNames", error: error.message });
      console.error("Error migrating participant names:", error);
    }

    // Migrate participants (ordered list with clubs)
    try {
      const participants = localStorage.getItem("participants");
      if (participants) {
        const parsed = JSON.parse(participants);
        await setParticipants(userId, parsed);
        migratedData.participants = true;
        console.log("✓ Migrated participants");
      }
    } catch (error) {
      errors.push({ field: "participants", error: error.message });
      console.error("Error migrating participants:", error);
    }

    // Migrate available clubs
    try {
      const availableClubs = localStorage.getItem("availableClubs");
      if (availableClubs) {
        const parsed = JSON.parse(availableClubs);
        await setAvailableClubs(userId, parsed);
        migratedData.availableClubs = true;
        console.log("✓ Migrated available clubs");
      }
    } catch (error) {
      errors.push({ field: "availableClubs", error: error.message });
      console.error("Error migrating available clubs:", error);
    }

    // Migrate groups
    try {
      const groups = localStorage.getItem("groups");
      if (groups) {
        const parsed = JSON.parse(groups);
        await setGroups(userId, parsed);
        migratedData.groups = true;
        console.log("✓ Migrated groups");
      }
    } catch (error) {
      errors.push({ field: "groups", error: error.message });
      console.error("Error migrating groups:", error);
    }

    // Migrate group standings
    try {
      const groupStandings = localStorage.getItem("groupStandings");
      if (groupStandings) {
        const parsed = JSON.parse(groupStandings);
        await setGroupStandings(userId, parsed);
        migratedData.groupStandings = true;
        console.log("✓ Migrated group standings");
      }
    } catch (error) {
      errors.push({ field: "groupStandings", error: error.message });
      console.error("Error migrating group standings:", error);
    }

    // Migrate match history
    try {
      const matchHistory = localStorage.getItem("matchHistory");
      if (matchHistory) {
        const parsed = JSON.parse(matchHistory);
        await setMatchHistory(userId, parsed);
        migratedData.matchHistory = true;
        console.log("✓ Migrated match history");
      }
    } catch (error) {
      errors.push({ field: "matchHistory", error: error.message });
      console.error("Error migrating match history:", error);
    }

    // Migrate knockout matches
    try {
      const knockoutMatches = localStorage.getItem("knockoutMatches");
      if (knockoutMatches) {
        const parsed = JSON.parse(knockoutMatches);
        await setKnockoutMatches(userId, parsed);
        migratedData.knockoutMatches = true;
        console.log("✓ Migrated knockout matches");
      }
    } catch (error) {
      errors.push({ field: "knockoutMatches", error: error.message });
      console.error("Error migrating knockout matches:", error);
    }

    // Mark migration as completed
    markMigrationCompleted();

    const result = {
      success: true,
      migratedData,
      errors: errors.length > 0 ? errors : undefined,
      message: `Migration completed. ${
        Object.keys(migratedData).length
      } data types migrated${
        errors.length > 0 ? ` with ${errors.length} errors` : ""
      }`,
    };

    console.log("Migration summary:", result);
    return result;
  } catch (error) {
    console.error("Fatal error during migration:", error);
    return {
      success: false,
      error: error.message,
    };
  }
}

/**
 * Clear localStorage data after successful migration
 * Only call this after confirming migration was successful
 * @param {boolean} keepMigrationFlag - Whether to keep the migration flag
 */
export function clearLocalStorageData(keepMigrationFlag = true) {
  const keysToRemove = [
    "tournamentSettings",
    "participantNames",
    "participants",
    "availableClubs",
    "groups",
    "groupStandings",
    "matchHistory",
    "knockoutMatches",
    // Legacy keys
    "orderedParticipants",
    "standings",
    "userIdMigrationComplete",
  ];

  keysToRemove.forEach((key) => {
    localStorage.removeItem(key);
  });

  if (!keepMigrationFlag) {
    localStorage.removeItem(MIGRATION_FLAG);
  }

  console.log("✓ Cleared localStorage tournament data");
}

/**
 * Reset migration flag (for testing purposes)
 */
export function resetMigrationFlag() {
  localStorage.removeItem(MIGRATION_FLAG);
  console.log("Migration flag reset");
}
