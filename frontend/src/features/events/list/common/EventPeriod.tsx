import type { ReactNode } from 'react';

interface EventPeriodProps {
  startDate: string;
  endDate: string;
  separator?: ReactNode;
}

const DEFAULT_SEPARATOR = ' 〜 ';

const EventPeriod = ({ startDate, endDate, separator = DEFAULT_SEPARATOR }: EventPeriodProps) => {
  return (
    <>
      <time dateTime={startDate}>{startDate}</time>
      {separator}
      <time dateTime={endDate}>{endDate}</time>
    </>
  );
};

export default EventPeriod;
