import { z } from 'zod';

import { entryReceptionStatusSchema } from './EventCommonSchemas';

function isIsoDateTime(value: string): boolean {
  const parsed = new Date(value);
  return !Number.isNaN(parsed.getTime());
}

function createRequiredStringSchema(requiredMessage: string): z.ZodString {
  return z.string({ required_error: requiredMessage }).min(1, requiredMessage);
}

function createIsoDateTimeSchema(requiredMessage: string, invalidMessage: string): z.ZodString {
  return createRequiredStringSchema(requiredMessage).refine(isIsoDateTime, {
    message: invalidMessage
  });
}

export const entryReceptionClassSchema = z.object({
  classId: createRequiredStringSchema('エントリークラスIDは必須です。'),
  name: createRequiredStringSchema('エントリークラス名は必須です。'),
  capacity: z
    .number({ invalid_type_error: 'エントリークラスの定員は数値で指定してください。' })
    .int('エントリークラスの定員は整数で指定してください。')
    .min(1, 'エントリークラスの定員は1以上の整数で指定してください。')
    .optional()
});

export type EntryReceptionClass = z.infer<typeof entryReceptionClassSchema>;

export const registerEntryReceptionRequestSchema = z.object({
  raceId: createRequiredStringSchema('レースIDは必須です。'),
  receptionStart: createIsoDateTimeSchema(
    '受付開始日時は必須です。',
    '受付開始日時はISO8601形式で指定してください。'
  ),
  receptionEnd: createIsoDateTimeSchema(
    '受付終了日時は必須です。',
    '受付終了日時はISO8601形式で指定してください。'
  ),
  entryClasses: z.array(entryReceptionClassSchema).min(1, 'エントリークラスを1件以上指定してください。')
});

export type RegisterEntryReceptionRequest = z.infer<typeof registerEntryReceptionRequestSchema>;

export const raceEntryReceptionSchema = z.object({
  raceId: createRequiredStringSchema('レースIDは必須です。'),
  receptionStart: createIsoDateTimeSchema(
    '受付開始日時は必須です。',
    '受付開始日時はISO8601形式で指定してください。'
  ),
  receptionEnd: createIsoDateTimeSchema(
    '受付終了日時は必須です。',
    '受付終了日時はISO8601形式で指定してください。'
  ),
  entryClasses: z.array(entryReceptionClassSchema)
});

export const entryReceptionPreparationResponseSchema = z.object({
  eventId: createRequiredStringSchema('イベントIDは必須です。'),
  entryReceptionStatus: entryReceptionStatusSchema,
  raceReceptions: z.array(raceEntryReceptionSchema)
});

export type EntryReceptionPreparationResponse = z.infer<typeof entryReceptionPreparationResponseSchema>;

export const registerEntryReceptionResponseSchema = entryReceptionPreparationResponseSchema;

export type RegisterEntryReceptionResponse = EntryReceptionPreparationResponse;
