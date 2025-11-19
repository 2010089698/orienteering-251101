import { z } from 'zod';

import { isIsoDateTime, startListStatusSchema } from './EventCommonSchemas';

function createRequiredString(message: string): z.ZodString {
  return z.string({ required_error: message }).min(1, message);
}

const isoDateTimeSchema = createRequiredString('日時は必須です。').refine(isIsoDateTime, {
  message: '日時はISO8601形式で指定してください。',
});

export const startListSettingsSchema = z.object({
  startDateTime: isoDateTimeSchema,
  intervalSeconds: z
    .number({ invalid_type_error: 'スタート間隔は数値で指定してください。' })
    .int('スタート間隔は整数で指定してください。')
    .min(1, 'スタート間隔は1以上の整数で指定してください。'),
  laneCount: z
    .number({ invalid_type_error: 'レーン数は数値で指定してください。' })
    .int('レーン数は整数で指定してください。')
    .min(1, 'レーン数は1以上の整数で指定してください。'),
});

export type StartListSettings = z.infer<typeof startListSettingsSchema>;

export const configureStartListRequestSchema = startListSettingsSchema;

export type ConfigureStartListRequest = z.infer<typeof configureStartListRequestSchema>;

export const startListLaneAssignmentSchema = z.object({
  laneNumber: z
    .number({ invalid_type_error: 'レーン番号は数値で指定してください。' })
    .int('レーン番号は整数で指定してください。')
    .min(1, 'レーン番号は1以上の整数で指定してください。'),
  entryClassId: createRequiredString('エントリークラスIDは必須です。'),
});

export type StartListLaneAssignment = z.infer<typeof startListLaneAssignmentSchema>;

export const assignClassesToLanesRequestSchema = z.object({
  assignments: z
    .array(startListLaneAssignmentSchema, {
      required_error: 'レーン割り当ては配列で指定してください。',
    })
    .min(1, 'レーン割り当てを1件以上指定してください。'),
});

export type AssignClassesToLanesRequest = z.infer<
  typeof assignClassesToLanesRequestSchema
>;

export const startListParticipantSlotSchema = z.object({
  laneNumber: z.number(),
  entryClassId: z.string(),
  participantEntryId: z.string(),
  participantName: z.string(),
  startTime: isoDateTimeSchema,
  sequence: z.number(),
});

export type StartListParticipantSlot = z.infer<typeof startListParticipantSlotSchema>;

export const startListDraftResponseSchema = z.object({
  eventId: createRequiredString('イベントIDは必須です。'),
  raceId: createRequiredString('レースIDは必須です。'),
  status: startListStatusSchema,
  settings: startListSettingsSchema,
  lanes: z.array(startListLaneAssignmentSchema),
  participants: z.array(startListParticipantSlotSchema),
});

export type StartListDraftResponse = z.infer<typeof startListDraftResponseSchema>;

export const scheduleParticipantsRequestSchema = z.object({});
export type ScheduleParticipantsRequest = z.infer<
  typeof scheduleParticipantsRequestSchema
>;

export const finalizeStartListRequestSchema = z.object({});
export type FinalizeStartListRequest = z.infer<typeof finalizeStartListRequestSchema>;
