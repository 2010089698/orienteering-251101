import { z } from 'zod';

import { isIsoDateTime } from './EventCommonSchemas';

function createRequiredStringSchema(requiredMessage: string): z.ZodString {
  return z.string({ required_error: requiredMessage }).min(1, requiredMessage);
}

function createRequiredIsoDateTimeSchema(requiredMessage: string): z.ZodString {
  return createRequiredStringSchema(requiredMessage).refine(isIsoDateTime, {
    message: '日時はISO8601形式で指定してください。'
  });
}

export const entryReceptionParticipantSchema = z.object({
  entryId: createRequiredStringSchema('エントリーIDは必須です。'),
  name: createRequiredStringSchema('参加者氏名は必須です。'),
  email: createRequiredStringSchema('連絡先メールアドレスは必須です。').email(
    '連絡先メールアドレスはメールアドレス形式で指定してください。'
  ),
  submittedAt: createRequiredIsoDateTimeSchema('申込日時は必須です。')
});

export type EntryReceptionParticipant = z.infer<typeof entryReceptionParticipantSchema>;

export const entryReceptionClassParticipantsSchema = z.object({
  classId: createRequiredStringSchema('エントリークラスIDは必須です。'),
  className: createRequiredStringSchema('エントリークラス名は必須です。'),
  capacity: z
    .number({ invalid_type_error: 'エントリークラスの定員は数値で指定してください。' })
    .int('エントリークラスの定員は整数で指定してください。')
    .min(1, 'エントリークラスの定員は1以上の整数で指定してください。')
    .optional(),
  participantCount: z
    .number({ invalid_type_error: '参加者数は数値で指定してください。' })
    .int('参加者数は整数で指定してください。')
    .min(0, '参加者数は0以上の整数で指定してください。'),
  participants: z.array(entryReceptionParticipantSchema)
});

export type EntryReceptionClassParticipants = z.infer<
  typeof entryReceptionClassParticipantsSchema
>;

export const entryReceptionRaceParticipantsSchema = z.object({
  raceId: createRequiredStringSchema('レースIDは必須です。'),
  raceName: createRequiredStringSchema('レース名は必須です。'),
  participantCount: z
    .number({ invalid_type_error: '参加者数は数値で指定してください。' })
    .int('参加者数は整数で指定してください。')
    .min(0, '参加者数は0以上の整数で指定してください。'),
  entryClasses: z.array(entryReceptionClassParticipantsSchema)
});

export type EntryReceptionRaceParticipants = z.infer<
  typeof entryReceptionRaceParticipantsSchema
>;

export const entryReceptionParticipantsResponseSchema = z.object({
  eventId: createRequiredStringSchema('イベントIDは必須です。'),
  eventName: createRequiredStringSchema('イベント名は必須です。'),
  totalParticipants: z
    .number({ invalid_type_error: '総参加者数は数値で指定してください。' })
    .int('総参加者数は整数で指定してください。')
    .min(0, '総参加者数は0以上の整数で指定してください。'),
  races: z.array(entryReceptionRaceParticipantsSchema)
});

export type EntryReceptionParticipantsResponse = z.infer<
  typeof entryReceptionParticipantsResponseSchema
>;

