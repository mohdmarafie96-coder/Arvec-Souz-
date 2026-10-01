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
 * Admin action: Approve or reject personal shopper
 */
export async function setShopperApproval(
  shopperId: string,
  status: ShopperStatus,
  adminId: string
): Promise<void> {
  const path = 'users';
  try {
    const userRef = doc(db, path, shopperId);
    await updateDoc(userRef, {
      status,
      approvedAt: new Date().toISOString(),
      approvedBy: adminId,
    });
  } catch (err) {
    handleFirestoreError(err, OperationType.UPDATE, `${path}/${shopperId}`);
  }
}

/**
 * Fetch all personal shoppers for Admin approval panel
 */
export async function fetchAllShoppers(): Promise<UserProfile[]> {
  const path = 'users';
  try {
    const q = query(collection(db, path), orderBy('createdAt', 'desc'));
    const snapshot = await getDocs(q);
    return snapshot.docs.map((d) => d.data() as UserProfile);
  } catch (err) {
    console.warn('Fetch shoppers error:', err);
    return [];
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
