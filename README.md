# Bus Booking System Frontend

Static HTML, JavaScript, and Tailwind CSS frontend for the bus booking system.

## GitHub Pages deployment

The workflow in `.github/workflows/deploy-pages.yml` publishes the complete
frontend whenever a commit is pushed to `main`. It can also be started manually
from the repository's **Actions** tab.

In GitHub, open **Settings → Pages** and set **Source** to **GitHub Actions**.
After the workflow completes, its deployment summary contains the public URL.

The deployed frontend uses the backend URL configured in `js/config.js`.
