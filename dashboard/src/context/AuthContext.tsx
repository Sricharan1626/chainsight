'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import {
  onAuthStateChanged,
  User,
  GoogleAuthProvider,
  signInWithPopup,
  signOut as firebaseSignOut,
} from 'firebase/auth';
import { auth } from '@/lib/firebase';
import {
  getAppUserByUid,
  createAppUser,
  updateAppUser,
  getCompaniesByOwnerEmail,
  getRoleByEmail,
  type AppUser,
  type CompanyRole,
} from '@/lib/firestore';

interface AuthContextType {
  user: User | null;
  appUser: AppUser | null;
  companyRole: CompanyRole | null;
  loading: boolean;
  noAccess: boolean;
  loginWithGoogle: () => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  appUser: null,
  companyRole: null,
  loading: true,
  noAccess: false,
  loginWithGoogle: async () => {},
  logout: async () => {},
});

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [appUser, setAppUser] = useState<AppUser | null>(null);
  const [companyRole, setCompanyRole] = useState<CompanyRole | null>(null);
  const [loading, setLoading] = useState(true);
  const [noAccess, setNoAccess] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      setNoAccess(false);
      setCompanyRole(null);

      if (currentUser) {
        const email = currentUser.email || '';

        // 1. Check if user already exists in Firestore
        let dbUser = await getAppUserByUid(currentUser.uid);

        if (dbUser) {
          // Existing user — load their role info if they have one
          if (dbUser.role && dbUser.role !== 'Owner') {
            const role = await getRoleByEmail(email);
            setCompanyRole(role);
          }
          setAppUser(dbUser);
          setLoading(false);
          return;
        }

        // 2. No user doc — check if they are a company owner
        const ownedCompany = await getCompaniesByOwnerEmail(email);
        if (ownedCompany) {
          // Create user as Owner of this company
          await createAppUser({
            email,
            displayName: currentUser.displayName || '',
            photoURL: currentUser.photoURL || '',
            role: 'Owner',
            companyId: ownedCompany.id!,
            firebaseUid: currentUser.uid,
          });
          dbUser = await getAppUserByUid(currentUser.uid);
          setAppUser(dbUser);
          setLoading(false);
          return;
        }

        // 3. Check if they have an assigned role via company_roles
        const assignedRole = await getRoleByEmail(email);
        if (assignedRole) {
          await createAppUser({
            email,
            displayName: currentUser.displayName || '',
            photoURL: currentUser.photoURL || '',
            role: assignedRole.roleName,
            companyId: assignedRole.companyId,
            firebaseUid: currentUser.uid,
          });
          dbUser = await getAppUserByUid(currentUser.uid);
          setAppUser(dbUser);
          setCompanyRole(assignedRole);
          setLoading(false);
          return;
        }

        // 4. No access — unregistered user
        setAppUser(null);
        setNoAccess(true);
      } else {
        setAppUser(null);
        setCompanyRole(null);
      }

      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const loginWithGoogle = async () => {
    const provider = new GoogleAuthProvider();
    try {
      await signInWithPopup(auth, provider);
    } catch (error) {
      console.error('Error logging in with Google', error);
      throw error;
    }
  };

  const logout = async () => {
    try {
      await firebaseSignOut(auth);
      setAppUser(null);
      setCompanyRole(null);
      setNoAccess(false);
    } catch (error) {
      console.error('Error logging out', error);
      throw error;
    }
  };

  return (
    <AuthContext.Provider value={{ user, appUser, companyRole, loading, noAccess, loginWithGoogle, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
