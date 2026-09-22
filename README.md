# Transaction Report

A Vue 3 + TypeScript transaction reporting page built as a frontend technical evaluation.

The project uses a Mock HTTP API because no real backend was provided. The implementation focuses on a production-like admin UI, server-side-like filtering and pagination, request cancellation, URL state synchronization, and performance.

## Features

* **Transaction Reports UI**: Clean, responsive admin dashboard layout with visual hierarchy and light/dark theme support.
* **Transaction Table**: Semantic, horizontally scrollable data table with hover states, row borders, and column alignment.
* **Transaction Formatting**:
  * Amounts formatted with currency/comma separators and right-aligned tabular numerals.
  * Human-readable date and time formatting (`MMM DD, YYYY, HH:mm`).
  * Masked card numbers (`6037 •••• •••• 1000`).
  * Distinct status badges for `Successful`, `Failed`, and `Pending` transactions.
* **Filter Toolbar**:
  * 300ms debounced search by customer name or card number.
  * Status dropdown (`All`, `Successful`, `Failed`, `Pending`).
  * Date-range filters (`From Date`, `To Date`).
  * Accessible labels, unique IDs, and focus rings.
* **Pagination**: Server-side pagination with Previous/Next controls, page counts, and boundary button disabling.
* **State Feedback**:
  * Pure CSS skeleton table loading state with shimmer animation.
  * Informative empty state with filter-adjustment guidance.
  * Distinct error state banner with Retry action.
* **Request Cancellation & Protection**:
  * In-flight request cancellation using native `AbortController`.
  * Race-condition guard using request IDs to prevent stale responses.
* **URL State Synchronization**: Query params sync with browser URL and support Back/Forward history navigation.
* **Mock HTTP API**: 500+ records with simulated network latency (200–800ms) and deterministic error testing (`mockError=true`).

## Tech Stack

* Vue 3
* TypeScript
* Pinia
* Vue Router
* Vite
* Native Fetch API
* Vite Connect Middleware

## Getting Started

```bash
npm install
npm run dev
```

Build:

```bash
npm run build
```

The application is available at:

```text
/transactions
```

## Architecture

```text
src/
├── components/
│   └── transactions/
│       └── TransactionList.vue
├── composables/
│   └── useRouteSync.ts
├── mocks/
│   ├── mock-server.ts
│   └── transactions.ts
├── router/
│   └── index.ts
├── services/
│   └── transaction.service.ts
├── stores/
│   └── transaction.store.ts
├── types/
│   └── transaction.ts
├── utils/
│   ├── formatters.ts
│   └── queryParams.ts
├── App.vue
├── main.ts
└── style.css
```

### Responsibilities

| Layer               | Responsibility                                       |
| ------------------- | ---------------------------------------------------- |
| Components          | UI, filters, table, states, and pagination controls  |
| Store               | Application state, query state and request lifecycle |
| Service             | HTTP data access and error handling                  |
| Mock API            | Filtering, pagination, latency and error simulation  |
| Router / Composable | URL ↔ Pinia state synchronization                    |
| Utils               | Formatters (amount, date, card) and query params     |
| Types               | Shared TypeScript contracts                          |

Pinia is the single source of truth for transaction data and query state.

## Mock HTTP API

The frontend communicates with:

```text
GET /api/transactions
```

The endpoint is implemented using Vite Connect middleware and is available in both development and preview.

### Query Parameters

| Parameter   | Description                           |
| ----------- | ------------------------------------- |
| `page`      | 1-based page number                   |
| `pageSize`  | Number of records per page            |
| `search`    | Case-insensitive customer/card search |
| `status`    | `Successful`, `Failed`, or `Pending`  |
| `fromDate`  | Inclusive start date                  |
| `toDate`    | Inclusive end date                    |
| `mockError` | Set to `true` to simulate HTTP 500    |

Example:

```text
/api/transactions?page=2&pageSize=10&status=Successful
```

The mock API:

1. Applies filters.
2. Calculates `totalCount`.
3. Applies pagination.
4. Returns only the requested page.

