# Kid Profile CRUD Operations

This document describes the CRUD (Create, Read, Update, Delete) operations implemented for kid profiles in the ZoneWatch application.

## Database Structure

The application uses Firebase Firestore with the following structure:
- **Collection**: `myG`
- **Fields**: 
  - `Kid profiles` (string) - JSON stringified kid data
  - `Zones` (string) - JSON stringified zone data

## CRUD Operations

### 1. CREATE - Add Kid Profile
- **Component**: `AddKidModal`
- **Function**: `addKid(kidData: CreateKidData)`
- **Features**:
  - Modal form with validation
  - Required fields: name, age, location
  - Optional fields: avatar URL
  - Success/error toast notifications
  - Auto-refresh after successful creation

### 2. READ - View Kid Profiles
- **Function**: `getKids(): Promise<Kid[]>`
- **Features**:
  - Fetches all kid profiles from Firestore
  - Parses JSON data from "Kid profiles" field
  - Handles data conversion and error cases
  - Displays in KidCard components

### 3. UPDATE - Edit Kid Profile
- **Component**: `EditKidModal`
- **Function**: `updateKid(id: string, data: UpdateKidData)`
- **Features**:
  - Pre-populated form with current data
  - Editable fields: name, age, location, status, avatar
  - Status selection (safe, warning, alert)
  - Success/error toast notifications
  - Auto-refresh after successful update

### 4. DELETE - Remove Kid Profile
- **Component**: `DeleteKidDialog`
- **Function**: `deleteKid(id: string)`
- **Features**:
  - Confirmation dialog with warning
  - Clear indication of what will be deleted
  - Success/error toast notifications
  - Auto-refresh after successful deletion

## User Interface

### Add Kid Profile
- Click "Add Kid Profile" button
- Fill in the modal form
- Click "Add Kid Profile" to submit
- Get success alert on completion

### Edit Kid Profile
- Click "Edit" button on any kid card
- Modify the information in the modal
- Click "Update Profile" to save changes
- Get success alert on completion

### Delete Kid Profile
- Click "Delete" button on any kid card
- Confirm deletion in the alert dialog
- Get success alert on completion

### View Kid Profiles
- All kid profiles are automatically displayed
- Real-time data from Firestore
- Loading states and empty states handled

## Data Flow

1. **Create**: Form → Validation → Firestore → Toast → Refresh UI
2. **Read**: Firestore → Parse JSON → Display in UI
3. **Update**: Form → Validation → Firestore → Toast → Refresh UI
4. **Delete**: Confirmation → Firestore → Toast → Refresh UI

## Error Handling

- Form validation for required fields
- Try-catch blocks for all Firestore operations
- User-friendly error messages via toast notifications
- Console logging for debugging

## Toast Notifications

All operations provide feedback through toast notifications:
- Success messages for completed operations
- Error messages for failed operations
- Validation messages for form errors

## Components Structure

```
src/
├── components/
│   ├── AddKidModal.tsx      # Create operation
│   ├── EditKidModal.tsx     # Update operation
│   ├── DeleteKidDialog.tsx  # Delete operation
│   └── KidCard.tsx          # Display with actions
├── lib/
│   └── firestore.ts         # CRUD functions
├── types/
│   └── kids.ts              # Type definitions
└── pages/
    └── Index.tsx            # Main page with CRUD integration
```
