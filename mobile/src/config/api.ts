import { Platform } from 'react-native';

// For Android emulator, 10.0.2.2 points to host's localhost.
// For iOS simulator, localhost works.
// Replace with your local LAN IP (e.g. 192.168.1.X) to test on physical devices via Expo Go.
export const API_URL = 'http://192.168.18.10:8000/api';
