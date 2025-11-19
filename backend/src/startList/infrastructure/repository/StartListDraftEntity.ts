import { Column, Entity, PrimaryColumn } from 'typeorm';

import LaneAssignment from '../../domain/LaneAssignment';
import ParticipantSlot from '../../domain/ParticipantSlot';
import StartListDraft from '../../domain/StartListDraft';
import StartListSettings from '../../domain/StartListSettings';

interface LaneAssignmentPersistenceDto {
  readonly laneNumber: number;
  readonly entryClassId: string;
}

interface ParticipantSlotPersistenceDto {
  readonly laneNumber: number;
  readonly entryClassId: string;
  readonly participantEntryId: string;
  readonly participantName: string;
  readonly sequence: number;
}

@Entity('start_lists')
export class StartListDraftEntity {
  @PrimaryColumn({ name: 'event_id', type: 'text' })
  public eventId!: string;

  @PrimaryColumn({ name: 'race_id', type: 'text' })
  public raceId!: string;

  @Column({ name: 'start_at', type: 'datetime' })
  public startAt!: Date;

  @Column({ name: 'interval_seconds', type: 'integer' })
  public intervalSeconds!: number;

  @Column({ name: 'lane_count', type: 'integer' })
  public laneCount!: number;

  @Column({ name: 'lane_assignments', type: 'text', default: '[]' })
  public laneAssignments!: string;

  @Column({ name: 'participant_slots', type: 'text', default: '[]' })
  public participantSlots!: string;

  @Column({ name: 'is_finalized', type: 'boolean', default: false })
  public isFinalized!: boolean;

  @Column({ name: 'updated_at', type: 'datetime' })
  public updatedAt!: Date;
}

function parseLaneAssignments(
  entity: StartListDraftEntity,
  settings: StartListSettings
): LaneAssignment[] {
  if (!entity.laneAssignments) {
    return [];
  }
  const data = JSON.parse(entity.laneAssignments) as LaneAssignmentPersistenceDto[];
  return data.map((item) => LaneAssignment.assign(item.laneNumber, item.entryClassId, settings));
}

function parseParticipantSlots(
  entity: StartListDraftEntity,
  settings: StartListSettings
): ParticipantSlot[] {
  if (!entity.participantSlots) {
    return [];
  }
  const data = JSON.parse(entity.participantSlots) as ParticipantSlotPersistenceDto[];
  return data.map((slot) =>
    ParticipantSlot.schedule({
      participantEntryId: slot.participantEntryId,
      participantName: slot.participantName,
      entryClassId: slot.entryClassId,
      laneNumber: slot.laneNumber,
      sequence: slot.sequence,
      settings,
    })
  );
}

export function mapDraftToEntity(draft: StartListDraft): StartListDraftEntity {
  const entity = new StartListDraftEntity();
  const settings = draft.startListSettings;
  entity.eventId = draft.eventIdentifier;
  entity.raceId = draft.raceIdentifier;
  entity.startAt = settings.startTime;
  entity.intervalSeconds = settings.intervalInSeconds;
  entity.laneCount = settings.laneCount;
  entity.laneAssignments = JSON.stringify(
    draft.laneConfigurations.map((assignment) => ({
      laneNumber: assignment.laneNumber,
      entryClassId: assignment.entryClassId,
    }))
  );
  entity.participantSlots = JSON.stringify(
    draft.participantAssignments.map((slot) => ({
      laneNumber: slot.laneNumber,
      entryClassId: slot.entryClassId,
      participantEntryId: slot.participantEntryId,
      participantName: slot.participantName,
      sequence: slot.sequence,
    }))
  );
  entity.isFinalized = draft.isFinalized;
  entity.updatedAt = new Date();
  return entity;
}

export function mapEntityToDraft(entity: StartListDraftEntity): StartListDraft {
  const settings = StartListSettings.configure(
    entity.startAt,
    entity.intervalSeconds,
    entity.laneCount
  );

  const laneAssignments = parseLaneAssignments(entity, settings);
  const participantSlots = parseParticipantSlots(entity, settings);

  return StartListDraft.restore({
    eventId: entity.eventId,
    raceId: entity.raceId,
    settings,
    laneAssignments,
    participantSlots,
    finalized: entity.isFinalized,
  });
}

export type { LaneAssignmentPersistenceDto, ParticipantSlotPersistenceDto };
export default StartListDraftEntity;
