# Bus Booking System Frontend

Static HTML, JavaScript, and Tailwind CSS frontend for the bus booking system.

## GitHub Pages deployment

The workflow in `.github/workflows/deploy-pages.yml` publishes the complete
frontend whenever a commit is pushed to `main`. It can also be started manually
from the repository's **Actions** tab.

In GitHub, open **Settings → Pages** and set **Source** to **GitHub Actions**.
After the workflow completes, its deployment summary contains the public URL.

The deployed frontend uses the backend URL configured in
`assets/js/core/config.js`.

## Project structure

```text
assets/
  css/                 Shared visual system
  images/backgrounds/  Local travel artwork
  js/core/             Configuration, API and authentication
  js/layouts/          Shared page layouts
  js/auth/             Authentication flows
  js/user/             Passenger booking experience
  js/admin/            Operations and management features
  js/driver/           Driver dashboard
pages/
  auth/                 Login and registration
  user/                 Search, booking, payment and account
  admin/                Staff and manager workspace
  driver/               Driver workspace
```
