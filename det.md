# الشرح التقني المفصّل للواجهة الأمامية

هذا الملف امتداد للتقرير الرسمي، ويركّز على **الشيفرة نفسها سطرًا سطرًا**، لاستخدامه في الرد على أسئلة الأستاذ التقنية الدقيقة. كل مقطع كود منقول حرفيًا من المشروع.

---

## 1. `assets/js/core/config.js` — نقطة الإعداد الوحيدة

```js
window.APP_CONFIG = Object.freeze({
  API_BASE_URL: "https://transportpro.runasp.net",
  AFTER_LOGIN_URL: "../user/trips.html",
});
```

**الشرح سطرًا بسطر:**

- `window.APP_CONFIG = ...` — يُعرَّف الكائن مباشرة على `window` لأنه لا يوجد نظام `import/export`؛ هذه هي الطريقة الوحيدة لجعل هذا الكائن مرئيًا لبقية ملفات JavaScript التي تُحمَّل بعده في نفس الصفحة.
- `Object.freeze({...})` — يمنع أي كود لاحق من تعديل هذا الكائن في وقت التشغيل (Runtime Immutability). لو حاول أي ملف لاحقًا تنفيذ `APP_CONFIG.API_BASE_URL = "..."`، فإن هذا التعديل سيُتجاهَل بصمت (في الوضع غير الصارم) دون أن يُحدث أي أثر.
- `API_BASE_URL` — السلسلة النصية الوحيدة في كامل المشروع التي تحمل عنوان الخادم؛ كل استدعاء API يُبنى لاحقًا بجمع هذه القيمة مع مسار الـ endpoint، مثل: `API_BASE_URL + "/api/Auth/login"`.
- `AFTER_LOGIN_URL` — قيمة تُقرأ لاحقًا من `login.js` بعد نجاح تسجيل الدخول لتحديد الوجهة.

---

## 2. `assets/js/core/api.js` — طبقة الاتصال الموحّدة

### 2.1 الغلاف العام (IIFE)

```js
(() => {
  // كل الدوال التالية معرّفة هنا، ولا تُرى من خارج هذا الملف
  // إلا ما يُعرَض صراحة عبر window.api في النهاية
})();
```

هذا النمط (`(() => { ... })()`) يُسمّى **Immediately Invoked Function Expression**، ويُستخدم هنا بديلاً عن نظام الوحدات (ES Modules)، لتفادي تسريب أي متغيّر داخلي (مثل `getErrorMessage` أو `parseResponse`) إلى النطاق العام `window`، حيث يمكن أن يتعارض مع متغيّر بنفس الاسم في ملف آخر.

### 2.2 دالة تفسير رسائل الخطأ

```js
function getErrorMessage(data, status) {
  if (typeof data === "string") {
    return data;
  }
  if (data?.message) {
    return data.message;
  }
  if (data?.Message) {
    return data.Message;
  }
  if (data?.errors) {
    const messages = Object.values(data.errors).flat().filter(Boolean);
    if (messages.length > 0) {
      return messages[0];
    }
  }
  if (status === 401) {
    return "Your session is not authorized.";
  }
  if (status === 403)
    return "You do not have permission to perform this action.";
  if (status === 404) {
    return "The requested resource was not found.";
  }
  if (status === 409) return "The request conflicts with existing data.";
  if (status >= 500) return "The API encountered an internal error.";
  return "Something went wrong.";
}
```

**تفصيل كل حالة، ولماذا هي ضرورية تحديدًا مع هذا الخادم الخلفي (ASP.NET):**

