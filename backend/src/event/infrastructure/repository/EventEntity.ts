import { Column, Entity, OneToMany, PrimaryColumn } from 'typeorm';

import Event from '../../domain/Event';
import EventPeriod from '../../domain/EventPeriod';
import RaceSchedule from '../../domain/RaceSchedule';
import { DEFAULT_ORGANIZER_ID } from '../../application/OrganizerContext';
import { RaceScheduleEntity } from './RaceScheduleEntity';

@Entity('events')
export class EventEntity {
  @PrimaryColumn({ name: 'id', type: 'text' })
  public id!: string;

  @Column({ name: 'name', type: 'text' })
  public name!: string;

  @Column({ name: 'organizer_id', type: 'text' })
  public organizerId!: string;

  @Column({ name: 'start_date', type: 'datetime' })
  public startDate!: Date;

  @Column({ name: 'end_date', type: 'datetime' })
  public endDate!: Date;

  @Column({ name: 'is_multi_day', type: 'boolean' })
  public isMultiDay!: boolean;

  @Column({ name: 'is_multi_race', type: 'boolean' })
  public isMultiRace!: boolean;

  @Column({ name: 'is_public', type: 'boolean', default: false })
  public isPublic!: boolean;

  @OneToMany(() => RaceScheduleEntity, (schedule) => schedule.event, {
    cascade: false,
  })
  public raceSchedules?: RaceScheduleEntity[];
}

export function mapEventToEntity(event: Event): EventEntity {
  const entity = new EventEntity();
  entity.id = event.eventIdentifier;
  entity.name = event.displayName;
  entity.organizerId = DEFAULT_ORGANIZER_ID;
  entity.startDate = event.eventDuration.startDate;
  entity.endDate = event.eventDuration.endDate;
  entity.isMultiDay = event.isMultiDayEvent;
  entity.isMultiRace = event.isMultiRaceEvent;
  entity.isPublic = event.isPublic;
  return entity;
}

export function mapEntityToEvent(
  event: EventEntity,
  raceSchedules: RaceScheduleEntity[]
): Event {
  const period = EventPeriod.createFromBoundaries(event.startDate, event.endDate);
  const domainSchedules = raceSchedules
    .map((schedule) => RaceSchedule.create(schedule.name, schedule.scheduledDate))
    .sort((left, right) => left.dayIdentifier - right.dayIdentifier);

  return Event.create({
    id: event.id,
    name: event.name,
    period,
    raceSchedules: domainSchedules,
    isPublic: event.isPublic
  });
}
