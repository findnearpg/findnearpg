import { useState } from "react";
import {
    View as RNView,
    Text as RNText,
    TouchableOpacity as RNTouchableOpacity,
    SafeAreaView as RNSafeAreaView,
} from "react-native";
import { StatusBar as RNStatusBar } from "expo-status-bar";
import { useRouter } from "expo-router";

export default function LandingPage() {
    const [isPressed, setIsPressed] = useState(false);
    const router = useRouter();

    return (
        <RNSafeAreaView style={{ flex: 1, backgroundColor: "white" }}>
            <RNStatusBar style="dark" />
            <RNView
                style={{
                    flex: 1,
                    padding: 20,
                    alignItems: "center",
                    justifyContent: "center",
                }}
            >
                <RNView style={{ alignItems: "center", marginBottom: 40 }}>
                    <RNText
                        style={{ fontSize: 32, fontWeight: "bold", marginBottom: 10 }}
                    >
                        Welcome
                    </RNText>
                    <RNText style={{ fontSize: 18, textAlign: "center", color: "#666" }}>
                        Start exploring your new app today
                    </RNText>
                </RNView>

                <RNTouchableOpacity
                    onPress={() => setIsPressed(true)}
                    onPressOut={() => setIsPressed(false)}
                    style={{
                        backgroundColor: isPressed ? "#0056b3" : "#007bff",
                        paddingVertical: 15,
                        paddingHorizontal: 30,
                        borderRadius: 25,
                        width: "80%",
                        alignItems: "center",
                        marginBottom: 20,
                    }}
                >
                    <RNText style={{ color: "white", fontSize: 18, fontWeight: "600" }}>
                        Get Started
                    </RNText>
                </RNTouchableOpacity>

                <RNTouchableOpacity
                    onPress={() => router.push("/about")}
                    style={{
                        paddingVertical: 15,
                        paddingHorizontal: 30,
                        borderRadius: 25,
                        width: "80%",
                        alignItems: "center",
                        borderWidth: 2,
                        borderColor: "#007bff",
                    }}
                >
                    <RNText style={{ color: "#007bff", fontSize: 18, fontWeight: "600" }}>
                        About Us
                    </RNText>
                </RNTouchableOpacity>
            </RNView>
        </RNSafeAreaView>
    );
}


