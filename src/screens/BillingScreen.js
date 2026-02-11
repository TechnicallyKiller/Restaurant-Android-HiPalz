import React, { useState, useContext } from 'react';
import { View, Text, TextInput, Button, Alert, StyleSheet, ScrollView } from 'react-native';
import { getLoyaltyStatus } from '../api/apiClient';
import { SocketContext } from '../context/SocketContext'; 

const BillingScreen = () => {
  const [phone, setPhone] = useState('');
  const [points, setPoints] = useState(0);
  const [tableNumber, setTableNumber] = useState('');
  
  
  const socket = useContext(SocketContext);

  //  ONLINE
  const checkLoyalty = async () => {
    if (!phone) return Alert.alert('Error', 'Please enter a phone number');
    try {
      const data = await getLoyaltyStatus(phone);
      setPoints(data.points);
      Alert.alert('Success', `Customer has ${data.points} points.`);
    } catch (error) {
      Alert.alert('Error', 'Could not sync with cloud billing database.');
    }
  };

  // OFFLINE
  const sendOrderToKitchen = () => {
    if (!tableNumber) return Alert.alert('Error', 'Enter a table number');
    
    if (socket && socket.connected) {
      const orderPayload = {
        tableNumber: tableNumber,
        timestamp: new Date().toLocaleTimeString(),
        items: ['Sample Item'], 
      };

      
      socket.emit('place_order', orderPayload);
      Alert.alert('Sent', `Order for Table ${tableNumber} sent to kitchen.`);
    } else {
      Alert.alert('Offline', 'Not connected to restaurant Wi-Fi hub.');
    }
  };

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Restaurant Terminal</Text>
      
      {/* Wireless Connection Status Indicator */}
      <Text style={{ color: socket?.connected ? 'green' : 'red', marginBottom: 20 }}>
        Status: {socket?.connected ? '● Wireless Hub Connected' : '○ Offline'}
      </Text>

      {/* Cloud-Sync Loyalty Section */}
      <View style={styles.section}>
        <Text style={styles.subtitle}>Loyalty Management (Cloud)</Text>
        <TextInput 
          placeholder="Customer Phone" 
          value={phone}
          onChangeText={setPhone}
          keyboardType="phone-pad"
          style={styles.input}
        />
        <Button title="Sync Loyalty Points" onPress={checkLoyalty} />
        <Text style={styles.resultText}>Available Points: {points}</Text>
      </View>

      {/* Offline Kitchen Section */}
      <View style={styles.section}>
        <Text style={styles.subtitle}>Kitchen Orders (Offline/Wi-Fi)</Text>
        <TextInput 
          placeholder="Table Number" 
          value={tableNumber}
          onChangeText={setTableNumber}
          keyboardType="numeric"
          style={styles.input}
        />
        <Button 
          title="Send to Kitchen" 
          onPress={sendOrderToKitchen} 
          color="#28a745" 
        />
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { padding: 20, backgroundColor: '#fff' },
  title: { fontSize: 22, fontWeight: 'bold', marginBottom: 10 },
  subtitle: { fontSize: 16, fontWeight: 'bold', marginBottom: 10, color: '#555' },
  section: { marginBottom: 30, padding: 15, borderWidth: 1, borderColor: '#eee', borderRadius: 8 },
  input: { borderBottomWidth: 1, borderColor: '#ccc', marginBottom: 15, padding: 5 },
  resultText: { marginTop: 10, fontWeight: 'bold', color: '#007AFF' }
});

export default BillingScreen;