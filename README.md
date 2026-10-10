# NIT Stack

NIT Stack is a mobile app built for NIT Kurukshetra students to get their academic
and campus life handled in one place — previous year question papers, syllabus,
attendance tracking, a campus forum, and placement/internship opportunities.

> This is a mobile app (Android/iOS), built with Expo and React Native. There is no
> web product — any web-related packages in this repo exist only to support Expo's
> tooling, not to ship a website.

## Features

### Previous year question papers
- Browse and search previous year question papers by branch, semester, and subject
- Download papers for offline access, with multiple download/share options
- Student-submitted papers go through an admin verification flow before going live
- Bookmark papers to a personal "saved" list

### Syllabus
- Browse syllabus by course and subject
- Per-subject detail pages with structured topic breakdowns

### Attendance tracker
- Set up a personal timetable once and track attendance per subject from then on
- Daily attendance marking with a quick-access floating action button
- Per-subject stats and a calendar view to see attendance history at a glance
- Local reminders/notifications so you don't forget to mark attendance

### Campus forum
- Reddit-style community forum scoped to campus communities
- Create posts with rich text, images, and math rendering
- Nested comments, voting, sorting, and search
- Interview experience and on-campus/off-campus (OA) posts go through admin
  approval before appearing publicly
- Save posts, report content, and moderate communities you manage

### Opportunities (placements & internships)
- Browse internship, placement, and other opportunity postings with filters
- Maintain a career profile and resume to apply faster
- Track your own applications and their status
- Get notified about new postings and deadlines
- Admins can create, edit, and moderate opportunity listings from an in-app
  admin dashboard

### Account & personalization
- Email/password and Google sign-in, with email verification and password reset
- Light/dark theme support across the entire app
- Push and local notification preferences
- Profile management, including the career profile used for opportunities

### Other
- About, contact, contribute, donate, privacy policy, and tech stack info pages
- Toast-based in-app notifications and skeleton loading states for a smoother feel

## Tech stack

- **Framework:** [Expo](https://expo.dev) (SDK 57) + [React Native](https://reactnative.dev) 0.86
- **Routing:** Expo Router (file-based routing, typed routes)
- **Language:** JavaScript/JSX with TypeScript for select modules
- **UI/Animation:** React Native Reanimated, React Native Gesture Handler, Expo Blur/Glass Effect, Lucide icons
- **Auth & backend services:** Firebase, Google Sign-In, Apple Authentication, JWT
- **Rich content:** TenTap editor, react-native-render-html (rich text, math, and markdown rendering in the forum)
- **Device/native APIs:** Expo File System, Document Picker, Image Picker, Image Manipulator, Notifications, Secure Store, Sharing, Print
- **Search:** Fuse.js for fuzzy search (papers, opportunities, forum)
- **State & data fetching:** React hooks and context (no external state library)
- **Build & delivery:** EAS Build/Update, expo-build-properties
- **Tooling:** ESLint, TypeScript

## Getting started

1. Install dependencies

   ```bash
   npm install
   ```

2. Start the app

   ```bash
   npx expo start
   ```

3. Open it on a device or emulator

   ```bash
   npm run android   # Android
   npm run ios       # iOS
   ```

A development build or Expo Go can be used for local testing. Production builds
are shipped through EAS (`eas.json`).

## Project structure

```
src/
  app/            Screens, grouped by feature (expo-router file-based routing)
  components/     Reusable UI components, grouped by feature
  contexts/       Auth, theme, and toast context providers
  hooks/          Feature-specific data/state hooks
  services/       Firebase and backend API integrations
  constants/      Shared constant values
  utils/          Small shared helper functions
plugins/          Custom Expo config plugins
```
