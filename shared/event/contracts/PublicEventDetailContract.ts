import { z } from 'zod';
import {
  entryReceptionStatusSchema,
  isoDateOnlySchema,
  raceScheduleDetailSchema,
  resultPublicationStatusSchema,
  startListStatusSchema
} from './EventCommonSchemas';

export const publicEventDetailResponseSchema = z.object({
  eventId: z.string({ required_error: 'イベントIDは必須です。' }).min(1, 'イベントIDは必須です。'),
  eventName: z.string({ required_error: 'イベント名は必須です。' }).min(1, 'イベント名は必須です。'),
  startDate: isoDateOnlySchema,
  endDate: isoDateOnlySchema,
  isMultiDayEvent: z.boolean({ required_error: '複数日開催フラグは必須です。' }),
  isMultiRaceEvent: z.boolean({ required_error: '複数レース開催フラグは必須です。' }),
  raceSchedules: z.array(raceScheduleDetailSchema),
  entryReceptionStatus: entryReceptionStatusSchema,
  startListStatus: startListStatusSchema,
  resultPublicationStatus: resultPublicationStatusSchema
});

export type PublicEventDetailResponse = z.infer<typeof publicEventDetailResponseSchema>;
