import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useTableStore } from '../store/tableStore';
import { useBillStore } from '../store/billStore';
import { useAuthStore } from '../store/authStore';
import {
  useAreasAndTables,
  useBillPreview,
  useBillGenerate,
  useBillByTable,
  usePaymentModes,
} from '../hooks';
import { createTableInstance, printBill, clubSplits, getSplitsByBillId } from '../api';
import { getErrorMessage } from '../utils/errorHandling';
import { normalizeBillPreviewData } from '../utils/billUtils';
import type { BillPreviewData } from '../api/types';
import BillDiscountModal from '../components/bill/BillDiscountModal';
import BillServiceChargeModal from '../components/bill/BillServiceChargeModal';
import BillExtrasModal from '../components/bill/BillExtrasModal';
import AddTipModal from '../components/bill/AddTipModal';
import SplitBillModal from '../components/bill/SplitBillModal';
import SettleModal from '../components/bill/SettleModal';
import BillSummary from '../components/bill/BillSummary';
import BillItemGrid from '../components/bill/BillItemGrid';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/types';

type Props = NativeStackScreenProps<RootStackParamList, 'Bill'>;

const BillScreen = ({ navigation }: Props) => {
  const currentTable = useTableStore(s => s.currentTable);
  const bill = useBillStore(s =>
    currentTable ? s.getBillForTable(currentTable.id) : null,
  );
  const setBillForTable = useBillStore(s => s.setBillForTable);
  const hasBill = Boolean(bill?.id);

  const { refetch: refetchTables } = useAreasAndTables();
  const { fetchPreview, isLoading: previewLoading } = useBillPreview();
  const { generate, isGenerating } = useBillGenerate();
  const { refresh, isRefreshing } = useBillByTable(currentTable?.id);
  const { modes, refetch: refetchModes } = usePaymentModes();

  const staffId = useAuthStore(s => s.user?.id ?? '');
  const [settleVisible, setSettleVisible] = useState(false);
  const [discountVisible, setDiscountVisible] = useState(false);
  const [serviceChargeVisible, setServiceChargeVisible] = useState(false);
  const [extrasVisible, setExtrasVisible] = useState(false);
  const [tipVisible, setTipVisible] = useState(false);
  const [splitVisible, setSplitVisible] = useState(false);
  const [creatingInstance, setCreatingInstance] = useState(false);
  const [merging, setMerging] = useState(false);
  const [printing, setPrinting] = useState(false);
  const [variants, setVariants] = useState<BillPreviewData[] | null>(null);
  const [selectedSplitBillId, setSelectedSplitBillId] = useState<string | null>(null);

  useEffect(() => {
    if (currentTable && !bill) fetchPreview();
  }, [currentTable?.id]);

  useEffect(() => {
    refetchModes();
  }, [refetchModes]);

  useEffect(() => {
    if (bill?.isSplit && bill?.id) {
      getSplitsByBillId(bill.id).then(v => setVariants(v.map(normalizeBillPreviewData)));
    } else {
      setVariants(null);
      setSelectedSplitBillId(null);
    }
  }, [bill?.id, bill?.isSplit]);

  useEffect(() => {
    if (variants?.length && selectedSplitBillId === null) {
      const firstUnpaid = variants.find(v => v.status !== 'PAID');
      setSelectedSplitBillId(firstUnpaid?.id ?? variants[0]?.id ?? null);
    }
    if (variants?.length && selectedSplitBillId && !variants.some(v => v.id === selectedSplitBillId)) {
      setSelectedSplitBillId(variants[0]?.id ?? null);
    }
  }, [variants, selectedSplitBillId]);

  const handleGenerate = async () => {
    const data = await generate();
    if (data) setSettleVisible(false);
  };

  const refetchBill = async () => {
    if (currentTable?.id) await refresh();
  };

  /** After discount/service charge/tip/extras: refetch bill and, if split, refetch variants so UI updates. */
  const refetchBillAndVariants = async () => {
    await refetchBill();
    if (bill?.isSplit && bill?.id) {
      const v = (await getSplitsByBillId(bill.id)).map(normalizeBillPreviewData);
      setVariants(v);
    }
  };

  const handleCreateInstance = () => {
    if (!bill?.id) return;
    Alert.alert(
      'Create table instance',
      'You are partially settling the table. The table will be freed for a new order. Only billing actions will be allowed for this bill.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Create instance',
          onPress: async () => {
            setCreatingInstance(true);
            try {
              await createTableInstance({ billId: bill.id, staffId });
              setBillForTable(currentTable!.id, null);
              refetchTables();
              navigation.navigate('Tables');
            } catch (err) {
              Alert.alert('Failed', getErrorMessage(err));
            } finally {
              setCreatingInstance(false);
            }
          },
        },
      ],
    );
  };

  const handlePrint = async () => {
    if (!bill?.id) return;
    setPrinting(true);
    try {
      await printBill(bill.id);
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
    if (allPaid === true) {
      setBillForTable(currentTable!.id, null);
      refetchTables();
      navigation.navigate('Tables');
      return;
    }
    if (!bill?.isSplit) {
      setBillForTable(currentTable!.id, null);
      refetchTables();
      navigation.navigate('Tables');
      return;
    }
    await refetchBill();
    if (bill?.id) {
      const v = (await getSplitsByBillId(bill.id)).map(normalizeBillPreviewData);
      setVariants(v);
      if (v.length > 0 && v.every(x => x.status === 'PAID')) {
        setBillForTable(currentTable!.id, null);
        refetchTables();
        navigation.navigate('Tables');
      }
    }
    refetchTables();
  };

  if (!currentTable) {
    return (
      <View style={styles.centered}>
        <Text style={styles.noTable}>No table selected</Text>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Text style={styles.backBtnText}>Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const loading = previewLoading || isRefreshing;
  const displayBill: BillPreviewData | null | undefined =
    bill?.isSplit && variants?.length
      ? variants.find(v => v.id === selectedSplitBillId) ?? variants[0] ?? null
      : bill;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Text style={styles.backText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Bill — {currentTable.name}</Text>
      </View>

      {loading && !displayBill ? (
        <View style={styles.loading}>
          <ActivityIndicator size="large" color="#FFD700" />
        </View>
      ) : !displayBill ? (
        <View style={styles.empty}>
          <Text style={styles.emptyText}>No bill data. Try generating bill from POS.</Text>
        </View>
      ) : (
        <View style={styles.contentWrap}>
          <ScrollView
            style={styles.content}
            contentContainerStyle={[styles.contentInner, styles.contentInnerScroll]}
            showsVerticalScrollIndicator={true}
          >
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
                billId={displayBill.id ?? bill?.id}
                onRemoveDiscountClick={() => setDiscountVisible(true)}
                onRemoveServiceChargeClick={() => setServiceChargeVisible(true)}
                onRemoveTipClick={() => setTipVisible(true)}
                onRemoveContainerChargeClick={() => setExtrasVisible(true)}
                onRemoveDeliveryChargeClick={() => setExtrasVisible(true)}
                onAddTipClick={() => setTipVisible(true)}
                showAddTipButton={false}
                onRefresh={refetchBill}
              />
            )}
            {hasBill && (
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
            )}
            {!hasBill ? (
              <TouchableOpacity
                style={[styles.primaryBtn, isGenerating && styles.btnDisabled]}
                onPress={handleGenerate}
                disabled={isGenerating}
              >
                {isGenerating ? (
                  <ActivityIndicator color="#0F172A" size="small" />
                ) : (
                  <Text style={styles.primaryBtnText}>Generate bill</Text>
                )}
              </TouchableOpacity>
            ) : (
              <>
                {displayBill?.status !== 'PAID' && (
                  <TouchableOpacity
                    style={[styles.primaryBtn, styles.payBtn]}
                    onPress={() => setSettleVisible(true)}
                  >
                    <Text style={styles.primaryBtnText}>Settle</Text>
                  </TouchableOpacity>
                )}
                <TouchableOpacity
                  style={[styles.instanceBtn, creatingInstance && styles.btnDisabled]}
                  onPress={handleCreateInstance}
                  disabled={creatingInstance}
                >
                  {creatingInstance ? (
                    <ActivityIndicator color="#0F172A" size="small" />
                  ) : (
                    <Text style={styles.instanceBtnText}>Create table instance</Text>
                  )}
                </TouchableOpacity>
              </>
            )}
          </View>
        </View>
      )}

      <BillDiscountModal
        visible={discountVisible}
        onClose={() => setDiscountVisible(false)}
        billId={displayBill?.id ?? bill?.id ?? ''}
        staffId={staffId}
        onSuccess={refetchBillAndVariants}
      />
      <BillServiceChargeModal
        visible={serviceChargeVisible}
        onClose={() => setServiceChargeVisible(false)}
        billId={displayBill?.id ?? bill?.id ?? ''}
        staffId={staffId}
        onSuccess={refetchBillAndVariants}
      />
      <BillExtrasModal
        visible={extrasVisible}
        onClose={() => setExtrasVisible(false)}
        billId={displayBill?.id ?? bill?.id ?? ''}
        staffId={staffId}
        onSuccess={refetchBillAndVariants}
      />
      <AddTipModal
        visible={tipVisible}
        onClose={() => setTipVisible(false)}
        billId={displayBill?.id ?? bill?.id ?? ''}
        staffId={staffId}
        currentTipTotal={displayBill?.tipTotal ?? 0}
        onSuccess={refetchBillAndVariants}
      />
      {displayBill && (
        <SplitBillModal
          visible={splitVisible}
          onClose={() => setSplitVisible(false)}
          bill={displayBill}
          staffId={staffId}
          onSuccess={refetchBillAndVariants}
        />
      )}

      <SettleModal
        visible={settleVisible}
        onClose={() => setSettleVisible(false)}
        billId={displayBill?.id ?? ''}
        payableAmount={displayBill?.payable ?? 0}
        staffId={staffId}
        modes={modes}
        isSplitVariant={bill?.isSplit === true}
        onSettled={handleSettled}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0F172A' },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24 },
  noTable: { color: '#94A3B8', marginBottom: 16 },
  backBtn: { padding: 16 },
  backBtnText: { color: '#FFD700', fontWeight: '600' },
  header: { flexDirection: 'row', alignItems: 'center', padding: 16, borderBottomWidth: 1, borderBottomColor: '#334155' },
  backButton: { marginRight: 12 },
  backText: { color: '#FFD700', fontSize: 16 },
  title: { fontSize: 18, fontWeight: '700', color: '#F8FAFC' },
  loading: { flex: 1, justifyContent: 'center' },
  empty: { flex: 1, justifyContent: 'center', padding: 24 },
  emptyText: { color: '#64748B', textAlign: 'center' },
  contentWrap: { flex: 1 },
  content: { flex: 1 },
  contentInner: { padding: 16 },
  contentInnerScroll: { paddingBottom: 24 },
  billFooter: {
    padding: 16,
    paddingBottom: 24,
    borderTopWidth: 1,
    borderTopColor: '#334155',
    backgroundColor: '#0F172A',
  },
  variantRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 16 },
  variantBtn: { backgroundColor: '#334155', paddingVertical: 10, paddingHorizontal: 14, borderRadius: 10 },
  variantBtnActive: { backgroundColor: '#FFD700' },
  variantBtnPaid: { opacity: 0.8 },
  variantBtnText: { color: '#F8FAFC', fontWeight: '600', fontSize: 14 },
  variantPaidBadge: { color: '#94A3B8', fontSize: 11, marginTop: 2 },
  billRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 8 },
  billItemName: { color: '#F8FAFC', fontSize: 14 },
  billItemPrice: { color: '#FFD700', fontWeight: '600' },
  divider: { height: 1, backgroundColor: '#334155', marginVertical: 12 },
  summaryRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 4 },
  summaryLabel: { color: '#94A3B8', fontSize: 14 },
  summaryValue: { color: '#F8FAFC', fontSize: 14 },
  payableRow: { marginTop: 12, paddingTop: 12, borderTopWidth: 1, borderTopColor: '#334155' },
  payableLabel: { fontSize: 18, fontWeight: '700', color: '#F8FAFC' },
  payableValue: { fontSize: 20, fontWeight: '800', color: '#FFD700' },
  actionRow: { flexDirection: 'row', gap: 8, marginTop: 16, flexWrap: 'wrap' },
  smallBtn: { backgroundColor: '#334155', paddingVertical: 10, paddingHorizontal: 14, borderRadius: 10 },
  smallBtnText: { color: '#F8FAFC', fontWeight: '600', fontSize: 14 },
  primaryBtn: { backgroundColor: '#FFD700', paddingVertical: 16, borderRadius: 12, alignItems: 'center', marginTop: 24 },
  payBtn: { marginTop: 16 },
  instanceBtn: { backgroundColor: '#334155', paddingVertical: 14, borderRadius: 12, alignItems: 'center', marginTop: 12 },
  instanceBtnText: { color: '#FFD700', fontWeight: '700', fontSize: 14 },
  primaryBtnText: { color: '#0F172A', fontWeight: '700', fontSize: 16 },
  btnDisabled: { opacity: 0.6 },
});

export default BillScreen;
