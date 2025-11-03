import React from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';

import EventCreatePage from './features/events/create/EventCreatePage';
import OrganizerEventDetailPage from './features/events/detail/OrganizerEventDetailPage';
import OrganizerEventListPage from './features/events/list/OrganizerEventListPage';

const App: React.FC = () => (
  <Routes>
    <Route path="/" element={<Navigate to="/events" replace />} />
    <Route path="/events" element={<OrganizerEventListPage />} />
    <Route path="/events/:eventId" element={<OrganizerEventDetailPage />} />
    <Route path="/events/create" element={<EventCreatePage />} />
  </Routes>
);

export default App;
