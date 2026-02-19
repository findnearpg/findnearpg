import { TouchableOpacity, Text } from 'react-native';

export default function Page() {
  return (
    <TouchableOpacity
      onPress={() => {
        throw new Error('This is a test error');
      }}
    >
      <Text>Tap to throw an error</Text>
    </TouchableOpacity>
  );
}
