// lostLocationsFirebase.js
import { collection, getDocs } from "firebase/firestore";
import { db } from "../../src/firebase";

export async function getLocations() {
  const snap = await getDocs(collection(db, "foundItems"));

  return snap.docs
    .map((d) => {
      const data = d.data();
      const lat = data.lat;
      const lng = data.lng;

      if (typeof lat === "number" && typeof lng === "number") {
        return { id: d.id, lat, lng };
      }

      return null; // skip docs without valid coords
    })
    .filter(Boolean);
}
