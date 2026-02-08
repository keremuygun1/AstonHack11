# Backtrack

Backtrack is a web application that helps reunite people with misplaced belongings by allowing users to report items they’ve found or lost, attach photos, and pin precise locations on a map. Powered by AI, the system analyzes image and description similarity to intelligently detect matches between lost inquiries and found reports. The platform blends a clean, modern UI with fast report flows, a location picker map, and a profile area for managing reports. It is designed to be intuitive for everyday users while remaining extensible for advanced workflows like automated similarity detection, moderation, and notifications.

At its core, the app focuses on three goals:

1. **Speed** – report items in seconds, with camera or upload, plus a quick location pin.
2. **Clarity** – a structured report UI and consistent visual language across pages.
3. **Connection** – centralized reporting and potential matching of lost/found items.
 
 
## Features

1. **Landing Page & Navigation**

Hero section with strong call-to-action.

Auth flow integration that hides sign-in once the user has authenticated.

Profile and logout actions appear after authentication.

2. **Lost and Found Reporting**

Take photo button (camera capture).

Map-based location picker (click to drop a pin).

Submission state handling.

Lost Item report page mirrors the found workflow for consistency.

3. **Map Integration**

Full-page map view available via View map.

Embedded mini map for location selection inside the report flow.

Pin placement via click on the embedded map.

Map view uses Leaflet with OpenStreetMap tiles.

5. **User Profile**

Profile page layout with:

Profile photo

Username and email

Lists of reported lost and found items

Edit profile modal for updating user details.

6. **Match Notification Page**

Provides a detailed comparison of lost vs found items.

## Implementation
## Tech Stack
- JavaScript (React/Vite frontend)
- Python (backend utilities/scripts in backend/)
