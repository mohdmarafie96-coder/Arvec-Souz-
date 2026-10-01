import {
  doc,
  setDoc,
  getDoc,
  updateDoc,
  collection,
  query,
  where,
  orderBy,
  onSnapshot,
  deleteDoc,
  getDocs,
} from 'firebase/firestore';
import { db, auth, handleFirestoreError, OperationType } from './config';
import { UserProfile, SourcingOrder, VipClient, ShopperStatus, PipelineStage } from '../types/concierge';

const ADMIN_EMAIL = 'mohdmarafie96@gmail.com';

/**
 * Initializes or updates user profile in Firestore
 */
export async function syncUserProfile(user: {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
}): Promise<UserProfile> {
  const path = 'users';
  const userRef = doc(db, path, user.uid);
  try {
    const snap = await getDoc(userRef);
    const isAdmin = user.email?.toLowerCase() === ADMIN_EMAIL.toLowerCase();

    if (snap.exists()) {
      const data = snap.data() as UserProfile;
      // Upgrade to admin if email matches
      if (isAdmin && data.role !== 'admin') {
        await updateDoc(userRef, { role: 'admin', status: 'approved' });
        return { ...data, role: 'admin', status: 'approved' };
      }
      return data;
    } else {
      const newProfile: UserProfile = {
        userId: user.uid,
        email: user.email || '',
        displayName: user.displayName || 'Personal Shopper',
        photoURL: user.photoURL || '',
        role: isAdmin ? 'admin' : 'shopper',
        status: isAdmin ? 'approved' : 'pending_approval',
        hubCity: 'London / Paris',
        phone: '',
        specialization: 'Luxury Leather & Horology',
        createdAt: new Date().toISOString(),
      };
      await setDoc(userRef, newProfile);
      return newProfile;
    }
  } catch (err) {
    console.warn('Sync user profile error:', err);
    return {
      userId: user.uid,
      email: user.email || '',
      displayName: user.displayName || 'Personal Shopper',
      role: user.email?.toLowerCase() === ADMIN_EMAIL.toLowerCase() ? 'admin' : 'shopper',
      status: user.email?.toLowerCase() === ADMIN_EMAIL.toLowerCase() ? 'approved' : 'pending_approval',
      createdAt: new Date().toISOString(),
    };
  }
}

/**
 * Register a new personal shopper application
 */
export async function registerShopperApplication(profile: UserProfile): Promise<void> {
  const path = 'users';
  try {
    const userRef = doc(db, path, profile.userId);
    await setDoc(userRef, profile, { merge: true });
    // Also cache locally
    try {
      const stored = localStorage.getItem('arvec_registered_shoppers') || '[]';
      const list: UserProfile[] = JSON.parse(stored);
      const filtered = list.filter((s) => s.userId !== profile.userId);
      filtered.unshift(profile);
      localStorage.setItem('arvec_registered_shoppers', JSON.stringify(filtered));
    } catch {
      // ignore
    }
  } catch (err) {
    console.warn('Register shopper application error:', err);
    // Local fallback
    try {
      const stored = localStorage.getItem('arvec_registered_shoppers') || '[]';
      const list: UserProfile[] = JSON.parse(stored);
      const filtered = list.filter((s) => s.userId !== profile.userId);
      filtered.unshift(profile);
      localStorage.setItem('arvec_registered_shoppers', JSON.stringify(filtered));
    } catch {
      // ignore
    }
  }
}

/**
 * Authenticate personal shopper with email and password
 * Enforces admin approval: Only approved shoppers can successfully sign in
 */
