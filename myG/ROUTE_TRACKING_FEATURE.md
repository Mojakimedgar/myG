# Route Tracking Feature Documentation

## Overview

The Route Tracking feature monitors a user's daily commute to specific locations (schools, workplaces, etc.) and provides intelligent alerts when routes deviate from established patterns. The system automatically detects route deviations and alerts trackers (parents/guardians), while continuing to track if the user is moving toward their destination.

## Key Features

### 1. **Route Recording**
- Automatically captures GPS points during a trip
- Stores route patterns indexed by:
  - User ID
  - Destination (Zone)
  - Day of week
  - Confidence score

### 2. **Real-Time Route Tracking**
- Monitors current location during trips
- Compares live path against recorded routes
- Calculates match percentage
- Estimates time to destination

### 3. **Intelligent Deviation Detection**
- Detects when user takes a different route
- Classifies deviations as:
  - **Minor** (< 100m off route)
  - **Moderate** (100-500m off route)
  - **Major** (> 500m off route)
- Checks if user is still moving toward destination

### 4. **Alert System**
- Notifies trackers of route deviations
- Distinguishes between:
  - Deviations while moving toward destination (low priority)
  - Deviations while moving away (high priority)
- Provides action options:
  - "Continue" - User is taking alternate but valid route
  - "Reroute" - Send new navigation instructions
  - "Investigate" - Potential safety concern

### 5. **Route Statistics & Analytics**
- Average distance and duration
- Most common day for trips
- Route confidence scores
- Deviation rates

## Architecture

### Types (`src/types/route.ts`)

```typescript
RoutePoint         // Single GPS coordinate with timestamp and speed
RecordedRoute      // Complete route pattern with metadata
RouteDeviation     // Detected deviation from recorded route
ActiveRoute        // Real-time tracking session
RouteAlert         // Notification to tracker
RouteStatistics    // Analytics for a route
```

### Core Libraries

#### `src/lib/route-tracking.ts`
Core algorithms for:
- Distance calculations (Haversine formula)
- Polyline encoding/decoding (for efficient storage)
- Route matching (comparing paths)
- Deviation detection
- Confidence scoring

**Key Functions:**
```typescript
calculateRouteDeviation()        // Find deviation from route
isMovingTowardDestination()      // Check if still heading to destination
calculateRouteMatchPercentage()  // How closely current path matches recorded route
estimateTimeToDestination()      // ETA calculation
createRecordedRoute()            // Save route pattern
calculateRouteStatistics()       // Generate analytics
```

#### `src/lib/route-firestore.ts`
Database operations:
- Save/retrieve recorded routes
- Store deviation records
- Create and manage alerts
- Track active routes in real-time

**Collections:**
- `routes_recorded` - Stored route patterns
- `routes_deviations` - Deviation events
- `routes_alerts` - Notifications to trackers
- `routes_active` - Current tracking sessions

### Hooks

#### `src/hooks/use-route-tracking.ts`
Main hook for implementing route tracking in components.

**Usage:**
```typescript
const {
  isTracking,
  currentPoints,
  matchedRoute,
  matchPercentage,
  activeRoute,
  currentDeviation,
  estTimeRemaining,
  estDistance,
  startTracking,
  stopTracking,
  recordRoute,
} = useRouteTracking({
  kidId: "child123",
  destinationId: "school_zone_456",
  destinationName: "Lincoln High School",
  destinationCoord: { latitude: 40.7128, longitude: -74.0060 },
  trackerId: "parent789",
  recordingInterval: 30000,        // Capture every 30 seconds
  deviationThreshold: 200,          // Alert if > 200m off route
  autoRecord: true,                 // Auto-save route when trip ends
  onDeviationDetected: (dev) => {
    // Handle deviation
  },
  onRouteMatched: (percentage) => {
    // Update UI with match %
  },
  onDestinationReached: () => {
    // Trip complete
  },
});
```

### Components

