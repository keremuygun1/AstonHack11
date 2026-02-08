import { useEffect,useRef, useState } from "react";
import { Link } from "react-router-dom";
import { db,
  collection, 
  addDoc, 
  serverTimestamp} from "../firebase";

  import api from './api.js'

function FoundItem({ embedded = false }) {
  const [photoPreviews, setPhotoPreviews] = useState([]);
  const [files, setFiles] = useState([]); // actual File objects to upload
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [cameraError, setCameraError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [pickedLocation, setPickedLocation] = useState(null);
  const [verdict, setVerdict] = useState(null);
  const [matchError, setMatchError] = useState("");

  const uploadInputRef = useRef(null);
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);

  //listener for the picker
  useEffect(() => {
    function onMessage(event) {
      const data = event.data;

      // only react to messages from your map picker
      if (data?.type === "map:pin") {
        // REPLACE stored location with the new one (no mutation)
        setPickedLocation({ lat: data.lat, lng: data.lng });
      }
    }

    window.addEventListener("message", onMessage);
    return () => window.removeEventListener("message", onMessage);
  }, []);
    
  // Cleanup object URLs + stop camera stream on unmount
  useEffect(() => {
    return () => {
      photoPreviews.forEach((url) => URL.revokeObjectURL(url));
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
        streamRef.current = null;
      }
    };
  }, [photoPreviews]);

  // Attach stream to video element when opening camera
  useEffect(() => {
    if (isCameraOpen && videoRef.current && streamRef.current) {
      videoRef.current.srcObject = streamRef.current;
    }
  }, [isCameraOpen]);

  const handlePhotoChange = (event) => {
    const selected = Array.from(event.target.files || []);
    // revoke old previews
    photoPreviews.forEach((url) => URL.revokeObjectURL(url));

    setFiles(selected);
    setPhotoPreviews(selected.map((file) => URL.createObjectURL(file)));
  };

  const openCamera = async () => {
    setCameraError("");
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { ideal: "environment" } },
        audio: false,
      });
      streamRef.current = stream;
      setIsCameraOpen(true);
    } catch (error) {
      setCameraError("Camera access was blocked or unavailable.");
    }
  };

  const closeCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    setIsCameraOpen(false);
  };

  const capturePhoto = () => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) return;

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const context = canvas.getContext("2d");
    if (!context) return;

    context.drawImage(video, 0, 0, canvas.width, canvas.height);

    canvas.toBlob(
      (blob) => {
        if (!blob) return;
        const file = new File([blob], `camera-${Date.now()}.jpg`, { type: "image/jpeg" });

        // revoke old previews
        photoPreviews.forEach((url) => URL.revokeObjectURL(url));

        setFiles([file]);
        setPhotoPreviews([URL.createObjectURL(file)]);
        closeCamera();
      },
      "image/jpeg",
      0.92
    );
  };

  async function uploadToImgbb(file) {
    const apiKey = import.meta.env.VITE_IMAGEBB_API_KEY;
    if (!apiKey) throw new Error("Missing VITE_IMGBB_API_KEY in .env");

    const data = new FormData();
    data.append("image", file);

    const res = await fetch(`https://api.imgbb.com/1/upload?key=${apiKey}`, {
      method: "POST",
      body: data,
    });

    const json = await res.json();
    if (!json.success) {
      throw new Error(json?.error?.message || "ImgBB upload failed");
    }
    return json.data.url;
  }

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (submitting) return;

    const form = new FormData(event.target);
    const name = (form.get("name") || "").toString().trim();

    if (!name) {
  alert("Please enter item name");
  return;
}
    if (files.length === 0) {
      alert("Please add a photo (upload or take one).");
      return;
    }

    try {
      setSubmitting(true);

      console.log("pickedLocation:", pickedLocation);

      if (!pickedLocation || pickedLocation.lat == null || pickedLocation.lng == null) {
        alert("Please choose a location");
        return;
      }

      console.log(pickedLocation.lat)


      // Upload first photo for MVP
      const imageUrl = await uploadToImgbb(files[0]);

      // Save Firestore doc
      const payload = {
        name,  
        imageUrl,
        lat: pickedLocation.lat,
        lng: pickedLocation.lng,
        createdAt: serverTimestamp(),
        status: "open",
      };

      const docRef = await addDoc(collection(db, "foundItems"), payload);

      setMatchError("");
      const res = await api.post("/match", { itemId: docRef.id });
      console.log("match verdict:", res.data);
      setVerdict(res.data);

      console.log("✅ Saved found item:", docRef.id, imageUrl);

      // Optional: clear form
      event.target.reset();
      photoPreviews.forEach((url) => URL.revokeObjectURL(url));
      setPhotoPreviews([]);
      setFiles([]);
    } catch (err) {
      console.error(err);
      alert(err.message || "Something went wrong uploading the image.");
    } finally {
      setSubmitting(false);
    }
  };

  const content = (
    <section className="form-card">
      <h1 className="headline">Report found item</h1>
      <p className="subhead">Share a photo and where you found it.</p>

      <form className="form" onSubmit={handleSubmit}>
         <label className="field">
          <span>Item name</span>
          <input type="text" name="name" placeholder="Enter item name" />
        </label>
        <label className="field">
          <span>Item photo</span>
          <div className="photo-actions">
            <button
              className="btn btn-secondary btn-camera"
              type="button"
              onClick={() => uploadInputRef.current?.click()}
              disabled={submitting}
            >
              Upload photo
            </button>
            <button
              className="btn btn-secondary btn-camera"
              type="button"
              onClick={openCamera}
              disabled={submitting}
            >
              Take photo
            </button>

            <input
              ref={uploadInputRef}
              className="file-input file-input--hidden"
              type="file"
              accept="image/*"
              name="image"
              onChange={handlePhotoChange}
            />
          </div>
        </label>


        {cameraError && <p className="camera-error">{cameraError}</p>}

        {photoPreviews.length > 0 && (
          <div className="preview-grid" aria-live="polite">
            {photoPreviews.map((url, index) => (
              <div className="preview" key={url}>
                <img src={url} alt={`Selected item ${index + 1}`} />
              </div>
            ))}
          </div>
        )}

        {isCameraOpen && (
          <div className="camera-overlay" role="dialog" aria-modal="true">
            <div className="camera-card">
              <div className="camera-header">
                <span>Take a photo</span>
                <button className="btn btn-ghost" type="button" onClick={closeCamera}>
                  Close
                </button>
              </div>
              <video ref={videoRef} className="camera-video" autoPlay playsInline />
              <canvas ref={canvasRef} className="camera-canvas" />
              <div className="camera-actions">
                <button className="btn btn-secondary" type="button" onClick={closeCamera}>
                  Cancel
                </button>
                <button className="btn btn-primary" type="button" onClick={capturePhoto}>
                  Capture
                </button>
              </div>
            </div>
          </div>
        )}
        <div className="field">
          <span>Found location</span>
          <div className="map-embed">
            <iframe
              title="Select location"
              src="/maps/picker.html"
              loading="lazy"
              referrerPolicy="no-referrer"
            />
          </div>
        </div>
        <button className="btn btn-primary report-submit" type="submit" disabled={submitting}>
          {submitting ? "Submitting..." : "Submit report"}
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

export default FoundItem;