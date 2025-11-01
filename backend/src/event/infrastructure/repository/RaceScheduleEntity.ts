import { Column, Entity, JoinColumn, ManyToOne, PrimaryColumn } from 'typeorm';

import RaceSchedule from '../../domain/RaceSchedule';
import { EventEntity } from './EventEntity';

@Entity('race_schedules')
export class RaceScheduleEntity {
  @PrimaryColumn({ name: 'event_id', type: 'text' })
  public eventId!: string;

  @PrimaryColumn({ name: 'name', type: 'text' })
  public name!: string;

  @Column({ name: 'scheduled_date', type: 'datetime' })
  public scheduledDate!: Date;

  @ManyToOne(() => EventEntity, (event) => event.raceSchedules, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'event_id', referencedColumnName: 'id' })
  public event?: EventEntity;
}

export function mapRaceScheduleToEntity(
  eventId: string,
  schedule: RaceSchedule
): RaceScheduleEntity {
  const entity = new RaceScheduleEntity();
  entity.eventId = eventId;
  entity.name = schedule.name;
  entity.scheduledDate = schedule.date;
  return entity;
}
