import {
  GoogleSignin,
  statusCodes,
} from "@react-native-google-signin/google-signin";
import * as AppleAuthentication from "expo-apple-authentication";
import { useRouter } from "expo-router";
import { jwtDecode } from "jwt-decode";
import { useEffect, useMemo, useState } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import PasswordInput from "../../components/PasswordInput";
import { useAuth } from "../../contexts/AuthContext";
import { useTheme } from "../../contexts/ThemeContext";
import { useToast } from "../../contexts/ToastContext";
import {
  GoogleAuthProvider,
  auth,
  provider,
  signInWithCredential,
  signInWithPopup,
} from "../../services/fireBase";
import { setToken } from "../../services/storage";

export default function Login() {
  const router = useRouter();
  const { colors } = useTheme();
  const styles = useMemo(() => getStyles(colors), [colors]);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [socialLoading, setSocialLoading] = useState(null);
  const { addToast } = useToast();
  const { googleLogin, appleLogin, setSession } = useAuth();

  const finishLogin = async (
    user,
    token,
    successMessage = "Login successful",
  ) => {
    await setToken(token);
    setSession(user, token);
    addToast(successMessage, "success");
    router.replace("/");
  };

  const handleSignIn = async () => {
    try {
      setLoading(true);

      const response = await fetch(`${process.env.EXPO_PUBLIC_API_URL}/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          EmailID: email,
          pass: password,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        if (data.code === "EMAIL_NOT_VERIFIED") {
          router.push({
            pathname: "/verify-email",
            params: { email, reason: "login" },
          });
          return;
        }
        addToast(data.message || "Invalid email or password", "error");
        return;
      }

      if (!data.token || !data.user) {
        addToast(data.message || "Invalid email or password", "error");
        return;
      }

      await finishLogin(data.user, data.token);
    } catch (error) {
      console.error("Login failed:", error);
      addToast("Something went wrong. Please try again.", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleCredentialResponse = async (response) => {
    try {
      if (!response?.credential) {
        addToast("Google authentication failed", "error");

        return;
      }

      const googleUser = jwtDecode(response.credential);

      const userData = {
        email: googleUser?.email,
        name: googleUser?.name,
      };

      const data = await googleLogin(response.credential);

      await finishLogin(
        data?.user ?? userData,
        data?.token ?? response.credential,
      );
    } catch (error) {
      console.error("Google credential error:", error);

      addToast("Google login failed", "error");
    }
  };

  // Google Identity Services (One Tap) is a web-only script; it must not
  // run on native, where `window`/`document` are not the browser globals.
  useEffect(() => {
    if (Platform.OS !== "web") return;

    if (window.google?.accounts?.id) {
      window.google.accounts.id.initialize({
        client_id:
          "339051675114-aaha2bnjsut4rat31u31c72rrl916elu.apps.googleusercontent.com",

        callback: handleCredentialResponse,
      });

      return;
    }

    const existingScript = document.querySelector(
      'script[src="https://accounts.google.com/gsi/client"]',
    );

    if (existingScript) {
      existingScript.addEventListener("load", initializeGoogle);

      return () => {
        existingScript.removeEventListener("load", initializeGoogle);
      };
    }

    const script = document.createElement("script");

    script.src = "https://accounts.google.com/gsi/client";

    script.async = true;
    script.defer = true;

    script.onload = initializeGoogle;

    document.body.appendChild(script);

    return () => {
      script.onload = null;
    };

    function initializeGoogle() {
      if (window.google?.accounts?.id) {
        window.google.accounts.id.initialize({
          client_id:
            "339051675114-aaha2bnjsut4rat31u31c72rrl916elu.apps.googleusercontent.com",

          callback: handleCredentialResponse,
        });
      }
    }
  }, []);

  // Native Google Sign-In needs to be configured once before GoogleSignin.signIn() is called.
  useEffect(() => {
    if (Platform.OS === "web") return;

    GoogleSignin.configure({
      webClientId: process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID,
      offlineAccess: false,
      scopes: ["profile", "email"],
    });
  }, []);

  const handleSignUp = () => {
    router.push("/signup");
  };

  const handleGoogleSignIn = async () => {
    try {
      setSocialLoading("google");

      let firebaseUser;

      if (Platform.OS === "web") {
        const result = await signInWithPopup(auth, provider);
        firebaseUser = result?.user;
      } else {
        await GoogleSignin.hasPlayServices({
          showPlayServicesUpdateDialog: true,
        });

        const signInResult = await GoogleSignin.signIn();
        const idToken = signInResult?.data?.idToken ?? signInResult?.idToken;

        if (!idToken) {
          addToast("Google sign-in failed", "error");
          return;
        }

        const credential = GoogleAuthProvider.credential(idToken);
        const result = await signInWithCredential(auth, credential);
        firebaseUser = result?.user;
      }

      if (!firebaseUser) {
        addToast("Google login failed", "error");

        return;
      }

      if (!firebaseUser.email) {
        console.error("Google sign-in returned no email:", firebaseUser);
        addToast("Your Google account has no email to sign in with", "error");

        return;
      }

      const idToken = await firebaseUser.getIdToken();

      const userData = {
        email: firebaseUser.email,
        name: firebaseUser.displayName,
      };

      const data = await googleLogin(idToken);

      await finishLogin(data?.user ?? userData, data?.token ?? idToken);
    } catch (error) {
      if (error?.code === statusCodes.SIGN_IN_CANCELLED) return;

      console.error("Google sign-in error:", error);

      addToast("Google sign-in failed", "error");
    } finally {
      setSocialLoading(null);
    }
  };

  const handleAppleSignIn = async () => {
    try {
      setSocialLoading("apple");

      const credential = await AppleAuthentication.signInAsync({
        requestedScopes: [
          AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
          AppleAuthentication.AppleAuthenticationScope.EMAIL,
        ],
      });

      if (!credential.identityToken) {
        addToast("Apple sign-in failed", "error");

        return;
      }

      // Apple only returns name/email on the FIRST authorization for a given
      // app; later sign-ins omit both, so the backend must key the account
      // off `appleUserId` (credential.user), not email.
      const name = credential.fullName
        ? [credential.fullName.givenName, credential.fullName.familyName]
            .filter(Boolean)
            .join(" ")
        : undefined;

      const data = await appleLogin({
        identityToken: credential.identityToken,
        appleUserId: credential.user,
        email: credential.email,
        name,
      });

      await finishLogin(
        data?.user ?? { email: credential.email, name },
        data?.token ?? credential.identityToken,
      );
    } catch (error) {
      if (error.code === "ERR_REQUEST_CANCELED") return;

      console.error("Apple sign-in error:", error);

      addToast("Apple sign-in failed", "error");
    } finally {
      setSocialLoading(null);
    }
  };

  const handleTwitterLogin = () => {
    console.log("Twitter login");
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior="padding">
        <ScrollView
          contentContainerStyle={styles.container}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
        {/* Close */}
        <Pressable style={styles.closeButton} onPress={() => router.back()}>
          <Text style={styles.closeText}>×</Text>
        </Pressable>

        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Welcome Back</Text>

          <Text style={styles.subtitle}>
            Sign in to continue to NIT KKR PYQs
          </Text>
        </View>

        {/* Form */}
        <View style={styles.form}>
          <Text style={styles.label}>Email</Text>

          <TextInput
            value={email}
            onChangeText={setEmail}
            placeholder="Enter your email"
            placeholderTextColor={colors.steel}
            autoCapitalize="none"
            keyboardType="email-address"
            style={styles.input}
          />

          <Text style={styles.label}>Password</Text>

          <PasswordInput
            inputStyle={styles.input}
            value={password}
            onChangeText={setPassword}
            placeholder="Enter your password"
            placeholderTextColor={colors.steel}
          />

          <Pressable
            style={styles.forgotPasswordRow}
            onPress={() => router.push("/forgot-password")}
          >
            <Text style={styles.forgotPasswordText}>Forgot Password?</Text>
          </Pressable>

          <Pressable
            style={({ pressed }) => [
              styles.signInButton,
              pressed && styles.buttonPressed,
              loading && styles.buttonDisabled,
            ]}
            onPress={handleSignIn}
            disabled={loading}
          >
            <Text style={styles.signInText}>
              {loading ? "Signing in..." : "Sign in"}
            </Text>
          </Pressable>
        </View>

        {/* Sign up */}
        <View style={styles.signupRow}>
          <Text style={styles.signupText}>Don&apos;t have an account?</Text>

          <Pressable onPress={handleSignUp}>
            <Text style={styles.signupLink}>Sign up</Text>
          </Pressable>
        </View>

        {/* Divider */}
        <View style={styles.dividerContainer}>
          <View style={styles.divider} />

          <Text style={styles.orText}>OR</Text>

          <View style={styles.divider} />
        </View>

        <View style={styles.socialContainer}>
          <Pressable
            style={({ pressed }) => [
              styles.socialButton,
              pressed && styles.buttonPressed,
              socialLoading === "google" && styles.buttonDisabled,
            ]}
            onPress={handleGoogleSignIn}
            disabled={!!socialLoading}
          >
            <View style={styles.googleIcon}>
              <Text style={styles.googleG}>G</Text>
            </View>

            <Text style={styles.socialText}>
              {socialLoading === "google"
                ? "Signing in..."
                : "Continue with Google"}
            </Text>
          </Pressable>

          {Platform.OS === "ios" && (
            <AppleAuthentication.AppleAuthenticationButton
              buttonType={
                AppleAuthentication.AppleAuthenticationButtonType.SIGN_IN
              }
              buttonStyle={
                AppleAuthentication.AppleAuthenticationButtonStyle.WHITE
              }
              cornerRadius={13}
              style={styles.appleButton}
              onPress={handleAppleSignIn}
            />
          )}

          <Pressable
            style={({ pressed }) => [
              styles.socialButton,
              pressed && styles.buttonPressed,
            ]}
            onPress={handleTwitterLogin}
          >
            <Text style={styles.twitterIcon}>𝕏</Text>

            <Text style={styles.socialText}>Continue with Twitter</Text>
          </Pressable>
        </View>

        {/* Footer */}
        <Text style={styles.footer}>
          By continuing, you agree to our Terms and Privacy Policy.
        </Text>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const getStyles = (colors) =>
  StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.void,
  },

  // contentContainerStyle for a ScrollView, not a flex box.
  container: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingBottom: 24,
    maxWidth: 500,
    width: "100%",
    alignSelf: "center",
  },

  closeButton: {
    width: 42,
    height: 42,
    borderRadius: 21,

    alignItems: "center",
    justifyContent: "center",

    backgroundColor: "rgba(255,255,255,0.06)",

    marginTop: 12,
    alignSelf: "flex-start",
  },

  closeText: {
    color: colors.chrome,
    fontSize: 28,
    fontWeight: "300",
    lineHeight: 30,
  },

  header: {
    marginTop: 35,
    marginBottom: 32,
  },

  title: {
    color: colors.chrome,
    fontSize: 32,
    fontWeight: "700",
    letterSpacing: -0.7,
  },

  subtitle: {
    color: colors.steel,
    fontSize: 15,
    marginTop: 9,
    lineHeight: 22,
  },

  form: {
    width: "100%",
  },

  label: {
    color: colors.silver,
    fontSize: 13,
    fontWeight: "500",
    marginBottom: 8,
  },

  input: {
    width: "100%",
    height: 52,

    backgroundColor: colors.onyxRaised,

    borderWidth: 1,
    borderColor: colors.hairline,
    borderRadius: 13,

    paddingHorizontal: 15,

    color: colors.chrome,
    fontSize: 15,

    marginBottom: 18,

    outlineStyle: "none",
  },

  forgotPasswordRow: {
    alignSelf: "flex-end",
    marginBottom: 18,
  },

  forgotPasswordText: {
    color: colors.steel,
    fontSize: 13,
    fontWeight: "500",
  },

  signInButton: {
    height: 52,

    borderRadius: 13,

    backgroundColor: colors.chrome,

    alignItems: "center",
    justifyContent: "center",

    marginTop: 4,
  },

  signInText: {
    color: colors.void,
    fontSize: 15,
    fontWeight: "700",
  },

  buttonPressed: {
    opacity: 0.7,
  },

  buttonDisabled: {
    opacity: 0.5,
  },

  signupRow: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",

    marginTop: 22,
    gap: 5,
  },

  signupText: {
    color: colors.steel,
    fontSize: 14,
  },

  signupLink: {
    color: colors.chrome,
    fontSize: 14,
    fontWeight: "600",
  },

  dividerContainer: {
    flexDirection: "row",
    alignItems: "center",

    marginVertical: 28,
  },

  divider: {
    flex: 1,
    height: 1,
    backgroundColor: colors.hairline,
  },

  orText: {
    color: colors.steel,
    fontSize: 11,
    marginHorizontal: 14,
    fontWeight: "600",
  },

  socialContainer: {
    gap: 12,
  },

  socialButton: {
    height: 52,

    borderRadius: 13,

    backgroundColor: colors.onyxRaised,

    borderWidth: 1,
    borderColor: colors.hairline,

    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",

    gap: 12,
  },

  socialText: {
    color: "#E5E5E7",
    fontSize: 14,
    fontWeight: "500",
  },

  googleIcon: {
    width: 24,
    height: 24,

    alignItems: "center",
    justifyContent: "center",
  },

  googleG: {
    color: "#EA4335",
    fontSize: 23,
    fontWeight: "700",
  },

  appleButton: {
    height: 52,
    width: "100%",
  },

  twitterIcon: {
    color: colors.chrome,
    fontSize: 21,
    fontWeight: "600",
  },

  footer: {
    color: "#55555B",
    fontSize: 11,

    textAlign: "center",
    lineHeight: 17,

    marginTop: 25,
    marginBottom: 20,
  },
});
