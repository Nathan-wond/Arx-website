import React, { createContext, useContext, useState } from 'react';
import { api } from '../services/api.js';

export interface Certificate {
  id: string;
  certificateId: string;
  studentName: string;
  courseName: string;
  achievement?: string;
  role?: string;
  issueDate?: string;
  status?: string;
  signature?: string;
  qrCodeUrl?: string;
  [key: string]: any;
}

interface ModalContextType {
  activeCertificate: Certificate | null;
  openCertificateModal: (certOrId: Certificate | string) => Promise<void>;
  closeCertificateModal: () => void;
}

const ModalContext = createContext<ModalContextType>({
  activeCertificate: null,
  openCertificateModal: async () => {},
  closeCertificateModal: () => {}
});

export const ModalProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [activeCertificate, setActiveCertificate] = useState<Certificate | null>(null);

  const openCertificateModal = async (certOrId: Certificate | string) => {
    if (typeof certOrId === 'object' && certOrId !== null) {
      setActiveCertificate(certOrId);
      return;
    }
    try {
      const res = await api.getCertificateById(certOrId);
      if (res && res.certificate) {
        setActiveCertificate(res.certificate);
      }
    } catch (err) {
      console.error('[CertModal] Failed to fetch certificate', certOrId, err);
    }
  };

  const closeCertificateModal = () => {
    setActiveCertificate(null);
  };

  return (
    <ModalContext.Provider value={{ activeCertificate, openCertificateModal, closeCertificateModal }}>
      {children}
    </ModalContext.Provider>
  );
};

export const useModal = () => useContext(ModalContext);
