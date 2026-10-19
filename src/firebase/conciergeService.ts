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
import { INITIAL_VIP_CLIENTS, INITIAL_SOURCING_ORDERS } from '../data/mockClients';

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
    const snapshot = await getDocs(collection(db, 'users'));
    const matchedDocs: UserProfile[] = [];

    snapshot.forEach((d) => {
      const data = d.data();
      const docEmail = (data.email || '').trim().toLowerCase();
      if (docEmail === cleanEmail) {
        matchedDocs.push({
          ...data,
          userId: data.userId || d.id,
        } as UserProfile);
      }
    });

    if (matchedDocs.length > 0) {
      // Find if any document has a password set
      const docWithPass = matchedDocs.find((d) => Boolean(d.password));
      if (docWithPass && docWithPass.password && docWithPass.password !== cleanPass) {
        return { success: false, error: 'invalid_credentials' };
      }

      // Check if ANY document associated with this email has been approved
      const approvedDoc = matchedDocs.find((d) => d.status === 'approved');
      if (approvedDoc) {
        // If password was entered and missing in the approved doc, persist it for future logins
        if (!approvedDoc.password && cleanPass) {
          try {
            await setDoc(doc(db, 'users', approvedDoc.userId), { password: cleanPass }, { merge: true });
          } catch {
            // ignore
          }
        }
        return { success: true, profile: { ...approvedDoc, status: 'approved' } };
      }

      // Check if rejected
      const rejectedDoc = matchedDocs.find((d) => d.status === 'rejected');
      if (rejectedDoc) {
        return {
          success: false,
          profile: rejectedDoc,
          status: 'rejected',
          error: 'rejected',
        };
      }

      // Otherwise, the account is still pending approval
      return {
        success: false,
        profile: matchedDocs[0],
        status: 'pending_approval',
        error: 'pending_approval',
      };
    }
  } catch (err) {
    console.warn('Firestore shopper auth query error, checking local store:', err);
  }

  // 2. Fallback to registered shoppers in localStorage
  try {
    const stored = localStorage.getItem('arvec_registered_shoppers') || '[]';
    const list: UserProfile[] = JSON.parse(stored);
    const found = list.find((s) => (s.email || '').trim().toLowerCase() === cleanEmail);
    if (found) {
      if (found.password && found.password !== cleanPass) {
        return { success: false, error: 'invalid_credentials' };
      }
      if (found.status === 'approved') {
        return { success: true, profile: found };
      }
      if (found.status === 'rejected') {
        return {
          success: false,
          profile: found,
          status: 'rejected',
          error: 'rejected',
        };
      }
      return {
        success: false,
        profile: found,
        status: 'pending_approval',
        error: 'pending_approval',
      };
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
  adminId: string,
  shopperEmail?: string
): Promise<void> {
  const path = 'users';
  const now = new Date().toISOString();
  const cleanEmail = shopperEmail?.trim().toLowerCase();

  // 1. Update local cache immediately
  try {
    const stored = localStorage.getItem('arvec_registered_shoppers') || '[]';
    const list: UserProfile[] = JSON.parse(stored);
    const updated = list.map((s) => {
      const match = s.userId === shopperId || (cleanEmail && (s.email || '').trim().toLowerCase() === cleanEmail);
      return match ? { ...s, status, approvedAt: now, approvedBy: adminId } : s;
    });
    localStorage.setItem('arvec_registered_shoppers', JSON.stringify(updated));

    // Also update active session if this is the active shopper
    const activeStored = localStorage.getItem('arvec_active_shopper');
    if (activeStored) {
      const activeShopper = JSON.parse(activeStored);
      if (activeShopper.userId === shopperId || (cleanEmail && (activeShopper.email || '').trim().toLowerCase() === cleanEmail)) {
        localStorage.setItem(
          'arvec_active_shopper',
          JSON.stringify({ ...activeShopper, status, approvedAt: now, approvedBy: adminId })
        );
      }
    }
  } catch (err) {
    console.warn('Local approval update error:', err);
  }

  // 2. Persist to Firestore with setDoc merge by shopperId
  try {
    if (shopperId && shopperId !== 'undefined') {
      const userRef = doc(db, path, shopperId);
      await setDoc(
        userRef,
        {
          userId: shopperId,
          status,
          approvedAt: now,
          approvedBy: adminId,
        },
        { merge: true }
      );
    }
  } catch (err) {
    console.warn('Update shopper approval remote error by ID:', err);
  }

  // 3. Scan and update all documents in Firestore matching this email
  try {
    const snap = await getDocs(collection(db, path));
    for (const d of snap.docs) {
      const data = d.data();
      const docEmail = (data.email || '').trim().toLowerCase();
      const isMatch = (cleanEmail && docEmail === cleanEmail) || data.userId === shopperId || d.id === shopperId;
      if (isMatch) {
        await setDoc(
          doc(db, path, d.id),
          {
            status,
            approvedAt: now,
            approvedBy: adminId,
          },
          { merge: true }
        );
      }
    }
  } catch (err) {
    console.warn('Update shopper approval remote scan error:', err);
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
          .map((d) => {
            const data = d.data();
            return {
              ...data,
              userId: data.userId || d.id,
            } as UserProfile;
          })
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
 * Subscribe to sourcing orders in real-time with local fallback
 */
export function subscribeToOrders(callback: (orders: SourcingOrder[]) => void) {
  const path = 'sourcingOrders';
  const getLocal = (): SourcingOrder[] => {
    try {
      const stored = localStorage.getItem('arvec_sourcing_orders');
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  };

  try {
    const colRef = collection(db, path);
    return onSnapshot(
      colRef,
      (snapshot) => {
        const remoteOrders = snapshot.docs.map((d) => {
          const data = d.data();
          return {
            ...data,
            id: data.id || d.id,
          } as SourcingOrder;
        });

        const local = getLocal();
        const map = new Map<string, SourcingOrder>();
        local.forEach((o) => map.set(o.id, o));
        remoteOrders.forEach((o) => map.set(o.id, o));

        const merged = Array.from(map.values()).sort(
          (a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime()
        );

        const effectiveList = merged.length > 0 ? merged : INITIAL_SOURCING_ORDERS;
        try {
          localStorage.setItem('arvec_sourcing_orders', JSON.stringify(effectiveList));
        } catch {
          // ignore
        }

        callback(effectiveList);
      },
      (error) => {
        console.warn('Orders subscription notice, using local store:', error);
        const fallback = getLocal();
        callback(fallback.length > 0 ? fallback : INITIAL_SOURCING_ORDERS);
      }
    );
  } catch (err) {
    console.warn('Orders subscription error:', err);
    const fallback = getLocal();
    callback(fallback.length > 0 ? fallback : INITIAL_SOURCING_ORDERS);
    return () => {};
  }
}

/**
 * Save new sourcing order to Firestore with local cache
 */
export async function saveSourcingOrder(order: SourcingOrder): Promise<void> {
  const path = 'sourcingOrders';
  const orderWithTimestamp = {
    ...order,
    createdAt: order.createdAt || new Date().toISOString(),
  };

  // 1. Save to local storage immediately
  try {
    const stored = localStorage.getItem('arvec_sourcing_orders') || '[]';
    const list: SourcingOrder[] = JSON.parse(stored);
    const filtered = list.filter((o) => o.id !== orderWithTimestamp.id);
    filtered.unshift(orderWithTimestamp);
    localStorage.setItem('arvec_sourcing_orders', JSON.stringify(filtered));
  } catch (err) {
    console.warn('Local order cache write error:', err);
  }

  // 2. Save to Firestore
  try {
    await setDoc(doc(db, path, orderWithTimestamp.id), orderWithTimestamp, { merge: true });
  } catch (err) {
    console.warn('Firestore saveSourcingOrder error (cached locally):', err);
  }
}

/**
 * Update pipeline stage of an order
 */
export async function updateOrderStageInDb(orderId: string, newStage: PipelineStage): Promise<void> {
  const path = 'sourcingOrders';

  // Update local store immediately
  try {
    const stored = localStorage.getItem('arvec_sourcing_orders') || '[]';
    const list: SourcingOrder[] = JSON.parse(stored);
    const updated = list.map((o) =>
      o.id === orderId
        ? {
            ...o,
            stage: newStage,
            balanceDue: newStage === 'Delivered & Settled' ? 0 : o.balanceDue,
          }
        : o
    );
    localStorage.setItem('arvec_sourcing_orders', JSON.stringify(updated));
  } catch (err) {
    console.warn('Local stage update cache error:', err);
  }

  try {
    await updateDoc(doc(db, path, orderId), {
      stage: newStage,
      balanceDue: newStage === 'Delivered & Settled' ? 0 : undefined,
    });
  } catch (err) {
    console.warn('Remote updateOrderStageInDb error:', err);
  }
}

/**
 * Delete sourcing order from Firestore and local cache
 */
export async function deleteOrderFromDb(orderId: string): Promise<void> {
  const path = 'sourcingOrders';

  // Remove from local cache
  try {
    const stored = localStorage.getItem('arvec_sourcing_orders') || '[]';
    const list: SourcingOrder[] = JSON.parse(stored);
    const filtered = list.filter((o) => o.id !== orderId);
    localStorage.setItem('arvec_sourcing_orders', JSON.stringify(filtered));
  } catch (err) {
    console.warn('Local order deletion error:', err);
  }

  try {
    await deleteDoc(doc(db, path, orderId));
  } catch (err) {
    console.warn('Remote deleteOrderFromDb error:', err);
  }
}

/**
 * Subscribe to VIP clients in real-time with local fallback
 */
export function subscribeToClients(callback: (clients: VipClient[]) => void) {
  const path = 'vipClients';
  const getLocal = (): VipClient[] => {
    try {
      const stored = localStorage.getItem('arvec_vip_clients');
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  };

  try {
    const colRef = collection(db, path);
    return onSnapshot(
      colRef,
      (snapshot) => {
        const remoteClients = snapshot.docs.map((d) => {
          const data = d.data();
          return {
            ...data,
            id: data.id || d.id,
          } as VipClient;
        });

        const local = getLocal();
        const map = new Map<string, VipClient>();
        local.forEach((c) => map.set(c.id, c));
        remoteClients.forEach((c) => map.set(c.id, c));

        const merged = Array.from(map.values()).sort(
          (a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime()
        );

        const effectiveList = merged.length > 0 ? merged : INITIAL_VIP_CLIENTS;
        try {
          localStorage.setItem('arvec_vip_clients', JSON.stringify(effectiveList));
        } catch {
          // ignore
        }

        callback(effectiveList);
      },
      (error) => {
        console.warn('Clients subscription notice, using local store:', error);
        const fallback = getLocal();
        callback(fallback.length > 0 ? fallback : INITIAL_VIP_CLIENTS);
      }
    );
  } catch (err) {
    console.warn('Clients subscription init error:', err);
    const fallback = getLocal();
    callback(fallback.length > 0 ? fallback : INITIAL_VIP_CLIENTS);
    return () => {};
  }
}

/**
 * Save new VIP client to Firestore and local cache
 */
export async function saveVipClient(client: VipClient): Promise<void> {
  const path = 'vipClients';
  const clientWithTimestamp: VipClient = {
    ...client,
    createdAt: client.createdAt || new Date().toISOString(),
  };

  // 1. Save to local storage immediately
  try {
    const stored = localStorage.getItem('arvec_vip_clients') || '[]';
    const list: VipClient[] = JSON.parse(stored);
    const filtered = list.filter((c) => c.id !== clientWithTimestamp.id);
    filtered.unshift(clientWithTimestamp);
    localStorage.setItem('arvec_vip_clients', JSON.stringify(filtered));
  } catch (err) {
    console.warn('Local client cache write error:', err);
  }

  // 2. Save to Firestore
  try {
    await setDoc(doc(db, path, clientWithTimestamp.id), clientWithTimestamp, { merge: true });
  } catch (err) {
    console.warn('Firestore saveVipClient error (saved locally):', err);
  }
}
