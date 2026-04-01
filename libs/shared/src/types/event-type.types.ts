import { TOPICS } from '../constants/topics';

export type EventType = (typeof TOPICS)[keyof typeof TOPICS];
