import auth from "@react-native-firebase/auth";
import {
  GoogleSignin,
  statusCodes,
  User,
} from "@react-native-google-signin/google-signin";
import React, { useEffect, useState } from "react";
import { ActivityIndicator, Alert, Button, Text, View } from "react-native";

export default function LoginScreen() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    (async () => {
      const hasPlay = await GoogleSignin.hasPlayServices();
      if (hasPlay) {
        const signedIn = await GoogleSignin.isSignedIn();
        if (signedIn) {
          const info = await GoogleSignin.signInSilently();
          onSignIn(info);
        }
      }
    })().catch(console.error);
  }, []);

  const onSignIn = async (gUser: User) => {
    const { idToken } = await GoogleSignin.getTokens();
    const credential = auth.GoogleAuthProvider.credential(idToken);
    await auth().signInWithCredential(credential);
    setUser(gUser);
  };

  const handleSignIn = async () => {
    try {
      setLoading(true);
      const gUser = await GoogleSignin.signIn();
      await onSignIn(gUser);
    } catch (error: any) {
      if (error.code === statusCodes.SIGN_IN_CANCELLED) return;
      Alert.alert("Google Sign-In Error", error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
      {loading ? (
        <ActivityIndicator />
      ) : user ? (
        <Text>Welcome, {user.user.name}</Text>
      ) : (
        <Button title="Sign in with Google" onPress={handleSignIn} />
      )}
    </View>
  );
}
