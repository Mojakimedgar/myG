import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged,
  User as FirebaseUser,
  updateProfile
} from "firebase/auth";
import { auth } from "./firebase";
import { User, UserRole, CreateUserData } from "@/types/user";
import { createUserProfile, getUserProfile } from "./users";

export const signUp = async (email: string, password: string, displayName: string, role: UserRole) => {
  try {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    await updateProfile(userCredential.user, { displayName });
    
    // Create user profile in Firestore
    const userData: CreateUserData = {
      email,
      displayName,
      role,
      subscriptionTier: "free", // Default to free tier
    };
    
    await createUserProfile(userCredential.user.uid, userData);

    // Immediately sign the user out so they can log in explicitly afterwards
    await signOut(auth);
    
    return userCredential.user;
  } catch (error: any) {
    // Only surface a clear error when the email already exists
    if (error?.code === "auth/email-already-in-use") {
      // Preserve the original code so callers can branch on it
      error.message = "This email already has a MYG account. Please sign in instead of signing up.";
    }
    throw error;
  }
};

export const signIn = async (email: string, password: string) => {
  const userCredential = await signInWithEmailAndPassword(auth, email, password);
  return userCredential.user;
};

export const logOut = async () => {
  await signOut(auth);
};

export const getCurrentUser = (): FirebaseUser | null => {
  return auth.currentUser;
};

export const onAuthChange = (callback: (user: FirebaseUser | null) => void) => {
  return onAuthStateChanged(auth, callback);
};

export const getCurrentUserProfile = async (): Promise<User | null> => {
  const firebaseUser = getCurrentUser();
  if (!firebaseUser) return null;
  
  return await getUserProfile(firebaseUser.uid);
};
