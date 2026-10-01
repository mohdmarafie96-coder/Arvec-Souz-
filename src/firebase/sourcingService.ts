import { collection, doc, setDoc, getDocs, query, orderBy, limit, where } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from './config';
import { SourcingReport } from '../types/sourcing';

export async function saveSourcingReportToFirestore(
  userId: string,
  userDisplayName: string,
  report: SourcingReport
): Promise<string> {
  const path = 'sourcingReports';
  const reportId = `report_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  try {
    const docRef = doc(db, path, reportId);
    await setDoc(docRef, {
      id: reportId,
      userId,
      userDisplayName,
      query: report.query,
      market_summary: report.market_summary,
      sourcesCount: report.sources.length,
      lowestLandedCost: report.sources[0]?.pricing?.total_landed_cost || 0,
      currency: report.query.currency,
      topSource: report.sources[0]?.store_name || '',
      sources: report.sources,
      createdAt: new Date().toISOString(),
    });
    return reportId;
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
    return reportId;
  }
}

export async function fetchUserSourcingHistory(userId: string): Promise<SourcingReport[]> {
  const path = 'sourcingReports';
  try {
    const q = query(
      collection(db, path),
      where('userId', '==', userId),
      orderBy('createdAt', 'desc'),
      limit(10)
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map((d) => d.data() as SourcingReport);
  } catch (error) {
    // Graceful fallback if index is not ready or collection empty
    return [];
  }
}
