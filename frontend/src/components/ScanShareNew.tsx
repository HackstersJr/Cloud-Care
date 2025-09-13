import { useAuth } from '../contexts/AuthContext';
import PatientScanShare from './scan/PatientScanShare';
import DoctorScanShare from './scan/DoctorScanShare';

const ScanShare = () => {
  const { user } = useAuth();

  // Render role-specific scan interface
  if (user?.role === 'doctor') {
    return <DoctorScanShare />;
  }
  
  // Default to patient interface (includes 'patient' role and others)
  return <PatientScanShare />;
};

export default ScanShare;
