import React from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';

import EventCreatePage from './features/events/create/EventCreatePage';
import OrganizerEventDetailPage from './features/events/detail/OrganizerEventDetailPage';
import ParticipantEventDetailPage from './features/events/detail/ParticipantEventDetailPage';
import OrganizerEventListPage from './features/events/list/OrganizerEventListPage';
import ParticipantEventListPage from './features/events/list/ParticipantEventListPage';
import EntryReceptionCreatePage from './features/events/entryReception/create/EntryReceptionCreatePage';
import EntryReceptionManagementPage from './features/events/entryReception/manage/EntryReceptionManagementPage';
import ParticipantEntryCreatePage from './features/events/entry/create/ParticipantEntryCreatePage';

const App: React.FC = () => (
  <Routes>
    <Route path="/" element={<Navigate to="/events" replace />} />
    <Route path="/events" element={<OrganizerEventListPage />} />
    <Route path="/events/:eventId" element={<OrganizerEventDetailPage />} />
    <Route path="/events/create" element={<EventCreatePage />} />
    <Route
      path="/events/:eventId/entry-receptions/create"
      element={<EntryReceptionCreatePage />}
    />
    <Route
      path="/events/:eventId/entry-receptions"
      element={<EntryReceptionManagementPage />}
    />
    <Route path="/public/events" element={<ParticipantEventListPage />} />
    <Route path="/public/events/:eventId" element={<ParticipantEventDetailPage />} />
    <Route
      path="/public/events/:eventId/entries/new"
      element={<ParticipantEntryCreatePage />}
    />
  </Routes>
);

export default App;
