import EventSummaryResponseDto from '../../../application/query/EventSummaryResponseDto';
import { EventEntity } from '../EventEntity';

export function mapEventEntityToSummary(
  event: EventEntity
): EventSummaryResponseDto {
  return {
    id: event.id,
    name: event.name,
    startDate: event.startDate.toISOString(),
    endDate: event.endDate.toISOString(),
    isMultiDay: event.isMultiDay,
    isMultiRace: event.isMultiRace
  };
}

export default mapEventEntityToSummary;
