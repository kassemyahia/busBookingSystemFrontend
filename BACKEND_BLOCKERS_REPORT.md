# Backend Blockers Report

## Blocker 1 — Driver dashboard cannot identify the authenticated driver

**Severity:** Critical

**Affected frontend feature:**

Driver Dashboard (today, tomorrow, after-tomorrow, monthly, and yearly trip data)

**Backend file:**

`TransportFourthProject.Api/Controllers/DriverDashboardController.cs`

**Backend method/controller:**

`DriverDashboardController` — all five dashboard actions

**Problem:**

Each action reads `User.FindFirst("EmployeeId").Value`. `TokenService.GenerateUserToken(Employee)` does not issue an `EmployeeId` claim; it stores the employee ID in `ClaimTypes.NameIdentifier` (and `sub`).

**Runtime result:**

`User.FindFirst("EmployeeId")` returns null and dereferencing `.Value` causes a `NullReferenceException`, so each dashboard endpoint returns HTTP 500.

**Why frontend cannot fix it:**

JavaScript cannot add a trusted claim to a server-issued JWT or change which claim the controller reads.

**Minimum backend fix:**

In each dashboard action, read `ClaimTypes.NameIdentifier` (with a null/parse check), as the existing `AuthController.DriverMe` action already does. Alternatively, issue an `EmployeeId` claim from `TokenService`, but the controller-only change is smaller.

## Blocker 2 — Route-price JSON Patch input is not configured

**Severity:** High

**Affected frontend feature:**

Route Price Management — editing a route price

**Backend file:**

`TransportFourthProject.Api/Program.cs`

**Backend method/controller:**

`EmployeeRoutePriceController.PatchRoutePrice`

**Problem:**

The action accepts `Microsoft.AspNetCore.JsonPatch.JsonPatchDocument<RoutePrice>`, but MVC is registered only with `AddJsonOptions` (System.Text.Json). Although the NewtonsoftJson package is referenced, `AddNewtonsoftJson()`—which installs the compatible JSON Patch input formatter—is commented out.

**Runtime result:**

An RFC 6902 request with `Content-Type: application/json-patch+json` cannot be bound by a compatible input formatter, so the update request fails before the repository can apply the patch (typically HTTP 415 Unsupported Media Type).

**Why frontend cannot fix it:**

The frontend already sends the required RFC 6902 document and media type; input formatter selection and model binding happen inside ASP.NET.

**Minimum backend fix:**

Register controllers with `.AddNewtonsoftJson(...)` using the already referenced `Microsoft.AspNetCore.Mvc.NewtonsoftJson` package, while retaining the desired enum converter configuration.
