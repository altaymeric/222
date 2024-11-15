import React, { useRef, useState } from 'react';
import * as XLSX from 'xlsx';
import { Payment } from '../../types/payment';
import { ImportSuccessDialog } from './ImportSuccessDialog';
import { processImportedData } from './utils';
import ConfirmationDialog from '../ConfirmationDialog';

interface ExcelImportProps {
  onImport: (payments: Payment[]) => void;
}

interface ImportData {
  count: number;
  totalAmount: number;
  paidCount: number;
  paidAmount: number;
}

export default function ExcelImport({ onImport }: ExcelImportProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [showSuccessDialog, setShowSuccessDialog] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [importData, setImportData] = useState<ImportData | null>(null);
  const [paymentsToImport, setPaymentsToImport] = useState<Payment[]>([]);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });
        const worksheet = workbook.Sheets[workbook.SheetNames[0]];
        const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

        const payments = processImportedData(jsonData);
        setPaymentsToImport(payments);
        
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }

        const paidPayments = payments.filter(p => p.status === 'paid');
        
        setImportData({
          count: payments.length,
          totalAmount: payments.reduce((sum, p) => sum + p.amount, 0),
          paidCount: paidPayments.length,
          paidAmount: paidPayments.reduce((sum, p) => sum + p.amount, 0)
        });
        setShowConfirmation(true);
      } catch (error: any) {
        console.error('Excel okuma hatası:', error);
        alert(error.message || 'Excel dosyası okunurken bir hata oluştu');
      }
    };
    reader.readAsArrayBuffer(file);
  };

  const handleConfirmImport = () => {
    setShowConfirmation(false);
    setShowSuccessDialog(true);
  };

  const handleSaveImport = () => {
    onImport(paymentsToImport);
    setShowSuccessDialog(false);
    setImportData(null);
    setPaymentsToImport([]);
  };

  return (
    <div className="relative inline-block">
      <input
        ref={fileInputRef}
        type="file"
        accept=".xlsx,.xls"
        onChange={handleFileUpload}
        className="hidden"
      />
      <button
        onClick={() => fileInputRef.current?.click()}
        className="inline-flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 h-[38px]"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
        </svg>
        <span>Excel'den Aktar</span>
      </button>

      <ConfirmationDialog
        isOpen={showConfirmation}
        onClose={() => setShowConfirmation(false)}
        onConfirm={handleConfirmImport}
        title="Excel Verilerini İçe Aktar"
        message={
          <div className="space-y-4">
            <p>Aşağıdaki verileri kontrol etmek ister misiniz?</p>
            {importData && (
              <div className="space-y-2 text-sm">
                <div className="bg-gray-50 p-3 rounded">
                  <div className="flex justify-between">
                    <span>Toplam Çek Sayısı:</span>
                    <span className="font-medium">{importData.count} adet</span>
                  </div>
                  <div className="flex justify-between mt-1">
                    <span>Toplam Tutar:</span>
                    <span className="font-medium">
                      {importData.totalAmount.toLocaleString('tr-TR', { style: 'currency', currency: 'TRY' })}
                    </span>
                  </div>
                </div>
                {importData.paidCount > 0 && (
                  <div className="bg-red-50 p-3 rounded">
                    <div className="flex justify-between">
                      <span className="text-red-700">Vadesi Geçmiş Çek Sayısı:</span>
                      <span className="font-medium text-red-700">{importData.paidCount} adet</span>
                    </div>
                    <div className="flex justify-between mt-1">
                      <span className="text-red-700">Vadesi Geçmiş Toplam:</span>
                      <span className="font-medium text-red-700">
                        {importData.paidAmount.toLocaleString('tr-TR', { style: 'currency', currency: 'TRY' })}
                      </span>
                    </div>
                  </div>
                )}
              </div>
            )}
            <div className="bg-blue-50 p-3 rounded">
              <p className="text-blue-700 text-sm">
                Verileri kontrol ettikten sonra kaydetme seçeneği sunulacaktır.
              </p>
            </div>
          </div>
        }
      />

      {importData && (
        <ImportSuccessDialog
          isOpen={showSuccessDialog}
          onClose={() => {
            setShowSuccessDialog(false);
            setImportData(null);
          }}
          count={importData.count}
          totalAmount={importData.totalAmount}
          paidCount={importData.paidCount}
          paidAmount={importData.paidAmount}
          onSave={handleSaveImport}
        />
      )}
    </div>
  );
}