#### `src/components/RouteAlertsPanel.tsx`
Displays alerts for trackers.

**Sub-components:**
- `<RouteAlertsPanel>` - Shows unread route alerts
- `<RouteTrackingView>` - Current trip status
- `<RouteTrackingControls>` - Start/stop tracking buttons

**Usage:**
```tsx
<RouteAlertsPanel
  trackerId={parentId}
  autoRefresh={true}
  refreshInterval={5000}
  onAlertClick={(alert) => {
    // Handle alert click
  }}
/>
```

#### `src/components/RouteStatsDisplay.tsx`
Shows route history and statistics.

**Sub-components:**
- `<RouteStatsDisplay>` - Overview statistics
- `<RoutesGroupedByDay>` - Routes organized by weekday

**Usage:**
```tsx
<RouteStatsDisplay
  kidId={childId}
  destinationId={zoneId}
  destinationName="School"
/>
```

## Integration Guide

### 1. Add Route Tracking to a Trip

```tsx
import { useRouteTracking } from '@/hooks/use-route-tracking';
import { RouteAlertsPanel, RouteTrackingView } from '@/components/RouteAlertsPanel';

function TripTracking({ kidId, zone, parentId }) {
  const {
    isTracking,
    currentPoints,
    matchPercentage,
    activeRoute,
    estTimeRemaining,
    estDistance,
    startTracking,
    stopTracking,
  } = useRouteTracking({
    kidId,
    destinationId: zone.id,
    destinationName: zone.name,
    destinationCoord: {
      latitude: zone.latitude!,
      longitude: zone.longitude!,
    },
    trackerId: parentId,
  });

  return (
    <div>
      <button onClick={startTracking}>Start Tracking</button>
      <button onClick={stopTracking}>Stop Tracking</button>
      
      <RouteTrackingView
        activeRoute={activeRoute}
        matchPercentage={matchPercentage}
        estTimeRemaining={estTimeRemaining}
        estDistance={estDistance}
      />
    </div>
  );
}
```

### 2. Show Alerts to Tracker

```tsx
import { RouteAlertsPanel } from '@/components/RouteAlertsPanel';

function ParentDashboard({ parentId }) {
  return (
    <div>
      <RouteAlertsPanel
        trackerId={parentId}
        autoRefresh={true}
      />
    </div>
  );
}
```

### 3. Display Route Statistics

```tsx
import { RouteStatsDisplay, RoutesGroupedByDay } from '@/components/RouteStatsDisplay';

function RouteAnalytics({ kidId, zoneId, zoneName }) {
  return (
    <div className="space-y-6">
      <RouteStatsDisplay
        kidId={kidId}
        destinationId={zoneId}
        destinationName={zoneName}
      />
      
      <RoutesGroupedByDay
        kidId={kidId}
        destinationId={zoneId}
        destinationName={zoneName}
      />
    </div>
  );
}
```

## How It Works

### Route Learning Phase
1. User starts trip to a zone
2. GPS points are captured every 30 seconds
3. When destination is reached, route is saved
4. System calculates confidence score based on:
   - Data consistency
   - GPS accuracy
   - Speed patterns

### Active Tracking Phase
1. System loads best-matching recorded route for current day
2. Current location is compared against recorded route
3. Match percentage is calculated
4. If deviation > threshold:
   - Deviation is recorded
   - System checks if still moving toward destination
   - Alert is created with appropriate severity

### Alert & Action Phase
1. Tracker receives notification
2. Tracker reviews location and route details
3. Tracker selects action:
   - **Continue**: User is on valid alternate route
   - **Reroute**: Send corrected route to user
   - **Investigate**: Potential safety issue
4. Alert is marked as handled

## Thresholds & Configuration

