import * as migration_20260926_101317_initial_auth from './20260926_101317_initial_auth';

export const migrations = [
  {
    up: migration_20260926_101317_initial_auth.up,
    down: migration_20260926_101317_initial_auth.down,
    name: '20260926_101317_initial_auth'
  },
];
