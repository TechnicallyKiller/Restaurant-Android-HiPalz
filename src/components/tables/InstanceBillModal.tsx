import React, { useState, useEffect } from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { getBillById, getPaymentModes, printBill, clubSplits, getSplitsByBillId } from '../../api';
import { useAuthStore } from '../../store/authStore';
import { getErrorMessage } from '../../utils/errorHandling';
import { normalizeBillPreviewData, unwrapBillResponse } from '../../utils/billUtils';
import BillDiscountModal from '../bill/BillDiscountModal';
import BillServiceChargeModal from '../bill/BillServiceChargeModal';
import BillExtrasModal from '../bill/BillExtrasModal';
import AddTipModal from '../bill/AddTipModal';
import SplitBillModal from '../bill/SplitBillModal';
import SettleModal from '../bill/SettleModal';
import BillSummary from '../bill/BillSummary';
import BillItemGrid from '../bill/BillItemGrid';
import type { BillPreviewData } from '../../api/types';

interface InstanceBillModalProps {
  visible: boolean;
  onClose: () => void;
  billId: string;
  onSettled?: () => void;
}

export default function InstanceBillModal({
  visible,
  onClose,
  billId,
  onSettled,
}: InstanceBillModalProps) {
  const staffId = useAuthStore(s => s.user?.id ?? '');
  const outletId = useAuthStore(s => s.user?.outletId ?? '');

  const [bill, setBill] = useState<BillPreviewData | null>(null);
  const [loading, setLoading] = useState(false);
  const [modes, setModes] = useState<{ id: string; name: string }[]>([]);
  const [settleVisible, setSettleVisible] = useState(false);
  const [discountVisible, setDiscountVisible] = useState(false);
  const [serviceChargeVisible, setServiceChargeVisible] = useState(false);
  const [extrasVisible, setExtrasVisible] = useState(false);
  const [tipVisible, setTipVisible] = useState(false);
  const [splitVisible, setSplitVisible] = useState(false);
  const [merging, setMerging] = useState(false);
  const [printing, setPrinting] = useState(false);
  const [variants, setVariants] = useState<BillPreviewData[] | null>(null);
  const [selectedSplitBillId, setSelectedSplitBillId] = useState<string | null>(null);

  const refetchBill = async (): Promise<BillPreviewData[] | null> => {
    if (!billId) return null;
    setLoading(true);
    try {
      const data = await getBillById(billId);
      const rawBill = unwrapBillResponse(data);
      const normalized = normalizeBillPreviewData(rawBill);
      setBill(normalized);
      if (normalized?.isSplit === true && normalized?.id) {
        const splits = await getSplitsByBillId(normalized.id);
        const normalizedSplits = splits.map(normalizeBillPreviewData);
        setVariants(normalizedSplits);
        setSelectedSplitBillId(prev => {
          if (normalizedSplits.length === 0) return null;
          const ids = normalizedSplits.map(s => s.id).filter(Boolean) as string[];
          return ids.includes(prev ?? '') ? prev : (normalizedSplits[0]?.id ?? null);
        });
        return normalizedSplits;
      } else {
        setVariants(null);
        setSelectedSplitBillId(null);
        return null;
      }
    } catch (err) {
      Alert.alert('Error', getErrorMessage(err));
      setBill(null);
      setVariants(null);
      setSelectedSplitBillId(null);
      return null;
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!visible || !billId) {
      setBill(null);
      setVariants(null);
      setSelectedSplitBillId(null);
      return;
    }
    setBill(null);
    setVariants(null);
    setSelectedSplitBillId(null);
    refetchBill();
    getPaymentModes(outletId).then(setModes);
  }, [visible, billId]);

  useEffect(() => {
    if (variants?.length && selectedSplitBillId && !variants.some(v => v.id === selectedSplitBillId)) {
      setSelectedSplitBillId(variants[0]?.id ?? null);
    }
  }, [variants, selectedSplitBillId]);

  const displayBill: BillPreviewData | null =
    bill?.isSplit && variants?.length
      ? variants.find(v => v.id === selectedSplitBillId) ?? variants[0] ?? null
      : bill;

  /** After discount/service charge/tip/extras: refetch bill and variants so UI updates. */
  const handleModifierSuccess = async () => {
    await refetchBill();
  };

  const handlePrint = async () => {
    const id = displayBill?.id ?? bill?.id;
    if (!id) return;
    setPrinting(true);
    try {
      await printBill(id);
    } catch (err) {
      Alert.alert('Print failed', getErrorMessage(err));
    } finally {
      setPrinting(false);
    }
  };

  const handleMergeBill = async () => {
    if (!bill?.id) return;
    setMerging(true);
    try {
      await clubSplits({ parentBillId: bill.id, staffId });
      await refetchBill();
    } catch (err) {
      Alert.alert('Merge failed', getErrorMessage(err));
    } finally {
      setMerging(false);
    }
  };

  const handleSettled = async (allPaid?: boolean) => {
    setSettleVisible(false);
    onSettled?.();
    if (allPaid === true) {
      onClose();
      return;
    }
    if (!bill?.isSplit) {
      onClose();
      return;
    }
    const v = await refetchBill();
    if (v != null && v.length > 0 && v.every(x => x.status === 'PAID')) {
      onClose();
    }
  };

  if (!visible) return null;

  return (
    <>
      <Modal visible={visible} animationType="slide" transparent>
        <View style={styles.overlay}>
          <View style={styles.sheet}>
            <View style={styles.header}>
              <Text style={styles.title}>Settle instance — {bill?.tableName ?? 'Instance'}</Text>
              <TouchableOpacity onPress={onClose}><Text style={styles.closeText}>Close</Text></TouchableOpacity>
            </View>
            {loading && !bill ? (
              <ActivityIndicator color="#FFD700" style={styles.loader} />
            ) : !bill ? (
              <Text style={styles.empty}>Could not load bill.</Text>
            ) : (
              <View style={styles.sheetBody}>
                <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent}>
                  {bill?.isSplit && variants && variants.length > 0 && (
                    <View style={styles.variantRow}>
                      {variants.map((v, i) => (
                        <TouchableOpacity
                          key={v.id ?? i}
                          style={[
                            styles.variantBtn,
                            v.id === selectedSplitBillId && styles.variantBtnActive,
                            v.status === 'PAID' && styles.variantBtnPaid,
                          ]}
                          onPress={() => setSelectedSplitBillId(v.id ?? null)}
                        >
                          <Text style={styles.variantBtnText}>
                            Bill {i + 1} · ₹{v.payable?.toFixed(0) ?? '0'}
                          </Text>
                          {v.status === 'PAID' && <Text style={styles.variantPaidBadge}>Paid</Text>}
                        </TouchableOpacity>
                      ))}
                    </View>
                  )}
                  <BillItemGrid items={displayBill?.items ?? []} />
                </ScrollView>
                <View style={styles.billFooter}>
                  {displayBill && (
                    <BillSummary
                      data={displayBill}
                      billId={displayBill.id}
                      onRemoveDiscountClick={() => setDiscountVisible(true)}
                      onRemoveServiceChargeClick={() => setServiceChargeVisible(true)}
                      onRemoveTipClick={() => setTipVisible(true)}
                      onRemoveContainerChargeClick={() => setExtrasVisible(true)}
                      onRemoveDeliveryChargeClick={() => setExtrasVisible(true)}
                      onAddTipClick={() => setTipVisible(true)}
                      showAddTipButton={false}
                      onRefresh={() => void refetchBill()}
                    />
                  )}
                  {displayBill?.status !== 'PAID' && (
                    <>
                      <View style={styles.actionRow}>
                        <TouchableOpacity style={styles.smallBtn} onPress={() => setDiscountVisible(true)}>
                          <Text style={styles.smallBtnText}>Discount</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.smallBtn} onPress={() => setServiceChargeVisible(true)}>
                          <Text style={styles.smallBtnText}>Service charge</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.smallBtn} onPress={() => setExtrasVisible(true)}>
                          <Text style={styles.smallBtnText}>Extras</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.smallBtn} onPress={() => setTipVisible(true)}>
                          <Text style={styles.smallBtnText}>Add tip</Text>
                        </TouchableOpacity>
                        {!bill?.isSplit && (
                          <TouchableOpacity style={styles.smallBtn} onPress={() => setSplitVisible(true)}>
                            <Text style={styles.smallBtnText}>Split bill</Text>
                          </TouchableOpacity>
                        )}
                        {bill?.isSplit && (
                          <TouchableOpacity
                            style={[styles.smallBtn, merging && styles.btnDisabled]}
                            onPress={handleMergeBill}
                            disabled={merging}
                          >
                            <Text style={styles.smallBtnText}>{merging ? '…' : 'Merge bill'}</Text>
                          </TouchableOpacity>
                        )}
                        <TouchableOpacity
                          style={[styles.smallBtn, printing && styles.btnDisabled]}
                          onPress={handlePrint}
                          disabled={printing}
                        >
                          <Text style={styles.smallBtnText}>{printing ? '…' : 'Print'}</Text>
                        </TouchableOpacity>
                      </View>
                      <TouchableOpacity
                        style={styles.settleBtn}
                        onPress={() => setSettleVisible(true)}
                      >
                        <Text style={styles.settleBtnText}>Settle</Text>
                      </TouchableOpacity>
                    </>
                  )}
                </View>
              </View>
            )}
          </View>
        </View>
      </Modal>

      {displayBill?.id != null && (
        <SettleModal
          visible={settleVisible}
          onClose={() => setSettleVisible(false)}
          billId={displayBill.id}
          payableAmount={displayBill.payable ?? 0}
          staffId={staffId}
          modes={modes}
          isSplitVariant={bill?.isSplit === true}
          onSettled={handleSettled}
        />
      )}

      <BillDiscountModal
        visible={discountVisible}
        onClose={() => setDiscountVisible(false)}
        billId={displayBill?.id ?? billId}
        staffId={staffId}
        onSuccess={handleModifierSuccess}
      />
      <BillServiceChargeModal
        visible={serviceChargeVisible}
        onClose={() => setServiceChargeVisible(false)}
        billId={displayBill?.id ?? billId}
        staffId={staffId}
        onSuccess={handleModifierSuccess}
      />
      <BillExtrasModal
        visible={extrasVisible}
        onClose={() => setExtrasVisible(false)}
        billId={displayBill?.id ?? billId}
        staffId={staffId}
        onSuccess={handleModifierSuccess}
      />
      <AddTipModal
        visible={tipVisible}
        onClose={() => setTipVisible(false)}
        billId={displayBill?.id ?? billId}
        staffId={staffId}
        currentTipTotal={displayBill?.tipTotal ?? 0}
        onSuccess={handleModifierSuccess}
      />
      {bill && (
        <SplitBillModal
          visible={splitVisible}
          onClose={() => setSplitVisible(false)}
          bill={bill}
          staffId={staffId}
          onSuccess={handleModifierSuccess}
        />
      )}
    </>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  sheet: {
    flex: 1,
    maxHeight: '90%',
    backgroundColor: '#1E293B',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 24,
  },
  sheetBody: { flex: 1, minHeight: 200 },
  header: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 16 },
  title: { fontSize: 20, fontWeight: '800', color: '#F8FAFC' },
  closeText: { color: '#FFD700', fontWeight: '600' },
  loader: { padding: 40 },
  empty: { color: '#64748B', padding: 24, textAlign: 'center' },
  scroll: { flex: 1 },
  scrollContent: { paddingBottom: 16, flexGrow: 1 },
  billFooter: {
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#334155',
  },
  variantRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 16 },
  variantBtn: { backgroundColor: '#334155', paddingVertical: 10, paddingHorizontal: 14, borderRadius: 10 },
  variantBtnActive: { backgroundColor: '#FFD700' },
  variantBtnPaid: { opacity: 0.8 },
  variantBtnText: { color: '#F8FAFC', fontWeight: '600', fontSize: 14 },
  variantPaidBadge: { color: '#94A3B8', fontSize: 11, marginTop: 2 },
  row: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 8 },
  itemName: { color: '#F8FAFC', fontSize: 14 },
  itemPrice: { color: '#FFD700', fontWeight: '600' },
  divider: { height: 1, backgroundColor: '#334155', marginVertical: 12 },
  actionRow: { flexDirection: 'row', gap: 8, marginTop: 16, flexWrap: 'wrap' },
  smallBtn: { backgroundColor: '#334155', paddingVertical: 10, paddingHorizontal: 14, borderRadius: 10 },
  smallBtnText: { color: '#F8FAFC', fontWeight: '600', fontSize: 14 },
  settleBtn: { backgroundColor: '#FFD700', paddingVertical: 14, borderRadius: 12, alignItems: 'center', marginTop: 16 },
  settleBtnText: { color: '#0F172A', fontWeight: '700' },
  btnDisabled: { opacity: 0.6 },
});
