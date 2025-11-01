import { FieldErrors, UseFormRegister } from 'react-hook-form';
import { EventCreateFormValues } from './types';

interface EventBasicSectionProps {
  register: UseFormRegister<EventCreateFormValues>;
  errors: FieldErrors<EventCreateFormValues>;
  disabled?: boolean;
}

const EventBasicSection = ({ register, errors, disabled }: EventBasicSectionProps) => {
  return (
    <section aria-labelledby="event-basic-section-title">
      <h2 id="event-basic-section-title">イベント基本情報</h2>
      <div>
        <label htmlFor="organizer-id">主催者ID</label>
        <input id="organizer-id" type="text" {...register('organizerId')} disabled={disabled} />
        {errors.organizerId && <p role="alert">{errors.organizerId.message}</p>}
      </div>
      <div>
        <label htmlFor="event-id">イベントID</label>
        <input id="event-id" type="text" {...register('eventId')} disabled={disabled} />
        {errors.eventId && <p role="alert">{errors.eventId.message}</p>}
      </div>
      <div>
        <label htmlFor="event-name">イベント名</label>
        <input id="event-name" type="text" {...register('eventName')} disabled={disabled} />
        {errors.eventName && <p role="alert">{errors.eventName.message}</p>}
      </div>
      <div>
        <label htmlFor="event-start-date">イベント開始日</label>
        <input id="event-start-date" type="date" {...register('startDate')} disabled={disabled} />
        {errors.startDate && <p role="alert">{errors.startDate.message}</p>}
      </div>
    </section>
  );
};

export default EventBasicSection;