| الشرط                      | الحالة التي يعالجها                                                                                              | لماذا موجودة                                                                                                                                                                                    |
| -------------------------- | ---------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `typeof data === "string"` | الخادم أعاد نصًا خامًا (`return BadRequest("...")`)                                                              | بعض تصرفات المتحكمات (Controllers) تُعيد نصًا مباشرة بدل كائن JSON                                                                                                                              |
| `data?.message`            | كائن JSON بحقل `message` بصيغة camelCase                                                                         | التنسيق القياسي لمعظم استجابات النجاح/الخطأ                                                                                                                                                     |
| `data?.Message`            | نفس الحقل لكن بصيغة PascalCase                                                                                   | ASP.NET أحيانًا يُسلسل الكائنات بأسماء C# الأصلية (PascalCase) دون تطبيق `JsonNamingPolicy.CamelCase`، وهذا يعني عدم اتساق كامل من جهة الخادم — الواجهة الأمامية تتحمّل عبء التعامل مع الحالتين |
| `data?.errors`             | كائن أخطاء التحقق (Model Validation) من ASP.NET، شكله: `{ "Phone": ["Phone is required"], "Password": ["..."] }` | `Object.values(data.errors)` يحوّل الكائن إلى مصفوفة من المصفوفات، و`.flat()` يدمجها في مصفوفة واحدة مسطّحة، و`.filter(Boolean)` يحذف أي قيمة فارغة/undefined، ثم تُؤخذ أول رسالة فقط           |
| فحوصات `status`            | لا يوجد أي جسم استجابة مفيد                                                                                      | حالة احتياطية أخيرة (Fallback) تعتمد فقط على رمز حالة HTTP، لضمان ظهور رسالة مفهومة دائمًا مهما كان شكل الاستجابة                                                                               |

### 2.3 دالة تفسير جسم الاستجابة

```js
async function parseResponse(response) {
  if (response.status === 204) {
    return null;
  }
  const contentType = response.headers.get("content-type") || "";
  if (contentType.includes("application/json")) {
    try {
      return await response.json();
    } catch {
      return null;
    }
  }
  try {
    const text = await response.text();
    return text ? { message: text } : null;
  } catch {
    return null;
  }
}
```

- `response.status === 204` — رمز **No Content** يُستخدم غالبًا مع عمليات `DELETE`/`PUT` الناجحة التي لا تُعيد بيانات؛ استدعاء `.json()` على جسم فارغ يُسبب استثناء (Exception)، لذا تُعالَج هذه الحالة أولاً وتُعاد `null` مباشرة.
- التحقق من ترويسة `Content-Type` قبل محاولة `.json()` يمنع محاولة تحليل نص عادي كأنه JSON، وهو خطأ شائع يُسبب رميّ استثناء غير متوقّع لو لم يُعالَج.
- كل مسار محاط بـ `try/catch` لأن كلًّا من `.json()` و`.text()` يمكن أن يفشل (مثلاً استجابة مقطوعة الاتصال)، والهدف هو ألا يتوقف تنفيذ الكود بسبب تفاصيل الشبكة.

### 2.4 الدالة المركزية `request` — قلب الملف

```js
async function request(endpoint, options = {}) {
  const {
    auth = false,
    skipRefresh = false,
    headers = {},
    ...fetchOptions
  } = options;

  const makeRequest = async () => {
    const requestHeaders = {
      "Content-Type": "application/json",
      ...headers,
    };
    if (auth) {
      const token = window.auth?.getAccessToken();
      if (token) {
        requestHeaders.Authorization = `Bearer ${token}`;
      }
    }
    return fetch(window.APP_CONFIG.API_BASE_URL + endpoint, {
      ...fetchOptions,
      headers: requestHeaders,
    });
  };

  let response;
  try {
    response = await makeRequest();
  } catch (error) {
    const networkError = new Error(
      "Cannot connect to the API. The service may be unavailable.",
    );
    networkError.isNetworkError = true;
    networkError.cause = error;
    throw networkError;
  }

  // Access token expired. Try using refresh token once.
  if (response.status === 401 && auth && !skipRefresh && window.auth) {
    const refreshed = await window.auth.refreshSession();
    if (refreshed) {
      response = await makeRequest();
    }
  }

  const data = await parseResponse(response);
  if (!response.ok) {
    const error = new Error(getErrorMessage(data, response.status));
    error.status = response.status;
    error.data = data;
    throw error;
  }
  return data;
}
```

**شرح تدفّق التنفيذ بالكامل:**

