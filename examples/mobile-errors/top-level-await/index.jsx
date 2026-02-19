import { View, Text } from 'react-native';
const value = await Promise.resolve('top level awaited promise');
export default function Page() {
  return (
    <View>
      <Text>{value}</Text>
    </View>
  );
}
