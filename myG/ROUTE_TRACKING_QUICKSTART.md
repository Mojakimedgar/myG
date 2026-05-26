# Route Tracking Feature - Quick Start Guide

## What You Got

A complete, production-ready route tracking system that monitors user routes and alerts on unexpected deviations while tracking if they're still moving toward their destination.

## Files Created

### Type Definitions
- **`src/types/route.ts`** - All TypeScript interfaces for route tracking

### Core Libraries
- **`src/lib/route-tracking.ts`** - Route algorithms (matching, deviation, stats)
- **`src/lib/route-firestore.ts`** - Database operations (CRUD for routes & alerts)

### Hooks
- **`src/hooks/use-route-tracking.ts`** - Main hook for implementing tracking

### Components
- **`src/components/RouteAlertsPanel.tsx`** - Alert display & tracking controls
- **`src/components/RouteStatsDisplay.tsx`** - Route history & statistics

### Pages
- **`src/pages/RouteTracking.tsx`** - Complete example implementation

### Documentation
- **`ROUTE_TRACKING_FEATURE.md`** - Comprehensive documentation
- **`ROUTE_TRACKING_QUICKSTART.md`** - This file

---

## Basic Implementation (5 minutes)

### 1. Add to a Tracker/Parent Page

```tsx
import { RouteAlertsPanel } from '@/components/RouteAlertsPanel';

export function ParentDashboard() {
  return (
    <RouteAlertsPanel
      trackerId={currentUser.id}
      autoRefresh={true}
    />
  );
}
```

### 2. Add to a Kid's Device

```tsx
import { useRouteTracking } from '@/hooks/use-route-tracking';
import { RouteTrackingControls, RouteTrackingView } from '@/components/RouteAlertsPanel';

export function KidTrackingPage({ kidId, zone }) {
  const { isTracking, startTracking, stopTracking, ...state } = useRouteTracking({
    kidId,
    destinationId: zone.id,
    destinationName: zone.name,
    destinationCoord: {
      latitude: zone.latitude,
      longitude: zone.longitude,
    },
    trackerId: parentId,
  });

  return (
    <div>
      <RouteTrackingControls
        isTracking={isTracking}
        destinationName={zone.name}
        onStart={startTracking}
        onStop={stopTracking}
      />
      <RouteTrackingView {...state} />
    </div>
  );
}
```

### 3. Show Route History

```tsx
import { RouteStatsDisplay } from '@/components/RouteStatsDisplay';

export function RouteHistory({ kidId, zone }) {
  return (
    <RouteStatsDisplay
      kidId={kidId}
      destinationId={zone.id}
      destinationName={zone.name}
    />
  );
}
```

---

## How It Works (Step by Step)

```
┌─────────────────────────────────────────────────────────┐
│                    USER STARTS TRIP                      │
│              Click "Start Tracking" button               │
└──────────────────────┬──────────────────────────────────┘
                       │
        ┌──────────────▼──────────────┐
        │  useRouteTracking Hook      │
        │  - Starts GPS watch         │
        │  - Collects location every  │
        │    30 seconds               │
        └──────────────┬──────────────┘
                       │
        ┌──────────────▼──────────────┐
        │  Every Location Point       │
        │  - Load recorded routes     │
        │  - Compare with live path   │
        │  - Calculate match %        │
        └──────────────┬──────────────┘
                       │
        ┌──────────────▼──────────────┐
        │  Deviation Check            │
        │  - Off route > 200m?        │
        │  - Still moving toward      │
        │    destination?             │
        └──────────────┬──────────────┘
                       │
        ┌──────────────▼──────────────┐
        │  Create Alert if Needed     │
        │  - Save deviation record    │
        │  - Create alert for tracker │
        │  - Show notification        │
        └──────────────┬──────────────┘
                       │
        ┌──────────────▼──────────────┐
        │  Destination Reached?       │
        │  - Within 100m?             │
        │  - Yes: Save route pattern  │
        │  - No: Continue tracking    │
        └─────────────────────────────┘
```

---

## Key Functions

### Start Tracking
```typescript
const { startTracking } = useRouteTracking({...});

// Starts GPS monitoring and saves location every 30 seconds
await startTracking();
```

### Stop Tracking
```typescript
const { stopTracking } = useRouteTracking({...});

// Stops GPS monitoring and marks trip as complete
await stopTracking();
```

### Record Route
```typescript
const { recordRoute } = useRouteTracking({...});

// Saves current trip as a new route pattern
// Called automatically when destination is reached (if autoRecord=true)
recordRoute();
```

---

## Configuration Options

### useRouteTracking Parameters

| Parameter | Default | Description |
|-----------|---------|-------------|
| `kidId` | - | User ID being tracked |
| `destinationId` | - | Zone ID (e.g., school) |
| `destinationName` | - | Display name |
| `destinationCoord` | - | {latitude, longitude} |
| `trackerId` | - | Parent user ID for alerts |
| `recordingInterval` | 30000ms | How often to capture location |
| `deviationThreshold` | 200m | Alert if > this far off route |
| `autoRecord` | true | Save route when trip ends |
| `onDeviationDetected` | - | Callback when off-route |
| `onRouteMatched` | - | Callback with match % |
| `onDestinationReached` | - | Callback when arrived |