export async function authenticateShopper(
  email: string,
  pass: string
): Promise<{ success: boolean; profile?: UserProfile; error?: string; status?: ShopperStatus }> {
  const cleanEmail = email.trim().toLowerCase();
  const cleanPass = pass.trim();

  // 1. Check in Firestore collection 'users'
  try {
    const q = query(collection(db, 'users'), where('email', '==', cleanEmail));
    const snapshot = await getDocs(q);
    if (!snapshot.empty) {
      const docData = snapshot.docs[0].data() as UserProfile;
      // If user had a password configured, verify it
      if (docData.password && docData.password !== cleanPass) {
        return { success: false, error: 'invalid_credentials' };
      }
      // Check admin approval
      if (docData.status !== 'approved') {
        return {
          success: false,
          profile: docData,
          status: docData.status,
          error: docData.status === 'rejected' ? 'rejected' : 'pending_approval',
        };
      }
      return { success: true, profile: docData };
    }
  } catch (err) {
    console.warn('Firestore shopper auth query error, checking local store:', err);
  }

  // 2. Fallback to registered shoppers in localStorage
  try {
    const stored = localStorage.getItem('arvec_registered_shoppers') || '[]';
    const list: UserProfile[] = JSON.parse(stored);
    const found = list.find((s) => s.email.toLowerCase() === cleanEmail);
    if (found) {
      if (found.password && found.password !== cleanPass) {
        return { success: false, error: 'invalid_credentials' };
      }
      if (found.status !== 'approved') {
        return {
          success: false,
          profile: found,
          status: found.status,
          error: found.status === 'rejected' ? 'rejected' : 'pending_approval',
        };
      }
      return { success: true, profile: found };
    }
  } catch (err) {
    console.warn('Local shopper auth search error:', err);
  }

  return { success: false, error: 'not_found' };
}

/**
 * Admin action: Approve or reject personal shopper
 */
export async function setShopperApproval(
  shopperId: string,
  status: ShopperStatus,
  adminId: string
): Promise<void> {
  const path = 'users';
  const now = new Date().toISOString();

  // 1. Update local cache immediately
  try {
    const stored = localStorage.getItem('arvec_registered_shoppers') || '[]';
    const list: UserProfile[] = JSON.parse(stored);
    const updated = list.map((s) =>
      s.userId === shopperId
        ? { ...s, status, approvedAt: now, approvedBy: adminId }
        : s
    );
    localStorage.setItem('arvec_registered_shoppers', JSON.stringify(updated));

    // Also update active session if this is the active shopper
    const activeStored = localStorage.getItem('arvec_active_shopper');
    if (activeStored) {
      const activeShopper = JSON.parse(activeStored);
      if (activeShopper.userId === shopperId) {
        localStorage.setItem(
          'arvec_active_shopper',
          JSON.stringify({ ...activeShopper, status, approvedAt: now, approvedBy: adminId })
        );
      }
    }
  } catch (err) {
    console.warn('Local approval update error:', err);
  }

  // 2. Persist to Firestore with setDoc merge
  try {
    const userRef = doc(db, path, shopperId);
    await setDoc(
      userRef,
      {
        status,
        approvedAt: now,
        approvedBy: adminId,
      },
      { merge: true }
    );
  } catch (err) {
    console.warn('Update shopper approval remote error:', err);
  }
}

/**
 * Real-time subscription to personal shoppers for Admin approval panel
 */
