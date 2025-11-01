import { FieldErrors, UseFormRegister } from 'react-hook-form';
import { EventCreateFormValues, RaceFormValue } from './types';
import RaceRow from './RaceRow';

interface RaceListSectionProps {
  register: UseFormRegister<EventCreateFormValues>;
  races: { id: string }[];
  errors: FieldErrors<EventCreateFormValues>;
  onAddRace: () => void;
  onRemoveRace: (index: number) => void;
  canAddMore: boolean;
  minRaceCount: number;
  disabled?: boolean;
}

const RaceListSection = ({
  register,
  races,
  errors,
  onAddRace,
  onRemoveRace,
  canAddMore,
  minRaceCount,
  disabled
}: RaceListSectionProps) => {
  const raceErrors = (errors.raceSchedules as Array<FieldErrors<RaceFormValue>> | undefined) ?? [];

  return (
    <section aria-labelledby="race-list-section-title">
      <h2 id="race-list-section-title">レース日程</h2>
      {races.map((field, index) => (
        <RaceRow
          key={field.id}
          fieldId={field.id}
          index={index}
          register={register}
          errors={raceErrors[index]}
          onRemove={() => onRemoveRace(index)}
          canRemove={races.length > minRaceCount}
          disabled={disabled}
        />
      ))}
      <button type="button" onClick={onAddRace} disabled={!canAddMore || disabled}>
        レースを追加
      </button>
      {!canAddMore && !disabled && <p role="note">追加できるレース数の上限に達しました。</p>}
    </section>
  );
};

export default RaceListSection;
