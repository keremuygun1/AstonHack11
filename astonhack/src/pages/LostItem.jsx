import { useState } from "react";
import { Link } from "react-router-dom";
import { db, collection, addDoc, serverTimestamp } from "../firebase";

function LostItem({ embedded = false }) {
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (submitting) return;

    const form = new FormData(event.target);

    const payload = {
      name: (form.get("name") || "").toString().trim(),
      description: (form.get("description") || "").toString().trim(),
      color: (form.get("color") || "").toString().trim(),
      location: (form.get("location") || "").toString().trim(),
      createdAt: serverTimestamp(),
      status: "open",
    };

    if (!payload.name) {
      alert("Please enter item name.");
      return;
    }

    try {
      setSubmitting(true);

      const docRef = await addDoc(collection(db, "lostItems"), payload);
      console.log("✅ Saved lost item:", docRef.id);

      event.target.reset();
      alert("Submitted ✅");
    } catch (err) {
      console.error(err);
      alert(err.message || "Something went wrong saving the lost item.");
    } finally {
      setSubmitting(false);
    }
  };

  const content = (
    <section className="form-card form-card--tall">
      <h1 className="headline">Report your lost item</h1>
      <p className="subhead">Tell us what you lost and where.</p>

      <form className="form" onSubmit={handleSubmit}>
        <label className="field">
          <span>Item name</span>
          <input type="text" name="name" placeholder="Enter item name" />
        </label>

        <label className="field">
          <span>Description</span>
          <input type="text" name="description" placeholder="Brief description" />
        </label>

        <label className="field">
          <span>Color</span>
          <input type="text" name="color" placeholder="Item color" />
        </label>

        <label className="field">
          <span>Lost location</span>
          <input type="text" name="location" placeholder="Where you lost it" />
        </label>

        <button className="btn btn-primary" type="submit" disabled={submitting}>
          {submitting ? "Submitting..." : "Submit details"}
        </button>
      </form>
    </section>
  );

  if (embedded) return content;

  return (
    <main className="page">
      <header className="topbar">
        <Link className="topbar-left" to="/">
          <span className="brand-dot" aria-hidden="true" />
          <span className="brand-name">Lost and Found</span>
        </Link>
        <Link className="btn btn-ghost" to="/signin">
          Sign in
        </Link>
      </header>

      {content}
    </main>
  );
}

export default LostItem;