export function subscribeToShoppers(callback: (shoppers: UserProfile[]) => void) {
  const path = 'users';
  const getLocal = (): UserProfile[] => {
    try {
      const stored = localStorage.getItem('arvec_registered_shoppers');
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  };

  try {
    const usersCol = collection(db, path);
    return onSnapshot(
      usersCol,
      (snapshot) => {
        const firestoreShoppers = snapshot.docs
          .map((d) => d.data() as UserProfile)
          .filter((u) => u.role === 'shopper');

        const local = getLocal();
        const localMap = new Map<string, UserProfile>();
        local.forEach((s) => localMap.set(s.userId, s));

        // Merge: If a shopper was marked approved in local or Firestore, keep approved
        const map = new Map<string, UserProfile>();
        firestoreShoppers.forEach((fs) => {
          const loc = localMap.get(fs.userId);
          if (loc && loc.status === 'approved') {
            map.set(fs.userId, {
              ...fs,
              status: 'approved',
              approvedAt: loc.approvedAt || fs.approvedAt,
              approvedBy: loc.approvedBy || fs.approvedBy,
            });
          } else {
            map.set(fs.userId, fs);
          }
        });

        // Include any registered shoppers from local storage not yet in remote
        local.forEach((s) => {
          if (!map.has(s.userId)) {
            map.set(s.userId, s);
          }
        });

        const all = Array.from(map.values()).sort(
          (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
        callback(all);
      },
      (error) => {
        console.warn('Shoppers subscription notice:', error);
        callback(getLocal());
      }
    );
  } catch (err) {
    callback(getLocal());
    return () => {};
  }
}

/**
 * Fetch all personal shoppers for Admin approval panel
 */
export async function fetchAllShoppers(): Promise<UserProfile[]> {
  const path = 'users';
  try {
    const snapshot = await getDocs(collection(db, path));
    return snapshot.docs
      .map((d) => d.data() as UserProfile)
      .filter((u) => u.role === 'shopper');
  } catch (err) {
    console.warn('Fetch shoppers error:', err);
    try {
      const stored = localStorage.getItem('arvec_registered_shoppers');
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  }
}

/**
 * Subscribe to sourcing orders in real-time
 */
export function subscribeToOrders(callback: (orders: SourcingOrder[]) => void) {
  const path = 'sourcingOrders';
  const q = query(collection(db, path), orderBy('createdAt', 'desc'));
  return onSnapshot(
    q,
    (snapshot) => {
      const orders = snapshot.docs.map((d) => d.data() as SourcingOrder);
      callback(orders);
    },
    (error) => {
      console.warn('Orders subscription error:', error);
      callback([]);
    }
  );
}

/**
 * Save new sourcing order to Firestore
 */
export async function saveSourcingOrder(order: SourcingOrder): Promise<void> {
  const path = 'sourcingOrders';
  try {
    await setDoc(doc(db, path, order.id), order);
  } catch (err) {
    handleFirestoreError(err, OperationType.CREATE, `${path}/${order.id}`);
  }
}

/**
 * Update pipeline stage of an order
 */
export async function updateOrderStageInDb(orderId: string, newStage: PipelineStage): Promise<void> {
  const path = 'sourcingOrders';
  try {
    await updateDoc(doc(db, path, orderId), {
      stage: newStage,
      balanceDue: newStage === 'Delivered & Settled' ? 0 : undefined,
    });
  } catch (err) {
    handleFirestoreError(err, OperationType.UPDATE, `${path}/${orderId}`);
  }
}

/**
 * Delete sourcing order from Firestore
 */
export async function deleteOrderFromDb(orderId: string): Promise<void> {
  const path = 'sourcingOrders';
  try {
    await deleteDoc(doc(db, path, orderId));
  } catch (err) {
    handleFirestoreError(err, OperationType.DELETE, `${path}/${orderId}`);
  }
}

/**
 * Subscribe to VIP clients in real-time
 */
export function subscribeToClients(callback: (clients: VipClient[]) => void) {
  const path = 'vipClients';
  const q = query(collection(db, path), orderBy('createdAt', 'desc'));
  return onSnapshot(
    q,
    (snapshot) => {
      const clients = snapshot.docs.map((d) => d.data() as VipClient);
      callback(clients);
    },
    (error) => {
      console.warn('Clients subscription error:', error);
      callback([]);
    }
  );
}

/**
 * Save new VIP client to Firestore
 */
export async function saveVipClient(client: VipClient): Promise<void> {
  const path = 'vipClients';
  try {
    await setDoc(doc(db, path, client.id), client);
  } catch (err) {
    handleFirestoreError(err, OperationType.CREATE, `${path}/${client.id}`);
  }
}
