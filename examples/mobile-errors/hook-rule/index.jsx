import { useState } from 'react';
import { Text, View } from 'react-native';

export default function Page() {
  const [count, setCount] = useState(0);
  if (count > 5) {
    // violates Rules of Hooks
    const [n, setValue] = useState(0);
  }
  return (
    <View>
      <Text>Count: {count}</Text>
      <Text onPress={() => setCount(count + 1)}>Increment Count</Text>
    </View>
  );
}
