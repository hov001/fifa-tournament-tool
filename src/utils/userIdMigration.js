import { v4 as uuidv4 } from "uuid";

/**
 * Migration utility to convert old userId formats to UUIDs
 * This ensures all userIds in localStorage are proper UUIDs
 */

// Map to store old userId -> new UUID mappings
const userIdMap = new Map();

const getOrCreateUUID = (oldUserId) => {
  if (!oldUserId) {
    return uuidv4();
  }

  // If it's already a valid UUID format, return it
  const uuidRegex =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  if (uuidRegex.test(oldUserId)) {
    return oldUserId;
  }

  // Check if we've already created a UUID for this old ID
  if (userIdMap.has(oldUserId)) {
    return userIdMap.get(oldUserId);
  }

  // Create new UUID and store mapping
  const newUUID = uuidv4();
  userIdMap.set(oldUserId, newUUID);
  return newUUID;
};

const migrateParticipant = (participant) => {
  if (typeof participant === "string") {
    const userId = uuidv4();
    return {
      userId: userId,
      id: userId,
      name: participant,
      avatar: null,
      customImage: null,
      order: null,
      club: null,
    };
  }

  const newUserId = getOrCreateUUID(participant.userId || participant.id);
  return {
    ...participant,
    userId: newUserId,
    id: newUserId, // Update id to match userId
    order: participant.order !== undefined ? participant.order : null,
    club: participant.club !== undefined ? participant.club : null,
  };
};

export const migrateAllUserIds = () => {
  console.log("Starting data migration to UUID format...");

  try {
    // Migrate participant data
    // Priority: participants > orderedParticipants > participantNames
    const participants = localStorage.getItem("participants");
    const orderedParticipants = localStorage.getItem("orderedParticipants");
    const participantNames = localStorage.getItem("participantNames");

    let migratedData = [];
    let hasOrdering = false;

    if (participants) {
      // Use existing participants as base
      const parsed = JSON.parse(participants);
      migratedData = parsed.map(migrateParticipant);
      hasOrdering = migratedData.some(
        (p) => p.order !== null && p.order !== undefined
      );
      console.log("✓ Migrated participants");
    } else if (orderedParticipants) {
      // Use orderedParticipants if participants doesn't exist
      const parsed = JSON.parse(orderedParticipants);
      migratedData = parsed.map(migrateParticipant);
      hasOrdering = migratedData.some(
        (p) => p.order !== null && p.order !== undefined
      );
      console.log("✓ Migrated orderedParticipants");
    } else if (participantNames) {
      // Use participantNames as fallback
      const parsed = JSON.parse(participantNames);
      migratedData = parsed.map(migrateParticipant);
      console.log("✓ Migrated participantNames");
    }

    // Save data to appropriate location
    if (migratedData.length > 0) {
      if (hasOrdering) {
        // If participants have ordering, save to participants
        localStorage.setItem("participants", JSON.stringify(migratedData));
        localStorage.removeItem("participantNames");
        console.log("✓ Saved ordered participants to participants");
      } else {
        // If no ordering, save to participantNames
        const baseData = migratedData.map((p) => ({
          userId: p.userId,
          id: p.id,
          name: p.name,
          avatar: p.avatar,
          customImage: p.customImage,
        }));
        localStorage.setItem("participantNames", JSON.stringify(baseData));
        localStorage.removeItem("participants");
        console.log("✓ Saved basic participant data to participantNames");
      }
      // Remove legacy key
      localStorage.removeItem("orderedParticipants");
    }

    // 4. Migrate groups
    const groups = localStorage.getItem("groups");
    if (groups) {
      const parsed = JSON.parse(groups);
      const migrated = parsed.map((group) => ({
        ...group,
        teams: group.teams.map((team) => {
          const newUserId = getOrCreateUUID(team.userId || team.id);
          return {
            ...team,
            userId: newUserId,
            id: newUserId,
          };
        }),
      }));
      localStorage.setItem("groups", JSON.stringify(migrated));
      console.log("✓ Migrated groups");
    }

    // 5. Migrate groupStandings
    const groupStandings = localStorage.getItem("groupStandings");
    if (groupStandings) {
      const parsed = JSON.parse(groupStandings);
      const migrated = parsed.map((group) => ({
        ...group,
        teams: group.teams.map((team) => {
          const newUserId = getOrCreateUUID(team.participantId);
          return {
            ...team,
            participantId: newUserId,
          };
        }),
      }));
      localStorage.setItem("groupStandings", JSON.stringify(migrated));
      console.log("✓ Migrated groupStandings");
    }

    // 6. Migrate matchHistory
    const matchHistory = localStorage.getItem("matchHistory");
    if (matchHistory) {
      const parsed = JSON.parse(matchHistory);
      const migrated = parsed.map((match) => ({
        ...match,
        homeTeam: {
          ...match.homeTeam,
          id: getOrCreateUUID(match.homeTeam.id),
        },
        awayTeam: {
          ...match.awayTeam,
          id: getOrCreateUUID(match.awayTeam.id),
        },
      }));
      localStorage.setItem("matchHistory", JSON.stringify(migrated));
      console.log("✓ Migrated matchHistory");
    }

    // Mark migration as complete
    localStorage.setItem("userIdMigrationComplete", "true");
    console.log("✅ userId migration completed successfully!");

    return true;
  } catch (error) {
    console.error("❌ Error during userId migration:", error);
    return false;
  }
};

export const checkAndMigrateIfNeeded = () => {
  const migrationComplete = localStorage.getItem("userIdMigrationComplete");

  if (migrationComplete === "true") {
    console.log("userId migration already completed, skipping...");
    return;
  }

  migrateAllUserIds();
};
