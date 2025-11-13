import ParticipantEntry from './ParticipantEntry';
import EntryReceptionSummary from './service/EntryReceptionSummary';
import ParticipantEntryAcceptanceService from './service/ParticipantEntryAcceptanceService';
import EntrySelection from './value/EntrySelection';
import ParticipantProfile, { ParticipantProfileProps } from './value/ParticipantProfile';

interface ParticipantEntrySubmissionProps {
  readonly eventId: string;
  readonly raceId: string;
  readonly entryClassId: string;
  readonly applicant: ParticipantProfileProps;
  readonly submittedAt?: Date;
}

class ParticipantEntryFactory {
  public constructor(
    private readonly acceptanceService: ParticipantEntryAcceptanceService
  ) {}

  public createForSubmission(
    props: ParticipantEntrySubmissionProps,
    reception: EntryReceptionSummary
  ): ParticipantEntry {
    const selection = EntrySelection.create({
      eventId: props.eventId,
      raceId: props.raceId,
      entryClassId: props.entryClassId
    });

    const submissionTime = props.submittedAt
      ? new Date(props.submittedAt.getTime())
      : new Date();
    const applicant = ParticipantProfile.create(props.applicant);

    this.acceptanceService.ensureAcceptable(selection, submissionTime, reception);

    return ParticipantEntry.create({
      selection,
      applicant,
      submittedAt: submissionTime
    });
  }
}

export type { ParticipantEntrySubmissionProps };
export default ParticipantEntryFactory;
