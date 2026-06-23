# MYG - Personal Safety and Monitoring Platform

MYG is a personal safety and monitoring web application designed to help individuals and families stay connected, monitored, and protected in real time.

## What is MYG?

The name MYG represents:
- **My Guy** - For monitoring male family members or friends
- **My Girl** - For monitoring female family members or friends  
- **My Guardian** - The trusted person watching over you
- **My Guide** - Your digital safety companion

In essence, MYG acts as a **digital guardian** — a trusted layer that watches over users and helps coordinate assistance when needed.

## Features

### 🔐 User Authentication & Roles

- **Primary User**: Individuals being monitored who can confirm their safety status
- **Guardian (MYG)**: Parents, partners, friends, or trusted contacts who monitor others
- **System**: Automated platform that tracks movement, detects zone breaches, and manages notifications

### 🤝 MYG Linking (Trust Setup)

- Primary users can invite guardians via email
- Guardians receive and accept invitations
- Trust relationships are established with consent
- One primary user can have multiple MYGs (based on subscription tier)

### 🗺️ Safe Zones (Geo-Fencing)

- Guardians create safe zones (home, school, work, custom)
- Zones can be grouped and clustered for easier management
- Each zone includes:
  - Name and address
  - Radius (in meters)
  - Active hours (optional)
  - Days of week (optional)
- Automatic monitoring when users exit safe zones

### 📍 Location Monitoring

- Live location tracking when online
- Cached location when offline
- Automatic sync once connectivity returns
- Offline support ensures continuity in rural or low-data areas

### ⚠️ Safety Check Pop-Up (Critical Feature)

Before any emergency escalation:
- MYG sends a "Are you safe?" notification
- User can respond:
  - ✅ **I am safe** - Monitoring continues
  - 🆘 **I need help** - Guardians are immediately notified
  - ⏱️ **No response** - Escalation begins after timeout

This prevents false alarms while still prioritizing safety.

### 📊 Escalation Logic

1. **User confirms safe** → Monitoring continues normally
2. **User requests help** → Guardians are immediately notified
3. **No response within timeout** → Escalation begins:
   - Guardian alerts
   - Emergency contacts notified
   - Integration with Salema (future phase)

### 🔔 Alerts & Notifications

Notifications are triggered when:
- Safe zone is breached
- Safety check is ignored
- Help is requested
- All alerts are logged for review

### 💳 Subscription Model

**Free Tier:**
- Limited safe zones (3 zones)
- Manual safety checks
- Basic notifications
- 1 MYG relationship

**Premium Tier:**
- Unlimited safe zones
- Multiple MYGs
- Priority notifications
- Extended history
- Advanced features

## Technology Stack

- **Frontend**: React 18 + TypeScript
- **Build Tool**: Vite
- **UI Components**: shadcn/ui (Radix UI)
- **Backend**: Firebase (Authentication + Firestore)
- **Styling**: Tailwind CSS
- **State Management**: React Query (TanStack Query)
- **Routing**: React Router v6

## Getting Started

### Prerequisites

- Node.js 20.x
- Firebase project with Authentication and Firestore enabled

### Installation

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```

3. Set up environment variables in `.env`:
   ```env
   VITE_FIREBASE_API_KEY=your_api_key
   VITE_FIREBASE_AUTH_DOMAIN=your_auth_domain
   VITE_FIREBASE_PROJECT_ID=your_project_id
   VITE_FIREBASE_STORAGE_BUCKET=your_storage_bucket
   VITE_FIREBASE_MESSAGING_SENDER_ID=your_messaging_sender_id
   VITE_FIREBASE_APP_ID=your_app_id
   ```

4. Start the development server:
   ```bash
   npm run dev
   ```

5. Build for production:
   ```bash
   npm run build
   ```

## Project Structure

```
src/
├── components/
│   ├── auth/           # Authentication components
│   ├── guards/         # Route guards and safety check components
│   ├── myg/            # MYG linking components
│   ├── safety/         # Safety check popups
│   └── ui/             # Reusable UI components
├── lib/
│   ├── auth.ts         # Authentication service
│   ├── users.ts        # User management
│   ├── myg-linking.ts  # Trust relationship management
│   ├── safety-check.ts # Safety check system
│   ├── firestore.ts    # Firestore CRUD operations
│   ├── offline.ts      # Offline support
│   └── subscription.ts # Subscription tier logic
├── pages/
│   ├── Auth.tsx        # Authentication page
│   ├── Index.tsx       # Main dashboard
│   └── About.tsx       # About page
└── types/
    ├── user.ts         # User type definitions
    ├── safety-check.ts # Safety check types
    └── zone.ts         # Zone type definitions
```

## User Flow

1. **User Login**: User logs into MYG web app
2. **Role Selection**: User chooses Primary User or Guardian
3. **MYG Linking**: Primary user invites guardian(s)
4. **Safe Zone Setup**: Guardian creates and manages safe zones
5. **Monitoring Begins**: System tracks location and zone status
6. **Trigger Event**: User exits safe zone or guardian initiates check
7. **Safety Confirmation**: User receives "Are you safe?" pop-up
8. **Decision Point**: 
   - Safe → no action
   - Help needed → guardians alerted
   - No response → escalation
9. **Resolution**: Incident closed or escalated further

## Offline Support

MYG includes comprehensive offline support:
- Location data cached locally when offline
- Alerts queued for when connectivity returns
- Automatic sync once online
- Firebase offline persistence enabled
- Network status monitoring

## Security & Privacy

- Users control who monitors them
- Guardians see limited information
- All data encrypted via Firebase
- No unauthorised tracking
- MYG prioritises trust and consent

## Future Plans

- Integration into the Salema ecosystem
- Mobile app development
- Advanced analytics and reporting
- Emergency services integration
- Enhanced offline capabilities

## License

Private - All rights reserved

## Support

For support and questions, please contact the development team.
