import React, { useState } from 'react';
import { View, Text, TextInput, Button, Alert } from 'react-native';
import { getLoyaltyStatus } from '../api/apiClient';

const BillingScreen = () => {
  const [phone, setPhone] = useState('');
  const [points, setPoints] = useState(0);

  const checkLoyalty = async () => {
    try {
      const data = await getLoyaltyStatus(phone);
      setPoints(data.points);
      Alert.alert('Success', `Customer has ${data.points} loyalty points.`);
    } catch (error) {
      Alert.alert('Error', 'Could not find customer in client database.');
    }
  };

  return (
    <View style={{ padding: 20 }}>
      <Text style={{ fontSize: 18, fontWeight: 'bold' }}>Restaurant Billing</Text>
      <TextInput 
        placeholder="Enter Phone for Loyalty" 
        value={phone}
        onChangeText={setPhone}
        style={{ borderBottomWidth: 1, marginVertical: 10 }}
      />
      <Button title="Check Loyalty" onPress={checkLoyalty} />
      <Text style={{ marginTop: 20 }}>Available Points: {points}</Text>
    </View>
  );
};

export default BillingScreen;