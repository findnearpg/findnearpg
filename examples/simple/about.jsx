import {
    View as RNView,
    Text as RNText,
    ScrollView as RNScrollView,
    SafeAreaView as RNSafeAreaView,
} from "react-native";
import { StatusBar as RNStatusBar } from "expo-status-bar";
import RNFontAwesome from "@expo/vector-icons/FontAwesome";

export default function AboutPage() {
    return (
        <RNSafeAreaView style={{ flex: 1, backgroundColor: "white" }}>
            <RNStatusBar style="dark" />
            <RNScrollView contentContainerStyle={{ padding: 20 }}>
                <RNView style={{ alignItems: "center", marginBottom: 30 }}>
                    <RNText
                        style={{ fontSize: 28, fontWeight: "bold", marginBottom: 10 }}
                    >
                        About Us
                    </RNText>
                </RNView>

                <RNView style={{ marginBottom: 25 }}>
                    <RNView
                        style={{
                            flexDirection: "row",
                            alignItems: "center",
                            marginBottom: 15,
                        }}
                    >
                        <RNFontAwesome
                            name="star"
                            size={24}
                            color="#007bff"
                            style={{ marginRight: 10 }}
                        />
                        <RNText style={{ fontSize: 20, fontWeight: "600" }}>
                            Our Mission
                        </RNText>
                    </RNView>
                    <RNText style={{ fontSize: 16, lineHeight: 24, color: "#444" }}>
                        We're dedicated to creating amazing experiences and delivering value
                        to our users through innovative solutions.
                    </RNText>
                </RNView>

                <RNView style={{ marginBottom: 25 }}>
                    <RNView
                        style={{
                            flexDirection: "row",
                            alignItems: "center",
                            marginBottom: 15,
                        }}
                    >
                        <RNFontAwesome
                            name="users"
                            size={24}
                            color="#007bff"
                            style={{ marginRight: 10 }}
                        />
                        <RNText style={{ fontSize: 20, fontWeight: "600" }}>
                            Our Team
                        </RNText>
                    </RNView>
                    <RNText style={{ fontSize: 16, lineHeight: 24, color: "#444" }}>
                        Our team consists of passionate individuals working together to
                        build the best possible solutions for our community.
                    </RNText>
                </RNView>

                <RNView style={{ marginBottom: 25 }}>
                    <RNView
                        style={{
                            flexDirection: "row",
                            alignItems: "center",
                            marginBottom: 15,
                        }}
                    >
                        <RNFontAwesome
                            name="heart"
                            size={24}
                            color="#007bff"
                            style={{ marginRight: 10 }}
                        />
                        <RNText style={{ fontSize: 20, fontWeight: "600" }}>
                            Our Values
                        </RNText>
                    </RNView>
                    <RNText style={{ fontSize: 16, lineHeight: 24, color: "#444" }}>
                        We believe in transparency, innovation, and putting our users first
                        in everything we do.
                    </RNText>
                </RNView>

                <RNView>
                    <RNView
                        style={{
                            flexDirection: "row",
                            alignItems: "center",
                            marginBottom: 15,
                        }}
                    >
                        <RNFontAwesome
                            name="envelope"
                            size={24}
                            color="#007bff"
                            style={{ marginRight: 10 }}
                        />
                        <RNText style={{ fontSize: 20, fontWeight: "600" }}>Contact</RNText>
                    </RNView>
                    <RNText style={{ fontSize: 16, lineHeight: 24, color: "#444" }}>
                        Have questions or feedback? We'd love to hear from you. Reach out to
                        our team anytime.
                    </RNText>
                </RNView>
            </RNScrollView>
        </RNSafeAreaView>
    );
}


