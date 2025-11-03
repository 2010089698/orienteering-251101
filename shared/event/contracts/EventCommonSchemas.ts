import { z } from 'zod';

export function isIsoDateOnly(value: string): boolean {
  const isoDateOnlyPattern = /^\d{4}-\d{2}-\d{2}$/;
  if (!isoDateOnlyPattern.test(value)) {
    return false;
  }

  const [year, month, day] = value.split('-').map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));

  return (
    date.getUTCFullYear() === year &&
    date.getUTCMonth() === month - 1 &&
    date.getUTCDate() === day
  );
}

export const isoDateOnlySchema = z
  .string({ required_error: '日付は必須です。' })
  .refine(isIsoDateOnly, { message: '日付はYYYY-MM-DD形式のISO8601で指定してください。' });

export const raceScheduleDetailSchema = z.object({
  name: z.string({ required_error: 'レース名は必須です。' }).min(1, 'レース名は必須です。'),
  date: isoDateOnlySchema
});

export const entryReceptionStatusSchema = z.enum(
  ['NOT_REGISTERED', 'OPEN', 'CLOSED'],
  {
    required_error: 'エントリー受付の状態は必須です。'
  }
);

export const startListStatusSchema = z.enum(
  ['NOT_CREATED', 'DRAFT', 'PUBLISHED'],
  {
    required_error: 'スタートリストの状態は必須です。'
  }
);

export const resultPublicationStatusSchema = z.enum(
  ['NOT_PUBLISHED', 'PUBLISHED'],
  {
    required_error: 'リザルト公開状態は必須です。'
  }
);

export type RaceScheduleDetail = z.infer<typeof raceScheduleDetailSchema>;
export type EntryReceptionStatus = z.infer<typeof entryReceptionStatusSchema>;
export type StartListStatus = z.infer<typeof startListStatusSchema>;
export type ResultPublicationStatus = z.infer<typeof resultPublicationStatusSchema>;
