import { useRouter } from "expo-router";
import { jwtDecode } from "jwt-decode";
import { useEffect, useState } from "react";
import {
    KeyboardAvoidingView,
    Platform,
    Pressable,
    SafeAreaView,
    StyleSheet,
    Text,
    TextInput,
    View,
} from "react-native";
import { useAuth } from "../../contexts/AuthContext";
import { useToast } from "../../contexts/ToastContext";
import { auth, provider, signInWithPopup } from "../../services/fireBase";
import { setToken } from "../../services/storage";

export default function Login() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const { addToast } = useToast();
  const { login, googleLogin } = useAuth();

  const completeLogin = async ({
    token,
    user,
    successMessage = "Login successful",
  }) => {
    try {
      if (!token || !user) {
        addToast("Invalid login response", "warning");
        return false;
      }

      const userData = {
        email: user.email || user.EmailID,
        name: user.name || user.username || user.displayName,
      };

      await setToken(token);

      login(userData);

      addToast(successMessage, "success");

      router.replace("/");

      return true;
    } catch (error) {
      console.error("Authentication completion error:", error);
      addToast("Unable to save login session", "error");
      return false;
    }
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
          email,
          password,
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.token || !data.user) {
        addToast(data.message || "Invalid email or password", "error");
        return;
      }

      await setToken(data.token);

      login(data.user);

      addToast("Login successful", "success");

      router.replace("/");
    } catch (error) {
      console.error("Login failed:", error);
    }
  };
  const handleCredentialResponse = async (response) => {
    try {
      if (!response?.credential) {
        addToast("Google authentication failed", "error");

        return;
      }

      const googleUser = jwtDecode(response.credential);

      await setToken(response.credential);

      const userData = {
        email: googleUser?.email,
        name: googleUser?.name,
      };

      addToast("Login successful", "success");
    } catch (error) {
      console.error("Google credential error:", error);

      addToast("Google login failed", "error");
    }
  };
  useEffect(() => {
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
  const handleSignUp = () => {
    router.push("/signup");
  };

  const handleGoogleSignIn = async () => {
    try {
      //   isLoading();

      const result = await signInWithPopup(auth, provider);

      const firebaseUser = result?.user;

      if (!firebaseUser) {
        addToast("Google login failed", "error");

        return;
      }
      console.log("Firebase user:", firebaseUser);

      const token = await firebaseUser.getIdToken();

      const user = {
        email: firebaseUser.email,
        displayName: firebaseUser.displayName,
      };
      console.log("User data:", user);

      const userData = {
        email: user.email || user.EmailID,
        name: user.name || user.username || user.displayName,
      };

      await setToken(token);

      googleLogin(userData);
      const successMessage = "Login Successful";
      addToast(successMessage, "success");

      router.replace("/");

      return true;
    } catch (error) {
      console.error("Google sign-in error:", error);

      addToast("Google sign-in failed", "error");
    }
  };

  const handleTwitterLogin = () => {
    console.log("Twitter login");
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
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
            placeholderTextColor="#777"
            autoCapitalize="none"
            keyboardType="email-address"
            style={styles.input}
          />

          <Text style={styles.label}>Password</Text>

          <TextInput
            value={password}
            onChangeText={setPassword}
            placeholder="Enter your password"
            placeholderTextColor="#777"
            secureTextEntry
            style={styles.input}
          />

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
            ]}
            onPress={handleGoogleSignIn}
          >
            <View style={styles.googleIcon}>
              <Text style={styles.googleG}>G</Text>
            </View>

            <Text style={styles.socialText}>Continue with Google</Text>
          </Pressable>

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
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#09090B",
  },

  container: {
    flex: 1,
    paddingHorizontal: 24,
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
    color: "#FFFFFF",
    fontSize: 28,
    fontWeight: "300",
    lineHeight: 30,
  },

  header: {
    marginTop: 35,
    marginBottom: 32,
  },

  title: {
    color: "#FFFFFF",
    fontSize: 32,
    fontWeight: "700",
    letterSpacing: -0.7,
  },

  subtitle: {
    color: "#8E8E93",
    fontSize: 15,
    marginTop: 9,
    lineHeight: 22,
  },

  form: {
    width: "100%",
  },

  label: {
    color: "#D7D7DA",
    fontSize: 13,
    fontWeight: "500",
    marginBottom: 8,
  },

  input: {
    width: "100%",
    height: 52,

    backgroundColor: "#151518",

    borderWidth: 1,
    borderColor: "#29292D",
    borderRadius: 13,

    paddingHorizontal: 15,

    color: "#FFFFFF",
    fontSize: 15,

    marginBottom: 18,

    outlineStyle: "none",
  },

  signInButton: {
    height: 52,

    borderRadius: 13,

    backgroundColor: "#FFFFFF",

    alignItems: "center",
    justifyContent: "center",

    marginTop: 4,
  },

  signInText: {
    color: "#09090B",
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
    color: "#77777D",
    fontSize: 14,
  },

  signupLink: {
    color: "#FFFFFF",
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
    backgroundColor: "#252529",
  },

  orText: {
    color: "#66666C",
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

    backgroundColor: "#151518",

    borderWidth: 1,
    borderColor: "#29292D",

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

  twitterIcon: {
    color: "#FFFFFF",
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
