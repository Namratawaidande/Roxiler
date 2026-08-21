/**
 * Application User Roles
 */
const ROLES = Object.freeze({
  SYSTEM_ADMIN: 'SYSTEM_ADMIN',
  NORMAL_USER: 'NORMAL_USER',
  STORE_OWNER: 'STORE_OWNER'
});

const ROLE_DESCRIPTIONS = Object.freeze({
  [ROLES.SYSTEM_ADMIN]: 'Platform administrator with full user, store, and statistics management privileges.',
  [ROLES.NORMAL_USER]: 'Standard registered customer who can browse stores and submit or modify store ratings.',
  [ROLES.STORE_OWNER]: 'Store merchant who manages their store profile and monitors received ratings & averages.'
});

const ALL_ROLES = Object.values(ROLES);

module.exports = {
  ROLES,
  ROLE_DESCRIPTIONS,
  ALL_ROLES
};
