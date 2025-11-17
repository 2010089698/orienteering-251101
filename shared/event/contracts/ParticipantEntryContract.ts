import { z } from 'zod';

import {
  entryReceptionStatusSchema,
  isoDateOnlySchema,
  isIsoDateTime
} from './EventCommonSchemas';

function createRequiredStringSchema(requiredMessage: string): z.ZodString {
  return z.string({ required_error: requiredMessage }).min(1, requiredMessage);
}

function createIsoDateTimeSchema(requiredMessage: string, invalidMessage: string): z.ZodString {
  return createRequiredStringSchema(requiredMessage).refine(isIsoDateTime, {
    message: invalidMessage
  });
}

export const participantEntryClassOptionSchema = z.object({
  classId: createRequiredStringSchema('エントリークラスIDは必須です。'),
  name: createRequiredStringSchema('エントリークラス名は必須です。'),
  capacity: z
    .number({ invalid_type_error: 'エントリークラスの定員は数値で指定してください。' })
    .int('エントリークラスの定員は整数で指定してください。')
    .min(1, 'エントリークラスの定員は1以上の整数で指定してください。')
    .optional()
});

export type ParticipantEntryClassOption = z.infer<typeof participantEntryClassOptionSchema>;

export const participantEntryRaceOptionSchema = z.object({
  raceId: createRequiredStringSchema('レースIDは必須です。'),
  raceName: createRequiredStringSchema('レース名は必須です。'),
  raceDate: isoDateOnlySchema,
  receptionStart: createIsoDateTimeSchema(
    '受付開始日時は必須です。',
    '受付開始日時はISO8601形式で指定してください。'
  ),
  receptionEnd: createIsoDateTimeSchema(
    '受付終了日時は必須です。',
    '受付終了日時はISO8601形式で指定してください。'
  ),
  entryClasses: z.array(participantEntryClassOptionSchema).min(1, 'エントリークラスを1件以上指定してください。')
});

export type ParticipantEntryRaceOption = z.infer<typeof participantEntryRaceOptionSchema>;

export const participantEntrySelectionResponseSchema = z.object({
  eventId: createRequiredStringSchema('イベントIDは必須です。'),
  eventName: createRequiredStringSchema('イベント名は必須です。'),
  entryReceptionStatus: entryReceptionStatusSchema,
  races: z
    .array(participantEntryRaceOptionSchema)
    .min(1, 'エントリー対象のレースを1件以上指定してください。')
});

export type ParticipantEntrySelectionResponse = z.infer<
  typeof participantEntrySelectionResponseSchema
>;

export const participantEntryApplicantSchema = z.object({
  name: createRequiredStringSchema('参加者氏名は必須です。'),
  email: createRequiredStringSchema('連絡先メールアドレスは必須です。').email(
    '連絡先メールアドレスはメールアドレス形式で指定してください。'
  ),
  organization: z.string().optional(),
  cardNumber: z.string().optional()
});

export type ParticipantEntryApplicant = z.infer<typeof participantEntryApplicantSchema>;

export const registerParticipantEntryRequestSchema = z.object({
  eventId: createRequiredStringSchema('イベントIDは必須です。'),
  raceId: createRequiredStringSchema('レースIDは必須です。'),
  classId: createRequiredStringSchema('エントリークラスIDは必須です。'),
  participant: participantEntryApplicantSchema
});

export type RegisterParticipantEntryRequest = z.infer<
  typeof registerParticipantEntryRequestSchema
>;