```typescript
const DEVIATION_THRESHOLD_METERS = 200;      // When to alert
const MAJOR_DEVIATION_METERS = 500;           // Major severity threshold
const MINOR_DEVIATION_METERS = 100;           // Minor severity threshold
const ROUTE_POINT_INTERVAL = 30000;           // Capture every 30 seconds
const MIN_POINTS_FOR_ROUTE = 10;              // Minimum valid route
const DESTINATION_ARRIVAL_THRESHOLD = 100;   // Within 100m = arrived
```

Customize in `src/lib/route-tracking.ts`

## Data Structure Examples

### Recorded Route
```json
{
  "id": "route_kid123_zone456_1710864000000",
  "kidId": "kid123",
  "destinationId": "zone456",
  "destinationName": "Lincoln High School",
  "routePoints": [
    {
      "latitude": 40.7128,
      "longitude": -74.0060,
      "timestamp": "2024-03-20T08:00:00Z",
      "speed": 12.5,
      "accuracy": 8.2
    }
  ],
  "distance": 5200,
  "duration": 1200000,
  "dayOfWeek": 3,
  "recordedAt": "2024-03-20T08:20:00Z",
  "isActive": true,
  "avgSpeed": 4.33,
  "confidence": 0.92,
  "polylineEncoded": "..."
}
```

### Route Deviation Alert
```json
{
  "id": "deviation_kid123_1710864300000",
  "kidId": "kid123",
  "recordedRouteId": "route_kid123_zone456_1710864000000",
  "destinationId": "zone456",
  "currentLocation": {
    "latitude": 40.7150,
    "longitude": -74.0085,
    "timestamp": "2024-03-20T08:05:00Z"
  },
  "deviationDistance": 425,
  "deviationPercentage": 212.5,
  "timestamp": "2024-03-20T08:05:00Z",
  "severity": "major",
  "isResolved": false,
  "notificationSent": true
}
```

## Permissions & Privacy

The feature requires:
- **Geolocation API** permission to collect GPS data
- **Notifications API** permission to send alerts

Respects:
- Location privacy settings
- User consent for tracking
- Data retention policies

## Performance Considerations

### Optimization Techniques
1. **Polyline Encoding**: Routes compressed ~90% for storage
2. **Lazy Deviations**: Only calculated when points differ significantly
3. **Cached Statistics**: Pre-calculated and stored
4. **Efficient Matching**: Uses closest-point algorithm instead of full path comparison

### Database Indexes
Create these Firestore indexes for better performance:
```
Collection: routes_recorded
  Fields: (kidId, destinationId, recordedAt Descending)
  Fields: (kidId, destinationId, dayOfWeek, confidence Descending)

Collection: routes_deviations
  Fields: (kidId, isResolved, timestamp Descending)

Collection: routes_alerts
  Fields: (trackerId, read, timestamp Descending)
```

## Error Handling

The system gracefully handles:
- GPS unavailable
- Network connectivity loss
- Permission denials
- Invalid locations
- Database errors

All errors log to console and show user-friendly notifications.

## Future Enhancements

Potential improvements:
1. Machine learning for better deviation detection
2. Multi-leg routes (e.g., school → sports practice → home)
3. Route optimization suggestions
4. Traffic-aware ETA calculations
5. Shared route family tracking
6. Route safety scoring
7. Historical deviation patterns
8. Integration with mapping services for visual routes

## Troubleshooting

### Routes Not Being Recorded
- Ensure user has geolocation permission
- Check that at least 10 points are captured
- Verify user actually reaches the destination

### False Deviation Alerts
- Increase `deviationThreshold` if roads are complex
- Check GPS accuracy (poor signal can cause spikes)
- Adjust `confidence` threshold for route matching

### High Battery Usage
- Increase `recordingInterval` from 30s to 60s
- Disable high accuracy GPS when not needed
- Lower frequency of deviation checks

## API Reference

See inline documentation in:
- `src/lib/route-tracking.ts` - All utility functions
- `src/lib/route-firestore.ts` - All database operations
- `src/hooks/use-route-tracking.ts` - Hook configuration
- `src/types/route.ts` - All type definitions
