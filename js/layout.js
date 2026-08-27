(() => {
  function pick(object, ...names) {
    for (const name of names) {
      if (object && object[name] !== undefined && object[name] !== null) {
        return object[name];
      }
    }

    return null;
  }

  function escapeHtml(value) {
    return String(value ?? "")
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");
  }

  function getQuery(name) {
    return new URLSearchParams(window.location.search).get(name);
  }

  function showAlert(id, type, message) {
    const element = document.getElementById(id);

    if (!element) {
      return;
    }

    const styles = {
      success: "border-emerald-200 bg-emerald-50 text-emerald-700",

      error: "border-red-200 bg-red-50 text-red-700",

      warning: "border-amber-200 bg-amber-50 text-amber-700",

      info: "border-blue-200 bg-blue-50 text-blue-700",
    };

    element.className = `rounded-xl border px-4 py-3 text-sm ${
      styles[type] || styles.info
    }`;

    element.textContent = message;
  }

  function hideAlert(id) {
    const element = document.getElementById(id);

    if (element) {
      element.classList.add("hidden");
    }
  }

  function formatDate(value) {
    if (!value) {
      return "—";
    }

    let cleaned = String(value);

    /*
            Backend ticket date can look like:

            2026-08-27:15:30
        */

    if (/^\d{4}-\d{2}-\d{2}:/.test(cleaned)) {
      cleaned = cleaned.substring(0, 10) + " " + cleaned.substring(11);
    }

    const date = new Date(cleaned);

    if (Number.isNaN(date.getTime())) {
      return cleaned;
    }

    return date.toLocaleString();
  }

  function currentPage() {
    return window.location.pathname.split("/").pop();
  }

  function navClass(page) {
    const active = currentPage() === page;

    return active
      ? "text-slate-950 bg-slate-100"
      : "text-slate-500 hover:text-slate-950 hover:bg-slate-50";
  }

  function getInitials(user) {
    const first = pick(user, "firstName", "FirstName") || "";

    const last = pick(user, "lastName", "LastName") || "";

    return (first.charAt(0) + last.charAt(0)).toUpperCase() || "U";
  }

  function getFullName(user) {
    const first = pick(user, "firstName", "FirstName") || "";

    const last = pick(user, "lastName", "LastName") || "";

    return `${first} ${last}`.trim() || "User";
  }

  function renderHeader() {
    const container = document.getElementById("appHeader");

    if (!container) {
      return;
    }

    const user = window.auth.getUser();

    container.innerHTML = `
            <header class="sticky top-0 z-40 border-b border-slate-200 bg-white/95 backdrop-blur">
                <div class="mx-auto flex h-16 max-w-7xl items-center justify-between px-5 sm:px-6 lg:px-8">

                    <a
                        href="./trips.html"
                        class="flex items-center gap-3"
                    >
                        <span class="grid h-9 w-9 place-items-center rounded-xl bg-slate-950 text-sm font-bold text-white">
                            B
                        </span>

                        <span class="font-bold tracking-tight text-slate-950">
                            BusBooking
                        </span>
                    </a>


                    <nav class="hidden items-center gap-1 md:flex">

                        <a
                            href="./trips.html"
                            class="rounded-lg px-4 py-2 text-sm font-medium ${navClass("trips.html")}"
                        >
                            Trips
                        </a>

                        <a
                            href="./tickets.html"
                            class="rounded-lg px-4 py-2 text-sm font-medium ${navClass("tickets.html")}"
                        >
                            My tickets
                        </a>

                        <a
                            href="./profile.html"
                            class="rounded-lg px-4 py-2 text-sm font-medium ${navClass("profile.html")}"
                        >
                            Profile
                        </a>

                    </nav>


                    <div class="flex items-center gap-3">

                        <a
                            href="./profile.html"
                            class="hidden items-center gap-3 sm:flex"
                        >
                            <span
                                id="headerInitials"
                                class="grid h-9 w-9 place-items-center rounded-full bg-cyan-100 text-xs font-bold text-cyan-800"
                            >
                                ${escapeHtml(getInitials(user))}
                            </span>

                            <span
                                id="headerName"
                                class="max-w-36 truncate text-sm font-semibold text-slate-700"
                            >
                                ${escapeHtml(getFullName(user))}
                            </span>
                        </a>


                        <button
                            id="mobileMenuButton"
                            type="button"
                            class="grid h-10 w-10 place-items-center rounded-lg border border-slate-200 text-slate-600 md:hidden"
                        >
                            ☰
                        </button>


                        <button
                            id="logoutButton"
                            type="button"
                            class="hidden rounded-lg border border-slate-200 px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50 md:block"
                        >
                            Logout
                        </button>

                    </div>

                </div>


                <div
                    id="mobileMenu"
                    class="hidden border-t border-slate-100 bg-white px-5 py-4 md:hidden"
                >

                    <div class="space-y-2">

                        <a
                            href="./trips.html"
                            class="block rounded-lg px-3 py-2 text-sm font-medium ${navClass("trips.html")}"
                        >
                            Trips
                        </a>

                        <a
                            href="./tickets.html"
                            class="block rounded-lg px-3 py-2 text-sm font-medium ${navClass("tickets.html")}"
                        >
                            My tickets
                        </a>

                        <a
                            href="./profile.html"
                            class="block rounded-lg px-3 py-2 text-sm font-medium ${navClass("profile.html")}"
                        >
                            Profile
                        </a>

                        <button
                            id="mobileLogoutButton"
                            type="button"
                            class="block w-full rounded-lg px-3 py-2 text-left text-sm font-medium text-red-600 hover:bg-red-50"
                        >
                            Logout
                        </button>

                    </div>

                </div>
            </header>
        `;

    document
      .getElementById("mobileMenuButton")
      ?.addEventListener("click", () => {
        document.getElementById("mobileMenu")?.classList.toggle("hidden");
      });

    document
      .getElementById("logoutButton")
      ?.addEventListener("click", window.auth.logout);

    document
      .getElementById("mobileLogoutButton")
      ?.addEventListener("click", window.auth.logout);
  }

  function renderFooter() {
    const container = document.getElementById("appFooter");

    if (!container) {
      return;
    }

    container.innerHTML = `
            <footer class="border-t border-slate-200 bg-white">
                <div class="mx-auto flex max-w-7xl flex-col gap-2 px-5 py-6 text-sm text-slate-400 sm:flex-row sm:items-center sm:justify-between sm:px-6 lg:px-8">

                    <p>
                        © ${new Date().getFullYear()} BusBooking
                    </p>

                    <p>
                        Travel simply. Travel safely.
                    </p>

                </div>
            </footer>
        `;
  }

  function refreshHeaderUser(user) {
    const initials = document.getElementById("headerInitials");

    const name = document.getElementById("headerName");

    if (initials) {
      initials.textContent = getInitials(user);
    }

    if (name) {
      name.textContent = getFullName(user);
    }
  }

  async function initProtectedLayout() {
    if (!window.auth.requireAuth()) {
      return false;
    }

    renderHeader();
    renderFooter();

    try {
      const user = await window.auth.me();

      window.auth.updateStoredUser(user);

      refreshHeaderUser(user);

      return true;
    } catch (error) {
      if (error.status === 401) {
        window.auth.clearSession();

        window.location.replace("./login.html");

        return false;
      }

      console.warn("Could not refresh user:", error);

      return true;
    }
  }

  window.ui = {
    pick,
    escapeHtml,
    getQuery,
    showAlert,
    hideAlert,
    formatDate,
    initProtectedLayout,
    refreshHeaderUser,
  };
})();
