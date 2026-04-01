import { EventType } from './event-type.types';

export interface CloudEvent<T = unknown> {
  id: number;
  source: string;
  type: EventType;
  time: string;
  data: T;
}
