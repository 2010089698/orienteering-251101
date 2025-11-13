import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

import ParticipantEntry from '../../domain/ParticipantEntry';

@Entity('participant_entries')
export class ParticipantEntryEntity {
  @PrimaryGeneratedColumn('uuid', { name: 'id' })
  public id!: string;

  @Column({ name: 'event_id', type: 'text' })
  public eventId!: string;

  @Column({ name: 'race_id', type: 'text' })
  public raceId!: string;

  @Column({ name: 'entry_class_id', type: 'text' })
  public entryClassId!: string;

  @Column({ name: 'participant_name', type: 'text' })
  public participantName!: string;

  @Column({ name: 'participant_email', type: 'text' })
  public participantEmail!: string;

  @Column({ name: 'submitted_at', type: 'datetime' })
  public submittedAt!: Date;
}

export function mapParticipantEntryToEntity(
  entry: ParticipantEntry
): ParticipantEntryEntity {
  const entity = new ParticipantEntryEntity();
  entity.eventId = entry.eventId;
  entity.raceId = entry.raceId;
  entity.entryClassId = entry.entryClassId;
  entity.participantName = entry.applicant.fullName;
  entity.participantEmail = entry.applicant.email;
  entity.submittedAt = entry.submittedAt;

  return entity;
}

export default ParticipantEntryEntity;
