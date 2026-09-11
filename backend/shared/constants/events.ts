export const SOCKET_EVENTS = {
  HAZARD_NEW: 'hazard:new',
  HAZARD_RESOLVED: 'hazard:resolved',
  HAZARD_UPDATED: 'hazard:updated',
  AREA_ALERT: 'area:alert',
  TICKET_ASSIGNED: 'ticket:assigned',
  TICKET_STATUS_CHANGED: 'ticket:status_changed',
  RELIEF_SOS_NEW: 'relief:sos_new',
  RELIEF_UPDATED: 'relief:updated',
  NEED_MORE_INFO: 'need_more_info',
  CORROBORATION_VOTE: 'corroboration:vote',
} as const;

export const SOCKET_ROOMS = {
  PUBLIC: 'public',
  OFFICERS: 'officers',
  CREWS: 'crews',
  RELIEF: 'relief',
  WARD: (wardId: string) => `ward:${wardId}`,
  CREW: (crewId: string) => `crew:${crewId}`,
  USER: (userId: string) => `user:${userId}`,
} as const;
