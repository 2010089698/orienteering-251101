import { z } from 'zod';

function isIsoDateOnly(value: string): boolean {
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

const isoDateOnlySchema = z
  .string({ required_error: '日付は必須です。' })
  .refine(isIsoDateOnly, { message: '日付はYYYY-MM-DD形式のISO8601で指定してください。' });

export const eventSummarySchema = z.object({
  eventId: z.string({ required_error: 'イベントIDは必須です。' }).min(1, 'イベントIDは必須です。'),
  eventName: z.string({ required_error: 'イベント名は必須です。' }).min(1, 'イベント名は必須です。'),
  startDate: isoDateOnlySchema,
  endDate: isoDateOnlySchema,
  isMultiDayEvent: z.boolean({ required_error: '複数日開催フラグは必須です。' }),
  isMultiRaceEvent: z.boolean({ required_error: '複数レース開催フラグは必須です。' })
});

export const eventSummaryListResponseSchema = z.array(eventSummarySchema);

export type EventSummary = z.infer<typeof eventSummarySchema>;
export type EventSummaryListResponse = z.infer<typeof eventSummaryListResponseSchema>;
