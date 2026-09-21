# Transaction Report

A Vue 3 + TypeScript transaction reporting page built as a frontend technical evaluation.

The project uses a Mock HTTP API because no real backend was provided. The implementation focuses on server-side-like filtering and pagination, request cancellation, URL state synchronization, and performance.

## Features

* 500+ mock transaction records
* HTTP Mock API with simulated network latency
* Server-side-like:

  * Pagination
  * Search
  * Status filtering
  * Date-range filtering
* `totalCount` calculated before pagination
* Loading, empty, error, and retry states
* Request cancellation with `AbortController`
* Race-condition protection with request IDs
* URL synchronization for filters and pagination
* Browser Back / Forward support
* 300ms search debounce
* Accessibility attributes for loading and error states

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
│   └── queryParams.ts
├── App.vue
└── main.ts
```

### Responsibilities

| Layer               | Responsibility                                       |
| ------------------- | ---------------------------------------------------- |
| Components          | UI, filters, table, pagination and user interaction  |
| Store               | Application state, query state and request lifecycle |
| Service             | HTTP data access and error handling                  |
| Mock API            | Filtering, pagination, latency and error simulation  |
| Router / Composable | URL ↔ Pinia state synchronization                    |
| Utils               | Query parameter parsing, building and comparison     |
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

For deterministic error testing:

```text
/api/transactions?mockError=true
```

returns HTTP 500. The UI displays the error state and provides a Retry action.

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

## Assignment Requirements

| Requirement                     | Status |
| ------------------------------- | ------ |
| 500+ mock records               | ✅      |
| Mock API / Service              | ✅      |
| Pagination                      | ✅      |
| Search                          | ✅      |
| Status filter                   | ✅      |
| Date-range filter               | ✅      |
| `totalCount`                    | ✅      |
| Simulated network latency       | ✅      |
| Error simulation                | ✅      |
| Page-only data fetching         | ✅      |
| Loading / Empty / Error states  | ✅      |
| Request cancellation            | ✅      |
| Race-condition protection       | ✅      |
| URL state synchronization       | ✅      |
| Performance issue investigation | ✅      |

## Verification

The project was verified with:

```bash
npm run build
```

and:

```bash
git diff --check
```

Both completed successfully during implementation review.

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
