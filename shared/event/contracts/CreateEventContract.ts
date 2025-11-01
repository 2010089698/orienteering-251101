import { z } from 'zod';

function isIsoDateString(value: string): boolean {
  const date = new Date(value);
  return !Number.isNaN(date.getTime());
}

function createRequiredStringSchema(requiredMessage: string): z.ZodString {
  return z.string({ required_error: requiredMessage }).min(1, requiredMessage);
}

function createIsoDateSchema(requiredMessage: string, invalidMessage: string) {
  return createRequiredStringSchema(requiredMessage).refine(isIsoDateString, {
    message: invalidMessage
  });
}

export const raceScheduleRequestSchema = z.object({
  name: createRequiredStringSchema('レース名は必須です。'),
  date: createIsoDateSchema('レース日程は必須です。', 'レース日程はISO8601形式で指定してください。')
});

export type RaceScheduleRequest = z.infer<typeof raceScheduleRequestSchema>;

export const createEventRequestBaseSchema = z.object({
  eventId: createRequiredStringSchema('イベントIDは必須です。'),
  eventName: createRequiredStringSchema('イベント名は必須です。'),
  startDate: createIsoDateSchema('イベント開始日は必須です。', 'イベント開始日はISO8601形式で指定してください。'),
  endDate: createIsoDateSchema('イベント終了日は必須です。', 'イベント終了日はISO8601形式で指定してください。').optional(),
  raceSchedules: z.array(raceScheduleRequestSchema).min(1, 'レース日程を1件以上指定してください。')
});

export const createEventRequestSchema = createEventRequestBaseSchema.superRefine((data, ctx) => {
  const issues = collectCreateEventDateIssues(data);
  for (const issue of issues) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: issue.path,
      message: issue.message
    });
  }
});

export type CreateEventRequest = z.infer<typeof createEventRequestSchema>;

export interface CreateEventContractIssue {
  path: (string | number)[];
  message: string;
}

export type CreateEventDateValidationTarget = Pick<CreateEventRequest, 'startDate' | 'endDate' | 'raceSchedules'>;

export function collectCreateEventDateIssues(target: CreateEventDateValidationTarget): CreateEventContractIssue[] {
  const issues: CreateEventContractIssue[] = [];
  const start = new Date(target.startDate);

  if (Number.isNaN(start.getTime())) {
    issues.push({ path: ['startDate'], message: 'イベント開始日はISO8601形式で指定してください。' });
    return issues;
  }

  if (target.endDate === undefined || target.endDate === null || target.endDate.trim() === '') {
    if (target.raceSchedules.length > 1) {
      issues.push({ path: ['endDate'], message: '複数レースの場合はイベント終了日を指定してください。' });
    }

    return issues;
  }

  const end = new Date(target.endDate);

  if (Number.isNaN(end.getTime())) {
    issues.push({ path: ['endDate'], message: 'イベント終了日はISO8601形式で指定してください。' });
    return issues;
  }

  if (end.getTime() < start.getTime()) {
    issues.push({ path: ['endDate'], message: 'イベント終了日は開始日以降の日付を指定してください。' });
  }

  return issues;
}
