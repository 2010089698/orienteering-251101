import { z } from 'zod';

export const raceFormSchema = z.object({
  name: z.string().min(1, 'レース名を入力してください。'),
  date: z.string().min(1, 'レース日程を入力してください。')
});

export const eventCreateSchema = z
  .object({
    eventId: z.string().min(1, 'イベントIDを入力してください。'),
    eventName: z.string().min(1, 'イベント名を入力してください。'),
    startDate: z.string().min(1, 'イベント開始日を入力してください。'),
    endDate: z.string().optional(),
    isMultiDay: z.boolean(),
    isMultiRace: z.boolean(),
    raceSchedules: z.array(raceFormSchema).min(1, 'レースは1件以上必要です。')
  })
  .superRefine((data, ctx) => {
    const start = new Date(data.startDate);

    if (Number.isNaN(start.getTime())) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['startDate'],
        message: '開始日は有効な日付形式で入力してください。'
      });
      return;
    }

    const trimmedEndDate = data.endDate?.trim();
    const hasEndDate = Boolean(trimmedEndDate);

    if ((data.isMultiDay || data.isMultiRace || data.raceSchedules.length > 1) && !hasEndDate) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['endDate'],
        message: '複数日または複数レースの場合は終了日を指定してください。'
      });
    }

    if (hasEndDate) {
      const end = new Date(trimmedEndDate!);
      if (Number.isNaN(end.getTime())) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['endDate'],
          message: '終了日は有効な日付形式で入力してください。'
        });
      } else if (end.getTime() < start.getTime()) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['endDate'],
          message: '終了日は開始日以降の日付を指定してください。'
        });
      }
    }

    if (data.raceSchedules.length > 1 && !data.isMultiRace) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['isMultiRace'],
        message: '複数レースを登録する場合は複数レース設定を有効にしてください。'
      });
    }

    const endDateValue = trimmedEndDate ? new Date(trimmedEndDate) : undefined;

    data.raceSchedules.forEach((race, index) => {
      const raceDate = new Date(race.date);
      if (Number.isNaN(raceDate.getTime())) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['raceSchedules', index, 'date'],
          message: 'レース日程は有効な日付形式で入力してください。'
        });
        return;
      }

      if (!hasEndDate && !data.isMultiDay && race.date !== data.startDate) {
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