---

## Alert Severity Levels

| Severity | Distance | Situation |
|----------|----------|-----------|
| **Minor** | < 100m | Slight detour, likely on track |
| **Moderate** | 100-500m | Significant detour but acceptable |
| **Major** | > 500m | **Major detour - requires attention** |

Alerts are only sent if:
- Deviation is > 200m AND
- User is NOT moving toward destination (major concern)

---

## Firebase Collections

The system creates these Firestore collections:

### `routes_recorded`
Stores learned route patterns
```
- kidId
- destinationId
- dayOfWeek
- routePoints[] (GPS coordinates)
- distance
- duration
- avgSpeed
- confidence (0-1)
```

### `routes_deviations`
Logs whenever user goes off-route
```
- kidId
- recordedRouteId
- currentLocation
- deviationDistance
- severity
- isResolved
```

### `routes_alerts`
Notifications sent to trackers
```
- trackerId
- kidId
- message
- severity
- read
- action ("reroute" | "continue" | "investigate")
```

### `routes_active`
Real-time tracking sessions
```
- kidId
- destinationId
- startTime
- currentLocation
- deviations[]
- isActive
```

---

## Troubleshooting

### Tracking won't start
- **Fix**: Check browser location permission
- **Fix**: Use HTTPS (geolocation requires secure context)
- **Fix**: Check browser console for errors

### No alerts being sent
- **Fix**: Check `deviationThreshold` setting (default 200m)
- **Fix**: Make sure routes have been recorded for the destination
- **Fix**: Verify user is actually moving toward destination

### Routes not recording
- **Fix**: Need at least 10 GPS points (≈5 minutes)
- **Fix**: User must reach destination (within 100m)
- **Fix**: Check Firestore write permissions

### High battery usage
- **Fix**: Increase `recordingInterval` to 60000ms
- **Fix**: Can disable during idle hours

---

## Customization Ideas

### Change Deviation Threshold
```typescript
// In useRouteTracking call:
deviationThreshold: 300, // More lenient (300m)
```

### Change Recording Interval
```typescript
// Capture every 60 seconds instead of 30
recordingInterval: 60000,
```

### Custom Alert Message
```typescript
// In route-tracking.ts, customize the message when creating alert
const alertMessage = `User is ${Math.round(deviation)}m off route`;
```

### Add Safety Zones
- Modify to send alert if user exits a safe zone
- Add whitelist of "approved alternate routes"
- Create time-of-day specific routes

---

## Integration Checklist

- [ ] Created Firestore collections (see above)
- [ ] Added types to TypeScript project
- [ ] Imported useRouteTracking hook in tracking page
- [ ] Added RouteAlertsPanel to parent/tracker dashboard
- [ ] Tested location permissions in browser
- [ ] Recorded at least one route for testing
- [ ] Verified alerts appear when deviating
- [ ] Set appropriate deviation thresholds for your use case
- [ ] Customized alert messages if needed
- [ ] Created Firestore security rules for collections

---

## Firestore Security Rules

Add these rules to protect the route collections:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Allow users to access their own routes
    match /routes_recorded/{document=**} {
      allow read, write: if request.auth.uid == resource.data.kidId 
                            || request.auth.uid == resource.data.createdBy;
    }
    
    // Allow access to own deviations
    match /routes_deviations/{document=**} {
      allow read: if request.auth.uid == resource.data.kidId 
                     || request.auth.uid in resource.data.trackerIds;
      allow write: if request.auth.uid == resource.data.kidId;
    }
    
    // Allow trackers to read their own alerts
    match /routes_alerts/{document=**} {
      allow read: if request.auth.uid == resource.data.trackerId;
      allow write: if request.auth.uid == resource.data.trackerId;
    }
    
    // Active routes
    match /routes_active/{document=**} {
      allow read: if request.auth.uid == resource.data.kidId 
                     || request.auth.uid == resource.data.trackerId;
      allow write: if request.auth.uid == resource.data.kidId;
    }
  }
}
```

---

## Next Steps

1. **Test with example page**: Navigate to `/route-tracking` to see everything in action
2. **Read full docs**: See `ROUTE_TRACKING_FEATURE.md` for complete reference
3. **Integrate components**: Add to your existing pages
4. **Customize thresholds**: Adjust for your use case
5. **Set Firestore rules**: Secure your collections

---

## Performance Tips

- GPS is heavy on battery: increase `recordingInterval` for background tracking
- Polyline encoding reduces data storage by 90%
- Use `confidence` score to filter low-quality routes
- Pre-calculate statistics to speed up displays

---

## Questions?

Refer to `ROUTE_TRACKING_FEATURE.md` for:
- Complete API documentation
- Advanced configuration
- Architecture details
- Performance optimization
