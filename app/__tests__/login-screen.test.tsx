import React from "react";
import { jest } from "@jest/globals";
import { render, screen, fireEvent, waitFor } from "@testing-library/react-native";
import { LoginScreen } from "@/components/auth/login-screen";

// Mocks
jest.mock("expo-router", () => ({
  router: { replace: jest.fn() },
  useLocalSearchParams: () => ({}),
}));

jest.mock("@expo/vector-icons", () => {
  const { View } = require("react-native");
  return { Ionicons: View, MaterialIcons: View, FontAwesome: View, Feather: View };
});

jest.mock("expo-font", () => ({
  isLoaded: () => true,
  loadAsync: jest.fn(),
}));

jest.mock("../lib/app-config", () => ({
  APP_URL: "http://localhost",
  APP_ENV: "development",
}));

jest.mock("../lib/supabase", () => ({
  supabase: {
    auth: {
      signInWithPassword: jest.fn(),
      signUp: jest.fn(),
      resetPasswordForEmail: jest.fn(),
    },
  },
}));

jest.mock("../lib/auth-api", () => ({
  checkUsernameAvailability: jest.fn(),
  checkEmailAvailability: jest.fn(),
}));

// helpers to get mocks inside tests
const { supabase } = require("../lib/supabase");
const { checkUsernameAvailability, checkEmailAvailability } = require("../lib/auth-api");

// --- LOGIN TESTS ---

test("renders login screen with email and password fields", () => {
  render(<LoginScreen />);
  expect(screen.getByPlaceholderText("Enter your email")).toBeTruthy();
  expect(screen.getByPlaceholderText("Enter password")).toBeTruthy();
});

test("shows error when submitting with empty email", async () => {
  render(<LoginScreen />);
  fireEvent.press(screen.getByText("Continue"));
  expect(await screen.findByText("Please enter a valid email address.")).toBeTruthy();
});

test("shows error when submitting with empty password", async () => {
  render(<LoginScreen />);
  fireEvent.changeText(screen.getByPlaceholderText("Enter your email"), "test@example.com");
  fireEvent.press(screen.getByText("Continue"));
  expect(await screen.findByText("Invalid credentials.")).toBeTruthy();
});

test("logs in successfully with valid credentials", async () => {
  checkEmailAvailability.mockResolvedValue({ available: false, canResetPassword: true });
  supabase.auth.signInWithPassword.mockResolvedValue({ error: null });

  render(<LoginScreen />);
  fireEvent.changeText(screen.getByPlaceholderText("Enter your email"), "test@example.com");
  fireEvent.changeText(screen.getByPlaceholderText("Enter password"), "password123");
  fireEvent.press(screen.getByText("Continue"));

  await waitFor(() => {
    expect(supabase.auth.signInWithPassword).toHaveBeenCalledWith({
      email: "test@example.com",
      password: "password123",
    });
  });
});

test("shows error on invalid credentials", async () => {
  checkEmailAvailability.mockResolvedValue({ available: false, canResetPassword: true });
  supabase.auth.signInWithPassword.mockResolvedValue({ error: { message: "Invalid login" } });

  render(<LoginScreen />);
  fireEvent.changeText(screen.getByPlaceholderText("Enter your email"), "test@example.com");
  fireEvent.changeText(screen.getByPlaceholderText("Enter password"), "wrongpassword");
  fireEvent.press(screen.getByText("Continue"));

  expect(await screen.findByText("Invalid credentials.")).toBeTruthy();
});

// --- SIGNUP TESTS ---

test("can switch to signup mode", () => {
  render(<LoginScreen />);
  fireEvent.press(screen.getAllByText("Sign up")[0]);
  expect(screen.getByPlaceholderText("Enter your full name")).toBeTruthy();
});

test("shows error when signing up with missing full name", async () => {
  render(<LoginScreen />);
  fireEvent.press(screen.getAllByText("Sign up")[0]);
  fireEvent.changeText(screen.getByPlaceholderText("Enter your email"), "test@example.com");
  fireEvent.changeText(screen.getByPlaceholderText("Enter password"), "password123");
  fireEvent.changeText(screen.getByPlaceholderText("Re-enter password"), "password123");
  fireEvent.press(screen.getAllByText("Sign up")[1]); // [1] = submit button
  expect(await screen.findByText("Full name is required.")).toBeTruthy();
});

test("shows error when passwords do not match", async () => {
  checkUsernameAvailability.mockResolvedValue(true);
  render(<LoginScreen />);
  fireEvent.press(screen.getAllByText("Sign up")[0]);
  fireEvent.changeText(screen.getByPlaceholderText("Enter your full name"), "John Doe");
  fireEvent.changeText(screen.getByPlaceholderText("Choose a unique username"), "johndoe");
  fireEvent.changeText(screen.getByPlaceholderText("Enter your email"), "test@example.com");
  fireEvent.changeText(screen.getByPlaceholderText("Enter password"), "password123");
  fireEvent.changeText(screen.getByPlaceholderText("Re-enter password"), "different123");
  
  // wait for username check to finish before submitting
  await screen.findByText("Username is available.");
  
  fireEvent.press(screen.getAllByText("Sign up")[1]);
  expect(await screen.findByText("Passwords do not match.")).toBeTruthy();
});

// --- FORGOT PASSWORD TESTS ---

test("shows forgot password form when clicking forgot password", () => {
  render(<LoginScreen />);
  fireEvent.press(screen.getByText("Forgot password?"));
  expect(screen.getByText("Send reset link")).toBeTruthy();
});

test("shows error when submitting forgot password with invalid email", async () => {
  render(<LoginScreen />);
  fireEvent.press(screen.getByText("Forgot password?"));
  fireEvent.press(screen.getByText("Send reset link"));
  expect(await screen.findByText("Enter the email on your account first, then tap Forgot password.")).toBeTruthy();
});

test("can go back from forgot password to login", () => {
  render(<LoginScreen />);
  fireEvent.press(screen.getByText("Forgot password?"));
  fireEvent.press(screen.getByText("Back to log in"));
  expect(screen.getByText("Continue")).toBeTruthy();
});