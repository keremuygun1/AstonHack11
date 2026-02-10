import { useEffect, useState } from "react";
import { doc, getDoc } from "firebase/firestore";
import { db } from "../firebase"; // adjust path to your firebase config export
import './MatchResult.css'

export default function MatchResult({ result, onClose }) {
  console.log("result:",result)
  const decision = result?.decision;
  const foundId = result?.foundId;
  const lostId = result?.lostId;
  const matched = result?.matched

  const [loading, setLoading] = useState(true);
  const [foundItem, setFoundItem] = useState(null);
  const [lostItem, setLostItem] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;

    const run = async () => {
      try {
        setLoading(true);
        setError("");

        if (!foundId) throw new Error("Missing found item id.");

        const foundSnap = await getDoc(doc(db, "foundItems", foundId));
        if (!foundSnap.exists()) throw new Error("Found item not found in DB.");
        const foundData = { id: foundSnap.id, ...foundSnap.data() };

        let lostData = null;
        if (lostId) {
          console.log("Fetching lost doc:", lostId);
          const lostSnap = await getDoc(doc(db, "lostItems", lostId));
          console.log("lost exists:", lostSnap.exists());
          if (lostSnap.exists()) lostData = { id: lostSnap.id, ...lostSnap.data() };
        }

        if (!cancelled) {
          setFoundItem(foundData);
          setLostItem(lostData);
          console.log("lostItem data:", lostData);
        }
      } catch (e) {
        if (!cancelled) setError(e?.message || "Failed to load match result.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    run();
    return () => {
      cancelled = true;
    };
  }, [foundId, lostId]);

  const isMatch = decision === "match";
  const isNeedsReview = decision === "needs_review";
  const showNotFound = decision === "no_match" || isNeedsReview;

  // Adjust these field names to your schema:
  const foundImageUrl =
    foundItem?.imageUrl;

  const lostDescription =
    lostItem?.description;

  return (
    <div>
      {loading ? (
        <p>Loading result…</p>
      ) : error ? (
        <>
          <h2>Something went wrong</h2>
          <p>{error}</p>
          <button type="button" className="btn btn-primary" onClick={onClose}>
            Close
          </button>
        </>
            ) : (
              <div className="match-result">
                <div className="match-result__header">
                  <div>
                    <h2 className="match-result__title">
                      {isMatch ? "It’s a match!" : isNeedsReview ? "Needs review" : "Not found"}
                    </h2>
                    <p className="match-result__subtitle">
                      {isMatch
                        ? "We found a matching lost-item report."
                        : isNeedsReview
                        ? "We found possible candidates, but a human check is needed."
                        : "No confident match was found."}
                    </p>
                  </div>
      
                  <span className={`match-result__badge match-result__badge--${decision}`}>
                    {isMatch ? "MATCH" : isNeedsReview ? "REVIEW" : "NO MATCH"}
                  </span>
                </div>
      
                <div className="match-result__grid">
                  <div className="match-result__media">
                    {foundImageUrl ? (
                      <img className="match-result__img" src={foundImageUrl} alt="Found item" />
                    ) : (
                      <div className="match-result__imgPlaceholder">No image</div>
                    )}
                  </div>
      
                  <div className="match-result__body">
                    <div className="match-result__section">
                      <h3 className="match-result__sectionTitle">Lost item description</h3>
                      <p className="match-result__desc">{lostDescription || "No description available."}</p>
                    </div>
      
                    <div className="match-result__actions">
                      <button type="button" className="btn btn-primary" onClick={onClose}>
                        Close
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}      
    </div>
  );
}
