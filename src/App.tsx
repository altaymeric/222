import React, { useState, useEffect } from 'react';
import PaymentForm from './components/PaymentForm';
import PaymentList from './components/PaymentList';
import PaymentSummary from './components/PaymentSummary';
import Modal from './components/Modal';
import CategoryManagement from './components/CategoryManagement';
import ExcelImport from './components/ExcelImport';
import BackupRestore from './components/BackupRestore';
import PrintOptions from './components/PrintOptions';
import UserManagement from './components/UserManagement';
import LoginForm from './components/LoginForm';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { Payment } from './types/payment';
import { User, LoginFormData } from './types/user';
import ConfirmationDialog from './components/ConfirmationDialog';
import { db } from './database/db';

function App() {
  const { user, login, logout } = useAuth();
  const [showPaymentForm, setShowPaymentForm] = useState(false);
  const [editingPayment, setEditingPayment] = useState<Payment | null>(null);
  const [showCategoryManagement, setShowCategoryManagement] = useState(false);
  const [showUserManagement, setShowUserManagement] = useState(false);
  const [loginError, setLoginError] = useState<string>();
  const [showClearConfirmation, setShowClearConfirmation] = useState(false);
  const [showPasswordConfirmation, setShowPasswordConfirmation] = useState(false);
  const [passwordError, setPasswordError] = useState<string>();
  const [payments, setPayments] = useState<Payment[]>([]);

  const [users, setUsers] = useState<User[]>(() => {
    const savedUsers = localStorage.getItem('users');
    if (savedUsers) {
      return JSON.parse(savedUsers);
    }
    return [{
      id: '1',
      username: 'altay',
      password: '123456',
      permissions: {
        add: true,
        edit: true,
        delete: true,
        changeStatus: true,
        manageCategories: true,
        manageUsers: true
      }
    }];
  });

  const [categories, setCategories] = useState<Category[]>([
    {
      id: 'bank',
      name: 'Banka',
      items: [
        'Halk Bankası',
        'Halk Bankası Hamiline',
        'Ziraat Bankası',
        'Ziraat Bankası Hamiline',
        'Deniz Bank'
      ]
    },
    {
      id: 'company',
      name: 'Firma',
      items: [
        'DOĞU İNŞAAT',
        'DOĞU İNŞAAT HAMİLİNE',
        'ALTAY',
        'ALTAY HAMİLİNE',
        'ONURAY İNŞAAT'
      ]
    },
    {
      id: 'businessGroup',
      name: 'İş Grubu',
      items: [
        'KULU',
        'CİHANBEYLİ',
        'AKHİSAR',
        'AKSARAY',
        'ESENYURT',
        'SHİFA',
        'KONYA OKUL',
        'OKUL ONARIM',
        'HATIR ÇEKİ',
        'DİĞER'
      ]
    }
  ]);

  useEffect(() => {
    const loadPayments = async () => {
      try {
        const loadedPayments = await db.getAllPayments();
        setPayments(loadedPayments);
      } catch (error) {
        console.error('Veri yükleme hatası:', error);
        alert('Ödemeler yüklenirken bir hata oluştu');
      }
    };
    loadPayments();
  }, []);

  const handleLogin = (data: LoginFormData) => {
    const foundUser = users.find(u => 
      u.username === data.username && u.password === data.password
    );

    if (foundUser) {
      login(foundUser);
      setLoginError(undefined);
    } else {
      setLoginError('Geçersiz kullanıcı adı veya şifre');
    }
  };

  const handlePaymentSubmit = async (paymentData: Omit<Payment, 'id' | 'status'>) => {
    if (!user?.permissions.add && !editingPayment) {
      alert('Ödeme ekleme yetkiniz bulunmamaktadır');
      return;
    }

    if (!user?.permissions.edit && editingPayment) {
      alert('Ödeme düzenleme yetkiniz bulunmamaktadır');
      return;
    }

    try {
      if (editingPayment) {
        const updatedPayment = {
          ...paymentData,
          id: editingPayment.id,
          status: editingPayment.status
        };
        await db.updatePayment(updatedPayment);
        setPayments(payments.map(p => 
          p.id === editingPayment.id ? updatedPayment : p
        ));
        setEditingPayment(null);
      } else {
        const newPayment: Payment = {
          ...paymentData,
          id: crypto.randomUUID(),
          status: 'pending'
        };
        await db.savePayment(newPayment);
        setPayments([...payments, newPayment]);
      }
      setShowPaymentForm(false);
    } catch (error) {
      console.error('Ödeme kaydetme hatası:', error);
      alert('Ödeme kaydedilirken bir hata oluştu');
    }
  };

  const handleStatusChange = async (updatedPayment: Payment) => {
    if (!user?.permissions.changeStatus) {
      alert('Ödeme durumu değiştirme yetkiniz bulunmamaktadır');
      return;
    }
    try {
      await db.updatePayment(updatedPayment);
      setPayments(payments.map(p => 
        p.id === updatedPayment.id ? updatedPayment : p
      ));
    } catch (error) {
      console.error('Durum güncelleme hatası:', error);
      alert('Ödeme durumu güncellenirken bir hata oluştu');
    }
  };

  const handleEdit = (payment: Payment) => {
    if (!user?.permissions.edit) {
      alert('Ödeme düzenleme yetkiniz bulunmamaktadır');
      return;
    }
    setEditingPayment(payment);
    setShowPaymentForm(true);
  };

  const handleDelete = async (payment: Payment) => {
    if (!user?.permissions.delete) {
      alert('Ödeme silme yetkiniz bulunmamaktadır');
      return;
    }
    try {
      await db.deletePayment(payment.id);
      setPayments(payments.filter(p => p.id !== payment.id));
    } catch (error) {
      console.error('Silme hatası:', error);
      alert('Ödeme silinirken bir hata oluştu');
    }
  };

  const handleCategorySave = (updatedCategory: Category) => {
    if (!user?.permissions.manageCategories) {
      alert('Kategori yönetimi yetkiniz bulunmamaktadır');
      return;
    }
    setCategories(categories.map(cat =>
      cat.id === updatedCategory.id ? updatedCategory : cat
    ));
  };

  const handleUserSave = (updatedUsers: User[]) => {
    if (!user?.permissions.manageUsers) {
      alert('Kullanıcı yönetimi yetkiniz bulunmamaktadır');
      return;
    }
    setUsers(updatedUsers);
    localStorage.setItem('users', JSON.stringify(updatedUsers));
  };

  const handleImport = async (importedPayments: Payment[]) => {
    if (!user?.permissions.add) {
      alert('Ödeme ekleme yetkiniz bulunmamaktadır');
      return;
    }
    try {
      await db.savePayments(importedPayments);
      setPayments([...payments, ...importedPayments]);
    } catch (error) {
      console.error('Verileri kaydetme hatası:', error);
      alert('Veriler kaydedilirken bir hata oluştu');
    }
  };

  const handleRestore = async (restoredPayments: Payment[]) => {
    if (!user?.permissions.add) {
      alert('Ödeme ekleme yetkiniz bulunmamaktadır');
      return;
    }
    try {
      await db.deleteAllPayments();
      await db.savePayments(restoredPayments);
      setPayments(restoredPayments);
    } catch (error) {
      console.error('Geri yükleme hatası:', error);
      alert('Veriler geri yüklenirken bir hata oluştu');
    }
  };

  const handleClearConfirm = () => {
    setShowClearConfirmation(false);
    setShowPasswordConfirmation(true);
  };

  const handlePasswordConfirm = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!user) return;

    const password = (e.currentTarget.elements.namedItem('password') as HTMLInputElement).value;
    const foundUser = users.find(u => u.id === user.id);

    if (!foundUser || foundUser.password !== password) {
      setPasswordError('Geçersiz şifre');
      return;
    }

    try {
      await db.deleteAllPayments();
      setPayments([]);
      setShowPasswordConfirmation(false);
      setPasswordError(undefined);
    } catch (error) {
      console.error('Verileri temizleme hatası:', error);
      alert('Veriler temizlenirken bir hata oluştu');
    }
  };

  if (!user) {
    return <LoginForm onSubmit={handleLogin} error={loginError} />;
  }

  return (
    <div className="min-h-screen bg-gray-100 py-8 px-4">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Ödeme Takip</h1>
          <div className="flex items-center space-x-4">
            <span className="text-sm text-gray-600">
              Hoş geldiniz, {user.username}
            </span>
            {user.permissions.manageUsers && (
              <button
                onClick={() => setShowUserManagement(true)}
                className="inline-flex items-center space-x-2 px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 h-[38px]"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
                <span>Kullanıcı Yönetimi</span>
              </button>
            )}
            <button
              onClick={logout}
              className="inline-flex items-center space-x-2 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 h-[38px]"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
              <span>Çıkış</span>
            </button>
          </div>
        </div>

        <div className="flex justify-between items-center mb-8">
          <div className="flex space-x-4">
            {user.permissions.add && (
              <button
                onClick={() => {
                  setEditingPayment(null);
                  setShowPaymentForm(true);
                }}
                className="inline-flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 h-[38px]"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
                <span>Yeni Ödeme</span>
              </button>
            )}
            <BackupRestore payments={payments} onRestore={handleRestore} />
            {user.permissions.manageCategories && (
              <button
                onClick={() => setShowCategoryManagement(true)}
                className="inline-flex items-center space-x-2 px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 h-[38px]"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
                <span>Kategori Yönetimi</span>
              </button>
            )}
            <ExcelImport onImport={handleImport} />
            <button
              onClick={() => setShowClearConfirmation(true)}
              className="inline-flex items-center space-x-2 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 h-[38px]"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
              <span>Tüm Verileri Temizle</span>
            </button>
          </div>
        </div>

        <PaymentSummary payments={payments} />
        
        <PaymentList
          payments={payments}
          onStatusChange={handleStatusChange}
          onEdit={handleEdit}
          onDelete={handleDelete}
        />

        <Modal isOpen={showPaymentForm} onClose={() => setShowPaymentForm(false)}>
          <PaymentForm
            onSubmit={handlePaymentSubmit}
            initialData={editingPayment}
            categories={categories}
          />
        </Modal>

        <CategoryManagement
          isOpen={showCategoryManagement}
          onClose={() => setShowCategoryManagement(false)}
          onSave={handleCategorySave}
          categories={categories}
          payments={payments}
        />

        <UserManagement
          isOpen={showUserManagement}
          onClose={() => setShowUserManagement(false)}
          users={users}
          onSave={handleUserSave}
        />

        <ConfirmationDialog
          isOpen={showClearConfirmation}
          onClose={() => setShowClearConfirmation(false)}
          onConfirm={handleClearConfirm}
          title="Tüm Verileri Temizle"
          message="Tüm ödeme verilerini silmek istediğinizden emin misiniz? Bu işlem geri alınamaz."
        />

        <PasswordConfirmationDialog
          isOpen={showPasswordConfirmation}
          onClose={() => setShowPasswordConfirmation(false)}
          onConfirm={handlePasswordConfirm}
          error={passwordError}
        />
      </div>
    </div>
  );
}

