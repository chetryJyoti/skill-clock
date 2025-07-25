import { AntDesign, Ionicons } from "@expo/vector-icons";
import auth from "@react-native-firebase/auth";
import { GoogleSignin } from "@react-native-google-signin/google-signin";
import { router } from "expo-router";
import React, { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  Modal,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

// Configure Google Sign-In
GoogleSignin.configure({
  webClientId:
    "551963704079-qpsfkiansd5pqcko3mp8ovirvmp28jp0.apps.googleusercontent.com",
     offlineAccess: false,
});

const LoginScreen = () => {
  const [isSigningIn, setIsSigningIn] = useState(false);
  const [showTermsModal, setShowTermsModal] = useState(false);
  const [showPrivacyModal, setShowPrivacyModal] = useState(false);

  const handleGoogleSignIn = async () => {
    try {
      setIsSigningIn(true);
      await GoogleSignin.hasPlayServices({
        showPlayServicesUpdateDialog: true,
      });
      const { user } = await GoogleSignin.signIn();
      const idToken = user.auth.idToken;
      const googleCredential = auth.GoogleAuthProvider.credential(idToken);
      await auth().signInWithCredential(googleCredential);
      router.replace("/(tabs)/skills");
    } catch (error) {
      Alert.alert("Authentication Error", "Failed to authenticate with Google");
      console.error(error);
    } finally {
      setIsSigningIn(false);
    }
  };
  const TermsModal = () => (
    <Modal
      animationType="slide"
      transparent={true}
      visible={showTermsModal}
      onRequestClose={() => setShowTermsModal(false)}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Terms of Service</Text>
            <TouchableOpacity
              onPress={() => setShowTermsModal(false)}
              style={styles.closeButton}
            >
              <Ionicons name="close" size={24} color="#666" />
            </TouchableOpacity>
          </View>

          <ScrollView
            style={styles.modalContent}
            showsVerticalScrollIndicator={false}
          >
            <Text style={styles.modalText}>
              <Text style={styles.sectionTitle}>
                1. Acceptance of Terms{"\n"}
              </Text>
              By using Skill Clock, you agree to be bound by these Terms of
              Service. If you do not agree to these terms, please do not use our
              service.
              {"\n\n"}
              <Text style={styles.sectionTitle}>
                2. Description of Service{"\n"}
              </Text>
              Skill Clock is a skill tracking and development application that
              helps users monitor their progress and improve their abilities
              over time.
              {"\n\n"}
              <Text style={styles.sectionTitle}>3. User Accounts{"\n"}</Text>
              You are responsible for maintaining the confidentiality of your
              account and password. You agree to accept responsibility for all
              activities that occur under your account.
              {"\n\n"}
              <Text style={styles.sectionTitle}>4. Privacy Policy{"\n"}</Text>
              Your privacy is important to us. Please review our Privacy Policy,
              which also governs your use of the service.
              {"\n\n"}
              <Text style={styles.sectionTitle}>5. Prohibited Uses{"\n"}</Text>
              You may not use our service for any illegal or unauthorized
              purpose. You must not violate any laws in your jurisdiction when
              using our service.
              {"\n\n"}
              <Text style={styles.sectionTitle}>6. Modifications{"\n"}</Text>
              We reserve the right to modify or replace these Terms at any time.
              If a revision is material, we will try to provide at least 30 days
              notice prior to any new terms taking effect.
              {"\n\n"}
              <Text style={styles.sectionTitle}>
                7. Contact Information{"\n"}
              </Text>
              If you have any questions about these Terms, please contact us at
              support@skillclock.com.
            </Text>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );

  const PrivacyModal = () => (
    <Modal
      animationType="slide"
      transparent={true}
      visible={showPrivacyModal}
      onRequestClose={() => setShowPrivacyModal(false)}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Privacy Policy</Text>
            <TouchableOpacity
              onPress={() => setShowPrivacyModal(false)}
              style={styles.closeButton}
            >
              <Ionicons name="close" size={24} color="#666" />
            </TouchableOpacity>
          </View>

          <ScrollView
            style={styles.modalContent}
            showsVerticalScrollIndicator={false}
          >
            <Text style={styles.modalText}>
              <Text style={styles.sectionTitle}>
                Information We Collect{"\n"}
              </Text>
              We collect information you provide directly to us, such as when
              you create an account, use our services, or contact us for
              support.
              {"\n\n"}
              <Text style={styles.sectionTitle}>
                How We Use Your Information{"\n"}
              </Text>
              We use the information we collect to provide, maintain, and
              improve our services, process transactions, and communicate with
              you.
              {"\n\n"}
              <Text style={styles.sectionTitle}>Information Sharing{"\n"}</Text>
              We do not sell, trade, or otherwise transfer your personal
              information to third parties without your consent, except as
              described in this policy.
              {"\n\n"}
              <Text style={styles.sectionTitle}>Data Security{"\n"}</Text>
              We implement appropriate security measures to protect your
              personal information against unauthorized access, alteration,
              disclosure, or destruction.
              {"\n\n"}
              <Text style={styles.sectionTitle}>
                Google Authentication{"\n"}
              </Text>
              When you sign in with Google, we receive basic profile information
              from Google. We only use this information to authenticate your
              account and provide our services.
              {"\n\n"}
              <Text style={styles.sectionTitle}>Data Retention{"\n"}</Text>
              We retain your information for as long as your account is active
              or as needed to provide you services and comply with our legal
              obligations.
              {"\n\n"}
              <Text style={styles.sectionTitle}>Your Rights{"\n"}</Text>
              You have the right to access, update, or delete your personal
              information. You can do this through your account settings or by
              contacting us.
              {"\n\n"}
              <Text style={styles.sectionTitle}>Contact Us{"\n"}</Text>
              If you have any questions about this Privacy Policy, please
              contact us at privacy@skillclock.com.
            </Text>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />

      {/* Header Section */}
      <View style={styles.header}>
        <View style={styles.logoContainer}>
          <Image
            source={require("../assets/images/icon.png")}
            style={styles.logo}
          />
        </View>
        <Text style={styles.appName}>SKILL CLOCK</Text>
        <Text style={styles.tagline}>
          Master your skills, track your progress
        </Text>
      </View>

      {/* Main Content */}
      <View style={styles.content}>
        <View style={styles.welcomeSection}>
          <Text style={styles.welcomeTitle}>Get Started</Text>
          <Text style={styles.welcomeSubtitle}>
            Begin your skill development journey with us
          </Text>
        </View>

        <View style={styles.authSection}>
          <TouchableOpacity
            style={[styles.googleButton, isSigningIn && styles.buttonDisabled]}
            onPress={handleGoogleSignIn}
            disabled={isSigningIn}
            activeOpacity={0.8}
          >
            {isSigningIn ? (
              <ActivityIndicator color="#666" size="small" />
            ) : (
              <>
                <View style={styles.googleIconContainer}>
                  <AntDesign name="google" size={18} color="#ffffff" />
                </View>
                <Text style={styles.googleButtonText}>
                  Continue with Google
                </Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      </View>

      {/* Footer */}
      <View style={styles.footer}>
        <View style={styles.footerTextContainer}>
          <Text style={styles.footerText}>
            By continuing, you agree to our{" "}
          </Text>
          <TouchableOpacity onPress={() => setShowTermsModal(true)}>
            <Text style={styles.linkText}>Terms of Service</Text>
          </TouchableOpacity>
          <Text style={styles.footerText}> and </Text>
          <TouchableOpacity onPress={() => setShowPrivacyModal(true)}>
            <Text style={styles.linkText}>Privacy Policy</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Modals */}
      <TermsModal />
      <PrivacyModal />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#ffffff",
  },
  header: {
    alignItems: "center",
    paddingTop: 60,
    paddingHorizontal: 24,
  },
  logoContainer: {
    width: 80,
    height: 80,
    borderRadius: 20,
    backgroundColor: "#f8f9fa",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 24,
    borderWidth: 1,
    borderColor: "#e9ecef",
  },
  logo: {
    width: 50,
    height: 50,
  },
  appName: {
    fontSize: 28,
    fontWeight: "800",
    color: "#212529",
    letterSpacing: 1,
    marginBottom: 8,
  },
  tagline: {
    fontSize: 16,
    color: "#6c757d",
    textAlign: "center",
    lineHeight: 22,
  },
  content: {
    flex: 1,
    justifyContent: "center",
    paddingHorizontal: 24,
  },
  welcomeSection: {
    alignItems: "center",
    marginBottom: 48,
  },
  welcomeTitle: {
    fontSize: 32,
    fontWeight: "700",
    color: "#212529",
    marginBottom: 12,
  },
  welcomeSubtitle: {
    fontSize: 16,
    color: "#6c757d",
    textAlign: "center",
    lineHeight: 24,
    paddingHorizontal: 20,
  },
  authSection: {
    width: "100%",
  },
  googleButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#ffffff",
    paddingVertical: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#dee2e6",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  googleIconContainer: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: "#4285f4",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  googleButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#212529",
  },
  footer: {
    paddingHorizontal: 24,
    paddingBottom: 40,
    alignItems: "center",
  },
  footerTextContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
    alignItems: "center",
  },
  footerText: {
    fontSize: 12,
    color: "#6c757d",
    textAlign: "center",
    lineHeight: 18,
  },
  linkText: {
    color: "#007bff",
    fontWeight: "600",
    textDecorationLine: "underline",
    fontSize: 12,
  },
  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContainer: {
    backgroundColor: "#ffffff",
    borderRadius: 16,
    width: "90%",
    maxHeight: "80%",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 8,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#e9ecef",
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#212529",
  },
  closeButton: {
    padding: 4,
  },
  modalContent: {
    padding: 20,
  },
  modalText: {
    fontSize: 14,
    lineHeight: 22,
    color: "#495057",
  },
  sectionTitle: {
    fontWeight: "700",
    color: "#212529",
  },
});

export default LoginScreen;
