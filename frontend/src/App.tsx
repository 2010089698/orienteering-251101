import React from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';

import EventCreatePage from './features/events/create/EventCreatePage';

const EventListPlaceholder: React.FC = () => (
  <main>
    <h1>イベント一覧</h1>
    <p>イベント一覧ページは現在準備中です。</p>
  </main>
);

const App: React.FC = () => (
  <Routes>
    <Route path="/" element={<Navigate to="/events" replace />} />
    <Route path="/events" element={<EventListPlaceholder />} />
    <Route path="/events/create" element={<EventCreatePage />} />
  </Routes>
);

export default App;