1. **تفكيك المعاملات (Destructuring):**

   ```js
   const {
     auth = false,
     skipRefresh = false,
     headers = {},
     ...fetchOptions
   } = options;
   ```

   `options` كائن واحد يحتوي خليطًا من خيارات مخصصة (`auth`, `skipRefresh`) وخيارات حقيقية تخص `fetch()` نفسها (`method`, `body`). يفصل هذا السطر الثلاثة الأولى، ويجمع الباقي في `fetchOptions` عبر معامل التوزيع (Rest Operator) `...fetchOptions`، بحيث تُمرَّر لاحقًا كما هي إلى `fetch()` دون أن تحتوي على خصائص غير معروفة لواجهة Fetch.

2. **`makeRequest` كدالة منفصلة غير منفَّذة فورًا:**
   يُعرَّف الطلب الفعلي كدالة، لا يُستدعى مباشرة، لأن الكود يحتاج لاحقًا **إعادة تنفيذه بالضبط** بعد تجديد رمز الدخول — تعريفه كدالة قابلة لإعادة الاستدعاء يمنع تكرار كتابة منطق بناء الترويسات والاتصال مرتين.

3. **إرفاق رمز الدخول:**

   ```js
   if (auth) {
     const token = window.auth?.getAccessToken();
     if (token) requestHeaders.Authorization = `Bearer ${token}`;
   }
   ```

   `window.auth?.getAccessToken()` — عامل التسلسل الاختياري (`?.`) يحمي من الانهيار إن لم يكن `auth.js` محمَّلاً بعد. لا حاجة لأي صفحة أن تكتب هذه الترويسة يدويًا؛ يكفي تمرير `{ auth: true }`.

4. **معالجة فشل الشبكة (مختلف عن فشل HTTP):**

   ```js
   try {
     response = await makeRequest();
   } catch (error) {
     throw new Error("Cannot connect to the API...");
   }
   ```

   `fetch()` **لا يرمي استثناءً** لأكواد حالة مثل 404 أو 500 — فقط عند فشل حقيقي في الشبكة (لا إنترنت، انقطاع DNS، حظر CORS). هذا الفصل بين "الطلب لم يصل أصلاً" و"الطلب وصل لكن الخادم رفضه" مهم جدًا من الناحية المفاهيمية.

5. **آلية التجديد التلقائي (الجزء الأهم في الملف):**

   ```js
   if (response.status === 401 && auth && !skipRefresh && window.auth) {
     const refreshed = await window.auth.refreshSession();
     if (refreshed) response = await makeRequest();
   }
   ```

   شرط رباعي يجب أن يتحقق بالكامل:
   - `response.status === 401`: الخادم رفض رمز الدخول (منتهي الصلاحية عادة).
   - `auth`: الطلب أصلاً كان يتطلب مصادقة (لا فائدة من التجديد لطلب عام).
   - `!skipRefresh`: صمّام أمان يمنع الحلقة اللانهائية — طلب التجديد نفسه (`/api/Auth/refresh-token`) يُرسَل بـ `skipRefresh: true` حتى لا يحاول تجديد نفسه إذا فشل.
   - `window.auth`: تأكد من تحميل ملف `auth.js`.

   إذا تحقق الشرط ونجح `refreshSession()` (أي حصل على رمز جديد وحفظه)، تُستدعى `makeRequest()` **مرة ثانية بنفس المعاملات تمامًا**، وهذه المرة تلتقط الرمز الجديد من التخزين تلقائيًا لأن `getAccessToken()` تُستدعى من جديد داخل `makeRequest`. الصفحة المستدعية لا تعرف أن أي شيء حدث؛ تحصل ببساطة على استجابة ناجحة عادية.

6. **تحويل فشل HTTP إلى استثناء JavaScript حقيقي:**
   ```js
   if (!response.ok) {
     const error = new Error(getErrorMessage(data, response.status));
     error.status = response.status;
     error.data = data;
     throw error;
   }
   ```
   `response.ok` صحيحة لأي رمز حالة من فئة 2xx. يُنشأ هنا كائن `Error` حقيقي (وليس مجرد نص)، مع إرفاق `.status` و`.data` كخصائص إضافية عليه، بحيث يمكن لأي صفحة مستدعية أن تكتفي بـ `catch (e) { showAlert(e.message) }`، أو أن تفحص `e.status` إن احتاجت لسلوك خاص حسب رمز الخطأ.