interface PasswordConfirmationDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (e: React.FormEvent<HTMLFormElement>) => void;
  error?: string;
}

function PasswordConfirmationDialog({ isOpen, onClose, onConfirm, error }: PasswordConfirmationDialogProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-screen items-center justify-center px-4">
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" onClick={onClose}></div>
        <div className="relative z-50 w-full max-w-md transform bg-white rounded-lg shadow-xl">
          <div className="bg-red-50 p-6 rounded-t-lg border-b border-red-100">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <svg className="h-6 w-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-lg font-medium text-red-800">Şifre Doğrulama</h3>
              </div>
            </div>
          </div>
          
          <form onSubmit={onConfirm} className="p-6">
            <div className="space-y-4">
              <p className="text-sm text-gray-600">
                Tüm verileri silmek için lütfen şifrenizi girin.
              </p>
              
              {error && (
                <div className="bg-red-50 border border-red-400 text-red-700 px-4 py-3 rounded relative">
                  <span className="block sm:inline">{error}</span>
                </div>
              )}

              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                  Şifre
                </label>
                <input
                  type="password"
                  id="password"
                  name="password"
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-red-500 focus:ring-red-500"
                  required
                />
              </div>
            </div>
            
            <div className="mt-6 flex justify-end space-x-3">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
              >
                İptal
              </button>
              <button
                type="submit"
                className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700"
              >
                Onayla ve Sil
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

export default App;