import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryColumn,
} from 'typeorm';

import EntryClass from '../../domain/EntryClass';
import EntryReception from '../../domain/EntryReception';
import ReceptionWindow from '../../domain/ReceptionWindow';
import { EventEntity } from '../../../event/infrastructure/repository/EventEntity';
import EntryReceptionPreparationResponseDto, {
  EntryReceptionClassDto,
  RaceEntryReceptionDto,
} from '../../application/query/EntryReceptionPreparationResponseDto';
import { EntryReceptionClassEntity } from './EntryReceptionClassEntity';

@Entity('entry_receptions')
export class EntryReceptionEntity {
  @PrimaryColumn({ name: 'event_id', type: 'text' })
  public eventId!: string;

  @PrimaryColumn({ name: 'race_id', type: 'text' })
  public raceId!: string;

  @Column({ name: 'reception_start', type: 'datetime' })
  public receptionStart!: Date;

  @Column({ name: 'reception_end', type: 'datetime' })
  public receptionEnd!: Date;

  @ManyToOne(() => EventEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'event_id', referencedColumnName: 'id' })
  public event?: EventEntity;

  @OneToMany(() => EntryReceptionClassEntity, (entryClass) => entryClass.entryReception, {
    cascade: ['insert', 'update'],
    eager: true,
    orphanedRowAction: 'delete',
  })
  public entryClasses?: EntryReceptionClassEntity[];
}

export function mapEntryReceptionToEntity(
  entryReception: EntryReception
): EntryReceptionEntity {
  const entity = new EntryReceptionEntity();
  entity.eventId = entryReception.eventIdentifier;
  entity.raceId = entryReception.targetRaceId;
  entity.receptionStart = entryReception.receptionWindow.opensAt;
  entity.receptionEnd = entryReception.receptionWindow.closesAt;
  entity.entryClasses = entryReception.entryClasses.map((entryClass) => {
    const classEntity = new EntryReceptionClassEntity();
    classEntity.eventId = entity.eventId;
    classEntity.raceId = entity.raceId;
    classEntity.classId = entryClass.identifier;
    classEntity.name = entryClass.title;
    classEntity.capacity = entryClass.capacity ?? null;
    return classEntity;
  });
  return entity;
}

export function mapEntityToEntryReception(
  entity: EntryReceptionEntity
): EntryReception {
  const window = ReceptionWindow.create(entity.receptionStart, entity.receptionEnd);
  const classes = (entity.entryClasses ?? []).map((entryClass) =>
    EntryClass.create({
      id: entryClass.classId,
      name: entryClass.name,
      capacity: entryClass.capacity ?? undefined,
    })
  );

  return EntryReception.restore({
    eventId: entity.eventId,
    raceId: entity.raceId,
    receptionWindow: window,
    entryClasses: classes,
  });
}

export function mapEntityToRaceEntryReceptionDto(
  entity: EntryReceptionEntity
): RaceEntryReceptionDto {
  const entryClasses: EntryReceptionClassDto[] = (entity.entryClasses ?? []).map(
    (entryClass) => ({
      classId: entryClass.classId,
      name: entryClass.name,
      capacity: entryClass.capacity ?? undefined,
    })
  );

  return {
    raceId: entity.raceId,
    receptionStart: entity.receptionStart,
    receptionEnd: entity.receptionEnd,
    entryClasses,
  } satisfies RaceEntryReceptionDto;
}

export function assemblePreparationResponse(
  eventId: string,
  entities: EntryReceptionEntity[]
): EntryReceptionPreparationResponseDto {
  return {
    eventId,
    raceReceptions: entities.map(mapEntityToRaceEntryReceptionDto),
  } satisfies EntryReceptionPreparationResponseDto;
}

export default EntryReceptionEntity;
