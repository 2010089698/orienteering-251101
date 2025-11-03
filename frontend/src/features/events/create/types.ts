import { z } from 'zod';
import {
  collectCreateEventDateIssues,
  createEventRequestBaseSchema,
  raceScheduleRequestSchema
} from '@shared/event/contracts/CreateEventContract';

export const raceFormSchema = raceScheduleRequestSchema;

export const eventCreateSchema = createEventRequestBaseSchema
  .extend({
    isMultiDay: z.boolean(),
    isMultiRace: z.boolean(),
    publishImmediately: z.boolean().default(false)
  })
  .superRefine((data, ctx) => {
    const baseIssues = collectCreateEventDateIssues(data);
    const hasEndDateIssue = baseIssues.some((issue) => issue.path.length === 1 && issue.path[0] === 'endDate');

    for (const issue of baseIssues) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: issue.path,
        message: issue.message
      });
    }

    const start = new Date(data.startDate);
    if (Number.isNaN(start.getTime())) {
      return;
    }

    const endDateValue = data.endDate ? new Date(data.endDate) : undefined;
    if (endDateValue && Number.isNaN(endDateValue.getTime())) {
      return;
    }

    if ((data.isMultiDay || data.isMultiRace) && !data.endDate && !hasEndDateIssue) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['endDate'],
        message: '複数日または複数レースの場合は終了日を指定してください。'
      });
    }

    if (data.raceSchedules.length > 1 && !data.isMultiRace) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['isMultiRace'],
        message: '複数レースを登録する場合は複数レース設定を有効にしてください。'
      });
    }

    data.raceSchedules.forEach((race, index) => {
      const raceDate = new Date(race.date);

      if (!data.isMultiDay && !data.endDate && race.date !== data.startDate) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['raceSchedules', index, 'date'],
          message: '単一日イベントでは開始日と同じ日付を指定してください。'
        });
      }

      if (endDateValue && (raceDate.getTime() < start.getTime() || raceDate.getTime() > endDateValue.getTime())) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['raceSchedules', index, 'date'],
          message: 'レース日程はイベント期間内で指定してください。'
        });
      }
    });
  });

export type RaceFormValue = z.infer<typeof raceFormSchema>;
export type EventCreateFormValues = z.infer<typeof eventCreateSchema>;

export const DEFAULT_FORM_VALUES: EventCreateFormValues = {
  eventId: '',
  eventName: '',
  startDate: '',
  endDate: '',
  isMultiDay: false,
  isMultiRace: false,
  publishImmediately: false,
  raceSchedules: [{ name: '', date: '' }]
};
