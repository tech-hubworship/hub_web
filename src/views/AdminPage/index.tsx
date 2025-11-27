// 파일 경로: src/views/AdminPage/index.tsx

import { AdminMDIProvider } from '@src/contexts/AdminMDIContext';
import MDIAdminPage from './MDIAdminPage';

export default function AdminPageWrapper() {
  return (
    <AdminMDIProvider>
      <MDIAdminPage />
    </AdminMDIProvider>
  );
}
