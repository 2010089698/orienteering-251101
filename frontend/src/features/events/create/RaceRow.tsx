import { FieldError, FieldErrors, UseFormRegister } from 'react-hook-form';
import { EventCreateFormValues, RaceFormValue } from './types';

interface RaceRowProps {
  index: number;
  fieldId: string;
  register: UseFormRegister<EventCreateFormValues>;
  errors?: FieldErrors<RaceFormValue> | FieldError;
  onRemove?: () => void;
  canRemove: boolean;
  disabled?: boolean;
}

const getErrorMessage = (errors?: FieldErrors<RaceFormValue> | FieldError): string | undefined => {
  if (!errors) {
    return undefined;
  }

  if ('message' in errors && typeof errors.message === 'string') {
    return errors.message;
  }

  if ('name' in errors && typeof errors.name?.message === 'string') {
    return errors.name.message;
  }

  if ('date' in errors && typeof errors.date?.message === 'string') {
    return errors.date.message;
  }

  return undefined;
};

const RaceRow = ({ index, fieldId, register, errors, onRemove, canRemove, disabled }: RaceRowProps) => {
  const nameFieldId = `race-name-${fieldId}`;
  const dateFieldId = `race-date-${fieldId}`;
  const raceErrorMessage = getErrorMessage(errors);

  return (
    <div role="group" aria-labelledby={`${nameFieldId}-label`}>
      <div>
        <label id={`${nameFieldId}-label`} htmlFor={nameFieldId}>
          レース名 {index + 1}
        </label>
        <input id={nameFieldId} type="text" {...register(`raceSchedules.${index}.name` as const)} disabled={disabled} />
      </div>
      <div>
        <label htmlFor={dateFieldId}>レース日程 {index + 1}</label>
        <input id={dateFieldId} type="date" {...register(`raceSchedules.${index}.date` as const)} disabled={disabled} />
      </div>
      {raceErrorMessage && <p role="alert">{raceErrorMessage}</p>}
      <button type="button" onClick={onRemove} disabled={!canRemove || disabled} aria-label={`レース ${index + 1} を削除`}>
        削除
      </button>
    </div>
  );
};

export default RaceRow;
