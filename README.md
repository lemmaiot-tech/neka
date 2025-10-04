# LemmaIoT Cloud — Firebase Studio (Neka)

LemmaIoT Cloud presents this Firebase Studio starter as a lightweight project to help Nigerian businesses quickly request and host web projects. This app serves as an onboarding and request portal for common small‑business solutions — making it easier for SMEs in Nigeria to get online with tailored web apps.

Key ideas:
- Provide an easy form to request a custom project space (landing page, marketplace, POS, delivery platform, etc.).
- Validate requests and store them in Firestore for admin review.
- Integrate Firebase Auth and Firestore to manage user requests and dashboards.

Why this matters for Nigeria
- Low-friction way for local businesses to request digital solutions.
- Built to accelerate delivery of common business needs (POS, marketplace, booking, payments).
- Part of the LemmaIoT Cloud Solution family focused on practical, deployable tools for Nigerian SMEs.

Quick links (source)
- App entry / landing: [src/app/page.tsx](src/app/page.tsx)
- Request form component: [`HostingForm`](src/components/hosting-form.tsx)
- Firebase init & exports: [`db`](src/lib/firebase.ts) and [`auth`](src/lib/firebase.ts)
- Request validation & enums: [`ServiceRequestSchema`](src/lib/definitions.ts) and [`projectTypes`](src/lib/definitions.ts)
- This README: [README.md](README.md)

Features
- Request form for new project spaces with validation and subdomain checks.
- Uses Firebase Auth to associate requests with users and Firestore to persist requests.
- Predefined project types (POS, Marketplace, Booking, Delivery, Directory, Payment, Logistics, LMS, Static pages, Other).
- Admin and user dashboards (scaffolded via app routes under /dashboard and /admin).

How it works (high level)
1. A user fills the form on the landing page ([src/app/page.tsx](src/app/page.tsx)).  
2. The UI component [`HostingForm`](src/components/hosting-form.tsx) validates input using the schema in [`ServiceRequestSchema`](src/lib/definitions.ts) and ensures chosen subdomain availability.  
3. On submit the app writes the request to Firestore via [`db`](src/lib/firebase.ts) and tracks the user with [`auth`](src/lib/firebase.ts).  
4. Admins review and update status via the admin dashboard routes.

Getting started (developer)
1. Install deps:
   ```sh
   npm install
   ```
2. Local environment

   - Copy `.env.example` to `.env.local` and fill in your Firebase values and any server-side keys. Example:

     NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key
     NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_auth_domain
     NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
     NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_storage_bucket
     NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_messaging_sender_id
     NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id

     GEMINI_API_KEY=your_gemini_key  # server-only, keep in .env.local

3. Start dev server:
   ```sh
   npm run dev
   ```

Netlify deployment
- Build command: `npm run build`
- Publish directory: `.next`
- Add environment variables in Netlify UI (Site → Settings → Build & deploy → Environment):
  - NEXT_PUBLIC_FIREBASE_API_KEY
  - NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN
  - NEXT_PUBLIC_FIREBASE_PROJECT_ID
  - NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET
  - NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID
  - NEXT_PUBLIC_FIREBASE_APP_ID
  - GEMINI_API_KEY (server-side only)

Steps to add env vars on Netlify:
1. Open your site in Netlify.
2. Site settings → Build & deploy → Environment → Edit variables.
3. Add the keys above and paste values from your Firebase console and third-party providers.
4. Save and trigger a new deploy.

Serverless function for Gemini
- A Netlify Function `netlify/functions/gemini.js` is included to proxy requests to Gemini server-side using `GEMINI_API_KEY` so the key is never exposed client-side. Call it from your frontend at `/.netlify/functions/gemini`.

