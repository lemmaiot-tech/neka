// IMPORTANT: Replace with the actual Firebase UID of your admin user(s).
// You can find a user's UID in the Firebase Console > Authentication > Users tab.
const ADMIN_UIDS = ['Fomwqe4Kh5cjFdMDDMXypr5HMOb2'];

/**
 * Checks if a given user UID belongs to an admin.
 * @param uid The user's UID.
 * @returns True if the user is an admin, false otherwise.
 */
export const isAdmin = (uid: string | undefined): boolean => {
  if (!uid) return false;
  return ADMIN_UIDS.includes(uid);
};
