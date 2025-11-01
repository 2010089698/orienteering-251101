interface MultiDaySectionProps {
  isMultiDay: boolean;
  isMultiRace: boolean;
  endDate?: string;
  endDateError?: string;
  onToggleMultiDay: (value: boolean) => void;
  onToggleMultiRace: (value: boolean) => void;
  onEndDateChange: (value: string) => void;
  disabled?: boolean;
}

const MultiDaySection = ({
  isMultiDay,
  isMultiRace,
  endDate,
  endDateError,
  onToggleMultiDay,
  onToggleMultiRace,
  onEndDateChange,
  disabled
}: MultiDaySectionProps) => {
  return (
    <section aria-labelledby="event-multiday-section-title">
      <h2 id="event-multiday-section-title">開催期間</h2>
      <div>
        <label htmlFor="multi-day-toggle">
          <input
            id="multi-day-toggle"
            type="checkbox"
            checked={isMultiDay}
            onChange={(event) => onToggleMultiDay(event.target.checked)}
            disabled={disabled}
          />
          複数日イベント
        </label>
      </div>
      <div>
        <label htmlFor="multi-race-toggle">
          <input
            id="multi-race-toggle"
            type="checkbox"
            checked={isMultiRace}
            onChange={(event) => onToggleMultiRace(event.target.checked)}
            disabled={disabled}
          />
          複数レース
        </label>
      </div>
      <div>
        <label htmlFor="event-end-date">イベント終了日</label>
        <input
          id="event-end-date"
          type="date"
          value={endDate ?? ''}
          onChange={(event) => onEndDateChange(event.target.value)}
          disabled={disabled || (!isMultiDay && !isMultiRace)}
        />
        {endDateError && <p role="alert">{endDateError}</p>}
      </div>
    </section>
  );
};

export default MultiDaySection;