### 2.5 الواجهة المُصدَّرة

```js
window.api = {
  request,
  asArray(value) {
    return Array.isArray(value) ? value : [];
  },
  message(value, fallback = "") {
    return getErrorMessage(value, 200) === "Something went wrong."
      ? fallback
      : getErrorMessage(value, 200);
  },
};
```

هذا هو السطر الوحيد الذي "يُصدِّر" شيئًا من الملف؛ `asArray` تُستخدم في كل صفحة تعرض قائمة، لضمان ألا تنهار الشيفرة (`.map is not a function`) إن أعاد الخادم `null` بدل مصفوفة فارغة.

---

## 3. `assets/js/core/auth.js` — إدارة الهوية والجلسة

### 3.1 مفاتيح التخزين ودالة `pick`

```js
const KEYS = {
  access: "transport_access_token",
  refresh: "transport_refresh_token",
  entity: "transport_user",
  type: "transport_account_type",
  role: "transport_role",
  remember: "transport_remember_me",
};

const pick = (o, ...names) =>
  names.map((n) => o?.[n]).find((v) => v !== undefined && v !== null) ?? null;
```

`pick(obj, "accessToken", "AccessToken")` تأخذ كائنًا وقائمة أسماء محتملة، وتُعيد **أول قيمة موجودة فعليًا** من بينها. هذا يحل مشكلة عدم اتساق تسمية الحقول (camelCase أحيانًا وPascalCase أحيانًا أخرى) في استجابات الخادم دون كتابة `if/else` طويلة في كل مكان.

### 3.2 اختيار مكان التخزين ديناميكيًا

```js
function storage() {
  if (localStorage.getItem(KEYS.access) || localStorage.getItem(KEYS.refresh))
    return localStorage;
  if (
    sessionStorage.getItem(KEYS.access) ||
    sessionStorage.getItem(KEYS.refresh)
  )
    return sessionStorage;
  return localStorage.getItem(KEYS.remember) === "true"
    ? localStorage
    : sessionStorage;
}
```

هذه الدالة تُستدعى في **بداية كل عملية قراءة أو كتابة** خاصة بالجلسة (`getAccessToken`, `saveSession`, ...)، فتُحدّد أولاً أين يوجد الرمز فعليًا (`localStorage` تدوم بعد إغلاق المتصفح، أو `sessionStorage` تُمسح عند إغلاق التبويب)، وإن لم يكن هناك رمز محفوظ بعد، تعتمد على القيمة السابقة لخانة "تذكرني" لتقرر أين تُخزَّن الجلسة الجديدة.

### 3.3 حفظ الجلسة بعد تسجيل الدخول

```js
function saveSession(response, remember = false, requestedType = "User") {
  const access = pick(response, "accessToken", "AccessToken");
  const refresh = pick(response, "refreshToken", "RefreshToken");
  const entity = pick(
    response,
    "user",
    "User",
    "employee",
    "Employee",
    "driver",
    "Driver",
  );
  if (!access) throw new Error("The API did not return an access token.");
  clear(localStorage);
  clear(sessionStorage);
  const target = remember ? localStorage : sessionStorage;
  const type =
    requestedType === "User"
      ? "User"
      : requestedType === "Driver"
        ? "Driver"
        : "Employee";
  const role =
    type === "Driver"
      ? "Driver"
      : pick(entity, "role", "Role") || (type === "User" ? "User" : null);
  target.setItem(KEYS.access, access);
  if (refresh) target.setItem(KEYS.refresh, refresh);
  if (entity) target.setItem(KEYS.entity, JSON.stringify(entity));
  target.setItem(KEYS.type, type);
  if (role) target.setItem(KEYS.role, String(role));
  localStorage.setItem(KEYS.remember, String(remember));
}
```

ملاحظات دقيقة:

- `clear(localStorage); clear(sessionStorage);` — تُمسح كلتا مساحتي التخزين أولاً، لمنع بقاء رمز قديم من جلسة سابقة (مثلاً لو سجّل موظف خروجًا ثم سجّل راكب دخولاً على نفس الجهاز).
- `type` تُحدَّد من المعامل المُمرَّر عند الاستدعاء (`"User"`, `"Employee"`, `"Driver"`) وليس من محتوى الاستجابة، لأن ثلاثة مسارات تسجيل دخول مختلفة تستدعي هذه الدالة بثلاث قيم مختلفة.
- `entity` تُخزَّن كسلسلة JSON عبر `JSON.stringify` لأن `localStorage`/`sessionStorage` لا يخزّنان إلا نصوصًا.

### 3.4 دوال تسجيل الدخول الثلاث — إعادة استخدام دالة واحدة

```js
async function performLogin(path, phone, password, remember, type) {
  const response = await api.request(path, {
    method: "POST",
    body: JSON.stringify({ Phone: phone, Password: password }),
  });
  saveSession(response, remember, type);
  return response;
}
const login = (p, w, r) => performLogin("/api/Auth/login", p, w, r, "User");
const employeeLogin = (p, w, r) =>
  performLogin("/api/Auth/employee/login", p, w, r, "Employee");
const driverLogin = (p, w, r) =>
  performLogin("/api/Auth/driver/login", p, w, r, "Driver");
```

ثلاث دوال مختلفة الاستخدام (`login`, `employeeLogin`, `driverLogin`) لكنها كلها تستدعي `performLogin` نفسها بمسار (endpoint) ونوع حساب مختلفين فقط — تكرار الاختلاف الوحيد (المسار والنوع) بدل تكرار كامل منطق الطلب وحفظ الجلسة.

### 3.5 التجديد التلقائي (المُستدعاة من `api.js`)

```js
async function refreshSession() {
  const target = storage(),
    refresh = target.getItem(KEYS.refresh);
  if (!refresh) return false;
  try {
    const data = await api.request("/api/Auth/refresh-token", {
      method: "POST",
      skipRefresh: true,
      body: JSON.stringify({ RefreshToken: refresh }),
    });
    const access = pick(data, "accessToken", "AccessToken");
    if (!access) throw new Error("Refresh failed.");
    target.setItem(KEYS.access, access);
    const next = pick(data, "refreshToken", "RefreshToken");
    if (next) target.setItem(KEYS.refresh, next);
    return true;
  } catch {
    const type = getAccountType();
    clearSession();
    window.location.replace(
      type === "Driver"
        ? "../auth/driver-login.html"
        : type === "Employee"
          ? "../auth/staff-login.html"
          : "../auth/login.html",
    );
    return false;
  }
}
```

لاحظ `skipRefresh: true` في هذا الاستدعاء تحديدًا — هذا بالضبط ما يمنع الحلقة اللانهائية المذكورة سابقًا في `api.js`. وإذا فشل التجديد (الـ `catch`)، تُحدَّد صفحة تسجيل الدخول الصحيحة حسب نوع الحساب المخزَّن **قبل** مسح الجلسة (`getAccountType()` قبل `clearSession()`)، لأن `clearSession()` تمسح كل شيء بما فيه نوع الحساب.

### 3.6 دوال الحماية (Guards)

```js
function guard(valid, target) {
  if (!getAccessToken() || !valid) {
    window.location.replace(target);
    return false;
  }
  return true;
}
const requireUser = () =>
  guard(getAccountType() === "User", "../auth/login.html");
const requireManager = () =>
  guard(
    getAccountType() === "Employee" && getRole() === "Manager",
    "../admin/admin-dashboard.html",
  );
const requireDriver = () =>
  guard(
    getAccountType() === "Driver" && getRole() === "Driver",
    "../auth/driver-login.html",
  );
```

`window.location.replace` (وليس `.href =`) تُستخدم عمدًا: تستبدل الصفحة الحالية في تاريخ المتصفح بدل إضافة صفحة جديدة، بحيث لا يستطيع المستخدم الضغط على زر "رجوع" في المتصفح للعودة إلى صفحة محمية بعد رفض دخوله إليها.

---

## 4. `assets/js/admin/admin-common.js` — الجدول والنافذة القابلان لإعادة الاستخدام

### 4.1 محرّك الجدول

