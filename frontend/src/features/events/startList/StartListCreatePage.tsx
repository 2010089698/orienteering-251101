import { Link, useParams } from 'react-router-dom';

const StartListCreatePage = () => {
  const { eventId = '' } = useParams<'eventId'>();
  const headingId = 'start-list-create-heading';

  return (
    <main aria-labelledby={headingId}>
      <Link to={`/events/${eventId}`}>イベント詳細に戻る</Link>
      <h1 id={headingId}>スタートリスト作成</h1>
      <p>このページではスタートリストの作成を行います。</p>
    </main>
  );
};

export default StartListCreatePage;
