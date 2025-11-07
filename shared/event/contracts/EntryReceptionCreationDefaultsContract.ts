import { z } from 'zod';

function isIsoDateTime(value: string): boolean {
  const parsed = new Date(value);
  return !Number.isNaN(parsed.getTime());
}

function createRequiredStringSchema(requiredMessage: string): z.ZodString {
  return z.string({ required_error: requiredMessage }).min(1, requiredMessage);
}

const optionalIsoDateTimeSchema = z
  .string()
  .refine(isIsoDateTime, { message: '日時はISO8601形式で指定してください。' })
  .optional();

export const entryReceptionClassTemplateSchema = z.object({
  classId: createRequiredStringSchema('エントリークラスIDは必須です。'),
  name: createRequiredStringSchema('エントリークラス名は必須です。'),
  capacity: z
    .number({ invalid_type_error: 'エントリークラスの定員は数値で指定してください。' })
    .int('エントリークラスの定員は整数で指定してください。')
    .min(1, 'エントリークラスの定員は1以上の整数で指定してください。')
    .optional()
});

export type EntryReceptionClassTemplate = z.infer<typeof entryReceptionClassTemplateSchema>;

export const entryReceptionRaceDefaultsSchema = z.object({
  raceId: createRequiredStringSchema('レースIDは必須です。'),
  raceName: createRequiredStringSchema('レース名は必須です。'),
  defaultReceptionStart: optionalIsoDateTimeSchema,
  defaultReceptionEnd: optionalIsoDateTimeSchema,
  classTemplates: z.array(entryReceptionClassTemplateSchema)
});

export type EntryReceptionRaceDefaults = z.infer<typeof entryReceptionRaceDefaultsSchema>;

export const entryReceptionCreationDefaultsResponseSchema = z.object({
  eventId: createRequiredStringSchema('イベントIDは必須です。'),
  eventName: createRequiredStringSchema('イベント名は必須です。'),
  races: z.array(entryReceptionRaceDefaultsSchema)
});

export type EntryReceptionCreationDefaultsResponse = z.infer<
  typeof entryReceptionCreationDefaultsResponseSchema
>;

