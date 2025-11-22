import { Link, useParams } from 'react-router-dom';

const StartListManagementPage = () => {
  const { eventId = '' } = useParams<'eventId'>();
  const headingId = 'start-list-management-heading';

  return (
    <main aria-labelledby={headingId}>
      <Link to={`/events/${eventId}`}>イベント詳細に戻る</Link>
      <h1 id={headingId}>スタートリスト管理</h1>
      <p>このページでは既存のスタートリストを管理します。</p>
    </main>
  );
};

export default StartListManagementPage;