```js
function rows(data, columns, actions) {
  const list = api.asArray(data);
  if (!list.length)
    return `<tr><td colspan="${columns.length + (actions ? 1 : 0)}" class="px-5 py-10 text-center text-slate-400">No data available.</td></tr>`;
  return list
    .map(
      (item) =>
        `<tr class="border-t border-slate-100">${columns.map((c) => `<td class="whitespace-nowrap px-5 py-3 text-sm text-slate-600">${esc(c.format ? c.format(pick(item, ...c.keys), item) : pick(item, ...c.keys))}</td>`).join("")}${actions ? `<td class="whitespace-nowrap px-5 py-3">${actions(item)}</td>` : ""}</tr>`,
    )
    .join("");
}
function table(target, data, columns, actions) {
  document.getElementById(target).innerHTML =
    `<div class="overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-sm"><table class="w-full text-left"><thead class="bg-slate-50"><tr>${columns.map((c) => `<th class="px-5 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">${esc(c.label)}</th>`).join("")}${actions ? '<th class="px-5 py-3 text-xs font-semibold uppercase text-slate-500">Actions</th>' : ""}</tr></thead><tbody>${rows(data, columns, actions)}</tbody></table></div>`;
}
```

هذه الدالة لا "تعرف" شيئًا عن الحافلات أو المدن أو الرحلات؛ هي فقط تكرر مصفوفة `columns` لكل صف من `data`. كل صفحة إدارية تستدعيها بتعريف أعمدة مختلف فقط، مثل:

```js
admin.table(
  "tableRoot",
  buses,
  [
    { label: "Bus number", keys: ["busNumber", "BusNumber"] },
    { label: "Capacity", keys: ["capacity", "Capacity"] },
  ],
  (o) => `<button data-edit="${admin.pick(o, "busId", "BusId")}">Edit</button>`,
);
```

`c.format ? c.format(...) : pick(...)` تسمح بتمرير دالة تنسيق مخصّصة لعمود معيّن (مثلاً دمج مدينتي البداية والنهاية بسهم `→` بينهما) دون كسر الشكل العام للدالة.

### 4.2 محرّك النافذة المنبثقة

```js
function openModal(title, body, onSubmit) {
  const root = document.getElementById("modalRoot");
  root.innerHTML = `<div class="fixed inset-0 z-50 grid place-items-center bg-slate-950/60 p-4 backdrop-blur-sm" role="dialog" aria-modal="true">...<form id="modalForm">${body}...</form></div>`;
  root
    .querySelectorAll("[data-close]")
    .forEach((b) => (b.onclick = () => (root.innerHTML = "")));
  root.querySelector("form").onsubmit = async (e) => {
    e.preventDefault();
    const b = document.getElementById("modalSubmit");
    b.disabled = true;
    b.textContent = "Saving…";
    try {
      await onSubmit(new FormData(e.target));
      root.innerHTML = "";
    } catch (err) {
      const box = document.getElementById("modalError");
      box.textContent = err.message;
      box.classList.remove("hidden");
      b.disabled = false;
      b.textContent = "Save";
    }
  };
}
```

`new FormData(e.target)` تقرأ كل حقول النموذج تلقائيًا بالاعتماد على خاصية `name` لكل `<input>`، دون الحاجة لكتابة `document.getElementById(...)` لكل حقل يدويًا. عند النجاح تُفرَّغ النافذة (`root.innerHTML = ""`)، وعند الفشل تبقى مفتوحة مع رسالة الخطأ داخلها ويُعاد تفعيل الزر — وهذا يمنع فقدان بيانات المستخدم المدخلة عند حدوث خطأ.

---

## 5. مثال متكامل: `assets/js/auth/login.js`

```js
loginForm.addEventListener("submit", async function (event) {
  event.preventDefault();
  hideAlert();
  const phoneValid = validatePhone();
  const passwordValid = validatePassword();
  if (!phoneValid || !passwordValid) return;

  const phone = phoneInput.value.trim();
  const password = passwordInput.value;
  const rememberMe = rememberMeInput.checked;

  try {
    setLoading(true);
    const response = await auth.login(phone, password, rememberMe);
    showAlert("success", "Login successful.");
    if (window.APP_CONFIG.AFTER_LOGIN_URL) {
      setTimeout(function () {
        window.location.href = window.APP_CONFIG.AFTER_LOGIN_URL;
      }, 500);
    }
  } catch (error) {
    let message = error.message || "Login failed.";
    if (message === "Failed to fetch") {
      message =
        "The booking service is currently unavailable. Please try again shortly.";
    }
    showAlert("error", message);
  } finally {
    setLoading(false);
  }
});
```

