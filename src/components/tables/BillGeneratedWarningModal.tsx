import { Modal, View, Text, StyleSheet, Pressable, Image, Dimensions } from 'react-native';
import { neoModal } from '../../theme/neoBrutalism';
import mergeandtransfer from '../../assets/mergeandtransfer.jpeg';

const { width } = Dimensions.get('window');

interface BillGeneratedWarningModalProps {
  visible: boolean;
  onClose: () => void;
  actionType: 'transfer' | 'merge' | 'generate';
}

export default function BillGeneratedWarningModal({
  visible,
  onClose,
  actionType,
}: BillGeneratedWarningModalProps) {
  const isGenerate = actionType === 'generate';

  return (
    <Modal visible={visible} animationType="fade" transparent>
      <View style={styles.overlay}>
        <View style={[styles.container, neoModal]}>
          <View style={styles.banner}>
            <Text style={styles.bannerText}>
              {isGenerate ? 'BILL GENERATED!' : 'ACTION BLOCKED!'}
            </Text>
          </View>

          <View style={styles.content}>
            <Image
              source={mergeandtransfer}
              style={styles.warningImage}
              resizeMode="contain"
            />
          </View>

          <Pressable
            onPress={onClose}
            style={({ pressed }) => [
              styles.closeBtn,
              { opacity: pressed ? 0.8 : 1 }
            ]}
          >
            <Text style={styles.closeBtnText}>GOT IT</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.85)',
    justifyContent: 'center',
    padding: 20,
  },
  container: {
    backgroundColor: '#fff',
    overflow: 'hidden',
  },
  banner: {
    backgroundColor: '#ef4444',
    paddingVertical: 14,
    alignItems: 'center',
  },
  bannerText: {
    color: '#ffffff',
    fontWeight: '900',
    fontSize: 18,
    letterSpacing: 1,
  },
  content: {
    padding: 10,
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  warningImage: {
    width: width - 80,
    height: (width - 80) * 0.7, // Assuming 4:3 or similar aspect ratio, adjust as needed
  },
  closeBtn: {
    backgroundColor: '#fbbf24',
    paddingVertical: 18,
    alignItems: 'center',
    borderTopWidth: 3,
    borderTopColor: '#d97706',
  },
  closeBtnText: {
    color: '#000',
    fontWeight: '900',
    fontSize: 18,
    letterSpacing: 1,
  },
});
