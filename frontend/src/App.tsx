import React from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';

import EventCreatePage from './features/events/create/EventCreatePage';
import OrganizerEventDetailPage from './features/events/detail/OrganizerEventDetailPage';
import OrganizerEventListPage from './features/events/list/OrganizerEventListPage';
import ParticipantEventListPage from './features/events/list/ParticipantEventListPage';

const App: React.FC = () => (
  <Routes>
    <Route path="/" element={<Navigate to="/events" replace />} />
    <Route path="/events" element={<OrganizerEventListPage />} />
    <Route path="/events/:eventId" element={<OrganizerEventDetailPage />} />
    <Route path="/events/create" element={<EventCreatePage />} />
    <Route path="/public/events" element={<ParticipantEventListPage />} />
  </Routes>
);

export default App;