هذا المقطع يلخّص كل الطبقات السابقة عمليًا:

1. `event.preventDefault()` يمنع سلوك المتصفح الافتراضي (إعادة تحميل الصفحة عند إرسال أي `<form>`).
2. التحقق المحلي (`validatePhone`, `validatePassword`) يمنع إرسال طلب غير ضروري للخادم لو كانت البيانات ناقصة.
3. `auth.login(...)` تستدعي بدورها `performLogin` في `auth.js`، التي تستدعي `api.request` في `api.js`، التي تنفّذ `fetch()` فعليًا.
4. نمط `try/catch/finally` يضمن أن حالة "جارٍ التحميل" (`setLoading`) تُلغى دائمًا، سواء نجح الطلب أو فشل.
5. فحص `message === "Failed to fetch"` تحديدًا حالة **فشل الشبكة الحرفية** (لا يوجد اتصال، أو الخادم متوقف)، ويستبدلها برسالة أوضح للمستخدم العادي.

---

## 6. مثال البحث عن الرحلات: `assets/js/user/trips.js`

```js
async function loadTrips(endpoint = "/api/Trip/all-trips") {
  loading.classList.remove("hidden");
  grid.innerHTML = "";
  ui.hideAlert("tripsAlert");
  try {
    renderTrips(await api.request(endpoint, { auth: true }));
  } catch (e) {
    loading.classList.add("hidden");
    ui.showAlert("tripsAlert", "error", e.message);
  }
}

form.addEventListener("submit", (event) => {
  event.preventDefault();
  const values = {
    startCity: start.value,
    endCity: end.value,
    date: document.getElementById("tripDate").value,
    busType: document.getElementById("busType").value.trim(),
    sortBy: document.getElementById("sortBy").value,
    order: document.getElementById("sortOrder").value,
  };
  if (values.startCity && values.startCity === values.endCity) {
    ui.showAlert(
      "tripsAlert",
      "warning",
      "Departure and destination cities must be different.",
    );
    return;
  }
  const params = new URLSearchParams();
  Object.entries(values).forEach(([k, v]) => v && params.set(k, v));
  loadTrips(`/api/Trip/search?${params}`);
});
```

- `loadTrips(endpoint = "/api/Trip/all-trips")` تأخذ الـ endpoint كمعامل له قيمة افتراضية، فتُستخدم نفس الدالة لعرض كل الرحلات (بدون معاملات) أو نتائج بحث مفلترة (بتمرير رابط `search?...`).
- `URLSearchParams` تبني نص الاستعلام (Query String) بأمان (تُشفّر الأحرف الخاصة تلقائيًا)، و`v && params.set(k, v)` تضمن عدم إضافة أي حقل فارغ إلى الرابط.
- `Object.entries(values).forEach(([k, v]) => ...)` — تحويل الكائن `values` إلى أزواج `[مفتاح, قيمة]` والمرور عليها، بدل كتابة سطر منفصل لكل حقل.

---

## 7. مثال اختيار المقعد: `assets/js/user/trip-details.js`

```js
function isAvailable(status) {
  return Number(status) === 1 || String(status).toLowerCase() === "available";
}

function seatStyle(status) {
  const number = Number(status);
  const text = String(status).toLowerCase();
  if (number === 1 || text === "available") {
    return "border-cyan-200 bg-teal-50 text-cyan-800 hover:border-teal-500 hover:bg-teal-50 cursor-pointer";
  }
  if (number === 2 || text === "reserved") {
    return "border-amber-200 bg-amber-50 text-amber-700 cursor-not-allowed";
  }
  return "border-slate-200 bg-slate-100 text-slate-400 cursor-not-allowed";
}
```

