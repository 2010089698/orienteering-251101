import EntrySelection from './value/EntrySelection';
import ParticipantProfile from './value/ParticipantProfile';

interface ParticipantEntryProps {
  readonly id?: string;
  readonly selection: EntrySelection;
  readonly applicant: ParticipantProfile;
  readonly submittedAt: Date;
}

class ParticipantEntry {
  private constructor(
    private readonly entryId: string | null,
    private readonly selection: EntrySelection,
    private readonly applicantProfile: ParticipantProfile,
    private readonly appliedAt: Date
  ) {}

  public static create(props: ParticipantEntryProps): ParticipantEntry {
    if (!props.selection) {
      throw new Error('エントリー対象が指定されていません。');
    }

    if (!props.applicant) {
      throw new Error('参加者情報が指定されていません。');
    }

    if (!props.submittedAt) {
      throw new Error('申込日時が指定されていません。');
    }

    return new ParticipantEntry(
      props.id ?? null,
      props.selection,
      props.applicant,
      new Date(props.submittedAt.getTime())
    );
  }

  public static restore(props: ParticipantEntryProps): ParticipantEntry {
    return ParticipantEntry.create(props);
  }

  public withIdentifier(identifier: string): ParticipantEntry {
    const trimmed = identifier?.trim();
    if (!trimmed) {
      throw new Error('エントリーIDを指定してください。');
    }

    return new ParticipantEntry(trimmed, this.selection, this.applicantProfile, this.appliedAt);
  }

  public get id(): string | null {
    return this.entryId;
  }

  public get eventId(): string {
    return this.selection.eventId;
  }

  public get raceId(): string {
    return this.selection.raceId;
  }

  public get entryClassId(): string {
    return this.selection.entryClassId;
  }

  public get applicant(): ParticipantProfile {
    return this.applicantProfile;
  }

  public get submittedAt(): Date {
    return new Date(this.appliedAt.getTime());
  }
}

export type { ParticipantEntryProps };
export default ParticipantEntry;
