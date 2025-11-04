import { Column, Entity, JoinColumn, ManyToOne, PrimaryColumn } from 'typeorm';

import EntryReceptionEntity from './EntryReceptionEntity';

@Entity('entry_reception_classes')
export class EntryReceptionClassEntity {
  @PrimaryColumn({ name: 'event_id', type: 'text' })
  public eventId!: string;

  @PrimaryColumn({ name: 'race_id', type: 'text' })
  public raceId!: string;

  @PrimaryColumn({ name: 'class_id', type: 'text' })
  public classId!: string;

  @Column({ name: 'name', type: 'text' })
  public name!: string;

  @Column({ name: 'capacity', type: 'integer', nullable: true })
  public capacity?: number | null;

  @ManyToOne(() => EntryReceptionEntity, (entryReception) => entryReception.entryClasses, {
    onDelete: 'CASCADE',
  })
  @JoinColumn([
    { name: 'event_id', referencedColumnName: 'eventId' },
    { name: 'race_id', referencedColumnName: 'raceId' },
  ])
  public entryReception?: EntryReceptionEntity;
}

export default EntryReceptionClassEntity;
