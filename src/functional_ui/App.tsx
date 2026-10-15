/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import './index.css';
import { Routes, Route } from 'react-router-dom';
import { HubBridgeProvider } from './context/HubBridgeContext';
import { AppShell } from './components/AppShell';
import FeedPage from './pages/Feed';
import RequestsPage from './pages/Requests';
import HealthcarePage from './pages/Healthcare';
import DirectoryPage from './pages/Directory';
import ChallengesPage from './pages/Challenges';
import ProfilePage from './pages/Profile';
import SettingsPage from './pages/Settings';

export function FunctionalWorkspace() {
  return (
    <HubBridgeProvider>
      <Routes>
        <Route element={<AppShell />}>
          <Route index element={<RequestsPage />} />
          <Route path="/" element={<RequestsPage />} />
          <Route path="/requests" element={<RequestsPage />} />
          <Route path="/profile" element={<ProfilePage />} />
          <Route path="*" element={<RequestsPage />} />
        </Route>
      </Routes>
    </HubBridgeProvider>
  );
}

export default FunctionalWorkspace;