Therefore, the frontend never loads all 500+ records at once.

### Response

```json
{
  "data": [],
  "totalCount": 500
}
```

### Latency & Error Simulation

Responses have a simulated latency of **200–800ms**.

For deterministic error testing, open the application with `mockError=true`:

```text
/transactions?mockError=true
```

This sends `mockError=true` to `/api/transactions?mockError=true`, returning HTTP 500. The UI displays the error state banner and provides a Retry action that preserves the `mockError=true` query state.

## Request Cancellation

Each request receives an `AbortSignal`.

When a new request starts:

* The previous request is aborted.
* The browser cancels the in-flight HTTP request.
* The mock server clears its pending latency timer when the connection closes.
* A request ID guard prevents stale responses from updating the store.

This protects the UI during rapid searches, pagination, and Back/Forward navigation.

## URL State Synchronization

Filter and pagination state is reflected in the URL.

Example:

```text
/transactions?search=Ali&status=Successful&page=2
```

The URL can therefore be:

* bookmarked
* refreshed without losing state
* navigated using Back / Forward

### Navigation behavior

| Action                 | History   |
| ---------------------- | --------- |
| Search / filter change | `replace` |
| Pagination             | `push`    |

Incoming query parameters are validated before being applied to the store. Invalid pages, statuses, dates, and unknown parameters are safely ignored.

## Performance Investigation

### Problem

The initial search implementation triggered a request on every keystroke.

Typing:

```text
Ali
```

could trigger three requests instead of one.

Although `AbortController` prevented stale responses from updating the UI, unnecessary requests were still being started.

### Root Cause

The search input called the store immediately from `@input`:

```text
@input
  ↓
setSearch()
  ↓
fetchTransactions()
```

There was no delay between keystrokes and request creation.

### Fix

A **300ms debounce** was added to the search input.

```text
User typing
    ↓
300ms debounce
    ↓
setSearch()
    ↓
fetchTransactions()
```

The existing `AbortController` and request-ID guard remain as a second layer of protection for overlapping requests.

### Result

For fast typing such as `Ali`:

```text
Before: 3 requests
After:  1 request
```

The fix reduces unnecessary network activity while preserving responsive search behavior.

## State & UI Behavior

* Changing a filter resets pagination to page 1.
* Search is debounced and cleaned up when the component unmounts.
* Loading, empty, and error states are mutually exclusive.
* Retry performs a normal request again.
* Back / Forward restores both data and visible filter controls.
* The frontend only renders the current page.
* Table wraps with horizontal scroll on smaller viewports.

## Assignment Requirements

| Requirement                       | Status |
| --------------------------------- | ------ |
| 500+ mock records                 | ✅      |
| Mock API / Service                | ✅      |
| Pagination                        | ✅      |
| Search with debounce              | ✅      |
| Status filter                     | ✅      |
| Date-range filter                 | ✅      |
| `totalCount` calculation          | ✅      |
| Simulated network latency         | ✅      |
| Error simulation (`mockError`)    | ✅      |
| Page-only data fetching           | ✅      |
| Loading / Empty / Error states    | ✅      |
| Transaction Reports UI & Table    | ✅      |
| Transaction data formatting       | ✅      |
| Request cancellation              | ✅      |
| Race-condition protection         | ✅      |
| URL state synchronization         | ✅      |
| Performance issue investigation   | ✅      |

## Verification

The project was verified with:

```bash
npm run build
```

and:

```bash
git diff --check
```

Both completed successfully with zero TypeScript, build, or formatting errors.

Manual scenarios to verify before final submission:

* Initial page load
* Pagination
* Search and debounce
* Status filter
* Date-range filter
* Refresh with URL state
* Browser Back / Forward
* Simulated HTTP 500 + Retry
* Rapid consecutive requests

## AI Usage

AI tools were used selectively during the development of this project.

* AI was used to assist with **README writing and documentation**.
* AI was used to help design and run **test scenarios and verification steps**.
* AI was also used for code review and debugging assistance.

The implementation, architecture, and final technical decisions were reviewed and validated against the assignment requirements.
