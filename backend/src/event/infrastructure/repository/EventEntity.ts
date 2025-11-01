import { Column, Entity, OneToMany, PrimaryColumn } from 'typeorm';

import Event from '../../domain/Event';
import { RaceScheduleEntity } from './RaceScheduleEntity';

@Entity('events')
export class EventEntity {
  @PrimaryColumn({ name: 'id', type: 'text' })
  public id!: string;

  @Column({ name: 'name', type: 'text' })
  public name!: string;

  @Column({ name: 'start_date', type: 'datetime' })
  public startDate!: Date;

  @Column({ name: 'end_date', type: 'datetime' })
  public endDate!: Date;

  @Column({ name: 'is_multi_day', type: 'boolean' })
  public isMultiDay!: boolean;

  @Column({ name: 'is_multi_race', type: 'boolean' })
  public isMultiRace!: boolean;

  @OneToMany(() => RaceScheduleEntity, (schedule) => schedule.event, {
    cascade: false,
  })
  public raceSchedules?: RaceScheduleEntity[];
}

export function mapEventToEntity(event: Event): EventEntity {
  const entity = new EventEntity();
  entity.id = event.eventIdentifier;
  entity.name = event.displayName;
  entity.startDate = event.eventDuration.startDate;
  entity.endDate = event.eventDuration.endDate;
  entity.isMultiDay = event.isMultiDayEvent;
  entity.isMultiRace = event.isMultiRaceEvent;
  return entity;
}
