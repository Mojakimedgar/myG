// ADD THIS PART BELOW: This fixes the "No matching export" error
// This is a placeholder function so your NavBar doesn't crash.
export const subscribeActivity = (callback) => {
    console.log("Subscribed to activities");
    // This is where your real-time socket or API logic would eventually go
    return () => console.log("Unsubscribed");
};