كلتا الدالتين تفحصان **قيمتين محتملتين** لحالة المقعد: رقمًا (`1`) أو نصًا (`"Available"`)، لأن تعداد (Enum) حالة المقعد في الخادم قد يُسلسَل أحيانًا كرقم وأحيانًا كاسم حسب إعدادات المسلسِل (Serializer) في ASP.NET — نفس مشكلة عدم الاتساق التي ظهرت سابقًا مع أسماء الحقول، لكنها هنا في _قيمة_ الحقل لا في _اسمه_.

```js
async function selectSeat(seatNumber) {
  document.querySelectorAll(".seat-button").forEach((button) => {
    button.disabled = true;
  });
  try {
    const response = await window.api.request("/api/Trip/select-seat", {
      method: "POST",
      auth: true,
      body: JSON.stringify({
        TripId: Number(tripId),
        SeatNumber: Number(seatNumber),
      }),
    });
    const bookingId = window.ui.pick(response, "bookingId", "BookingId");
    if (!bookingId)
      throw new Error(message || "The seat could not be selected.");
    window.location.href = `./booking.html?bookingId=${bookingId}&tripId=${tripId}&seat=${seatNumber}`;
  } catch (error) {
    window.ui.showAlert("tripAlert", "error", error.message);
    await loadPage();
  }
}
```

- `document.querySelectorAll(".seat-button").forEach((b) => b.disabled = true)` — تُعطَّل جميع أزرار المقاعد فور الضغط، لمنع إرسال أكثر من طلب حجز في نفس اللحظة (Double Submission).
- عند الفشل، لا يكتفي الكود بعرض رسالة خطأ، بل يستدعي `loadPage()` من جديد لإعادة جلب خريطة المقاعد كاملة — لأن سبب الفشل الأكثر احتمالاً هو أن شخصًا آخر حجز المقعد نفسه في نفس اللحظة (Race Condition)، فالخريطة المعروضة أصبحت غير محدَّثة ويجب تحديثها.

---

## 8. جدول مرجعي سريع لأسئلة الأستاذ المتوقّعة على مستوى الكود

| السؤال المحتمل                                                     | الإجابة المختصرة مع الإشارة للكود                                                                                                                                                                |
| ------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| لماذا لا تُخزَّن الروابط في متغيرات ثابتة عامة (Constants)؟        | كل ملف يكتب الرابط كسلسلة نصية داخل الاستدعاء مباشرة (مثل `"/api/Trip/all-trips"`)؛ هذه نقطة ضعف حقيقية في التصميم يمكن الاعتراف بها أمام الأستاذ كتحسين مقترح (إنشاء ملف `endpoints.js` مركزي). |
| كيف يعرف الكود أن الرمز صالح دون إرسال طلب؟                        | لا يعرف — `requireUser()` تتحقق محليًا فقط من وجود رمز مخزَّن ونوع الحساب، أما التحقق الحقيقي من صلاحيته فيتم لاحقًا عبر استدعاء `auth.me()` الذي يُرسِل طلبًا فعليًا للخادم.                    |
| ماذا يحدث تحديدًا عند انتهاء صلاحية رمز التجديد نفسه؟              | داخل `catch` في `refreshSession()`، تُمسح الجلسة بالكامل (`clearSession()`) ويُعاد التوجيه لصفحة تسجيل الدخول المناسبة حسب نوع الحساب.                                                           |
| لماذا `JSON.stringify` قبل كل `body`؟                              | لأن `fetch` يرسل الجسم (body) كسلسلة نصية خام؛ `JSON.stringify` يحوّل كائن JavaScript إلى نص JSON صالح لإرساله، وتقابله `Content-Type: application/json` في الترويسات ليعرف الخادم كيفية تفسيره. |
| لماذا يُستخدم Template Literals بدل مكتبة عرض (Templating Engine)؟ | لعدم وجود أي اعتمادية خارجية في المشروع؛ الأقواس المعقوفة داخل الباكتيك (`` `${...}` ``) هي ميزة أصلية في JavaScript (ES6) لدمج المتغيرات داخل نص دون أي مكتبة إضافية.                           |
