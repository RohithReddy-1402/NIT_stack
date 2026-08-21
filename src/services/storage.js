import * as SecureStore from "expo-secure-store";
import { Platform } from "react-native";

export async function setToken(token) {
  if (Platform.OS === "web") {
    localStorage.setItem("authToken", token);
    return;
  }

  await SecureStore.setItemAsync("authToken", token);
}

export async function getToken() {
  if (Platform.OS === "web") {
    return localStorage.getItem("authToken");
  }

  return await SecureStore.getItemAsync("authToken");
}

export async function removeToken() {
  if (Platform.OS === "web") {
    localStorage.removeItem("authToken");
    return;
  }

  await SecureStore.deleteItemAsync("authToken");
}
