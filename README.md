  # Transaction Report

  A frontend technical evaluation project for displaying transaction reports with a focus on scalable data handling, server-side-like filtering/pagination, request cancellation, and race-condition prevention.

  The project uses a Mock API/Service because no real backend API was provided.

  ---

  ## Tech Stack

  - Vue 3
  - TypeScript
  - Pinia
  - Vite
  - CSS
  - Mock API/Service

  ---

  ## Project Requirements

  | Requirement                              | Status                              |
  | ---------------------------------------- | ----------------------------------- |
  | 500+ transaction records                 | Implemented                         |
  | Mock API/Service                         | Implemented                         |
  | Pagination                               | Implemented                         |
  | Search                                   | Implemented                         |
  | Status filter                            | Implemented                         |
  | Date-range filter                        | Implemented                         |
  | `totalCount`                             | Implemented                         |
  | Network latency simulation               | Implemented                         |
  | Large dataset approach (page-only fetch) | Implemented                         |
  | Loading / Empty / Error states           | Implemented                         |
  | Concurrent request safety                | Implemented                         |

  ---

  ## Development

  Install dependencies:

  ```bash
  npm install
  ```

  Run the development server:

  ```bash
  npm run dev
  ```

  Build the project:

  ```bash
  npm run build
  ```

  ---

  ## Architecture

  ```text
  src/
  ├── components/
  │   └── transactions/
  │       └── TransactionList.vue
  ├── mocks/
  │   └── transactions.ts
  ├── services/
  │   └── transaction.service.ts
  ├── stores/
  │   └── transaction.store.ts
  ├── types/
  │   └── transaction.ts
  ├── App.vue
  ├── main.ts
  └── style.css
  ```

  ### Responsibility of each layer

  | Layer          | Responsibility                                                                        |
  | -------------- | ------------------------------------------------------------------------------------- |
  | **Types**      | Shared TypeScript models and query/response contracts                                 |
  | **Mocks**      | Mock transaction dataset (500+ records, generated programmatically)                   |
  | **Services**   | API-like data access: filtering, pagination, latency simulation, request cancellation |
  | **Store**      | Application state and coordination between UI and service                             |
  | **Components** | Presenting transaction data and user interactions                                     |

  ---

  ## Current Implementation

  ### Transaction Data

  A mock dataset containing **500+ transaction records** is generated programmatically.

  Each transaction contains:

  | Field             | Type                                  |
  | ----------------- | ------------------------------------- |
  | `id`              | number                                |
  | `cardNumber`      | string                                |
  | `amount`          | number                                |
  | `status`          | `Successful` \| `Failed` \| `Pending` |
  | `transactionDate` | string (ISO)                          |
  | `customerName`    | string                                |

  ---

  ### Mock API / Service

  `MockTransactionService` implements the same interface a real HTTP API would expose. It accepts a query object:

  ```ts
  {
    page: number
    pageSize: number
    search: string
    status?: 'Successful' | 'Failed' | 'Pending'
    fromDate: string
    toDate: string
  }
  ```

  And returns:

  ```ts
  {
    data: Transaction[]
    totalCount: number
  }
  ```

  The service applies filters in order, calculates `totalCount` on the filtered set, then slices the result for the requested page:

  ```text
  500 total records
  ↓  search / status / date filters
  120 matching records   ← totalCount
  ↓  pagination slice
  10 records returned    ← data
  ```

  This mirrors the expected frontend contract of a server-side paginated API: the store receives and keeps only the records for the current page, while filtering, counting, and pagination are handled by the service layer. With a real backend, the same contract can be backed by database-level filtering and pagination without requiring the frontend to load the full dataset.

  ---

  ### Filters

  | Filter         | Behaviour                                                                |
  | -------------- | ------------------------------------------------------------------------ |
  | **Search**     | Case-insensitive match on `customerName` and `cardNumber`                |
  | **Status**     | Exact match on `status`                                                  |
  | **Date range** | `fromDate` inclusive at `00:00:00`, `toDate` inclusive at `23:59:59.999` |

  All filters are applied before pagination so `totalCount` always reflects the number of matching records.

  ---

  ### Search UI

  A search input is rendered in `TransactionList.vue` and connected directly to the store's `setSearch()` action.

  ```vue
  <input
    v-model="searchInput"
    type="search"
    placeholder="Search by customer or card number"
    @input="onSearch"
  />
  ```

  ```ts
  function onSearch() {
    transactionStore.setSearch(searchInput.value);
  }
  ```

  `setSearch()` in the store:

  1. Updates `query.search`.
  2. Resets `query.page` to `1` — so a search performed on any page always returns results starting from page 1.
  3. Calls `fetchTransactions()`, which goes through the Mock API/Service.

  No filtering is done inside the component. The service applies the search across `customerName` and `cardNumber` (case-insensitive), recalculates `totalCount` for the filtered set, and returns only the records for the current page.

  `totalCount` is displayed below the search input and updates with every search response.

  Loading, error, empty-state, and race-condition handling are entirely managed by the existing store — the Search UI does not add any parallel logic for these.

  ---

  ### Status Filter UI

  A status dropdown is rendered in `TransactionList.vue` alongside the search input and connected directly to the store's `setStatus()` action.

  ```vue
  <select
    v-model="statusSelect"
    @change="onStatusChange"
  >
    <option value="">All</option>
    <option value="Successful">Successful</option>
    <option value="Failed">Failed</option>
    <option value="Pending">Pending</option>
  </select>
  ```

  ```ts
  const statusSelect = ref<TransactionQuery['status'] | ''>('')

  function onStatusChange() {
    transactionStore.setStatus(statusSelect.value || undefined)
  }
  ```

  Selecting **All** sets `statusSelect` to `''`. The expression `statusSelect.value || undefined` converts the empty string to `undefined`, which clears the status filter so all statuses are returned.

  `setStatus()` in the store:

  1. Updates `query.status` (`undefined` when "All" is selected).
  2. Resets `query.page` to `1` — so a status change on any page always returns results from page 1.
  3. Calls `fetchTransactions()`, which goes through the Mock API/Service.

  No filtering is done inside the component. The service applies an exact match on `status` when the filter is set, recalculates `totalCount` for the filtered set, and returns only the records for the current page.

  `totalCount` updates with every status change response.

  Existing Search UI, loading, error, empty-state, request cancellation, and race-condition handling remain unchanged.

  ---

  ### Date Range Filter UI

  Two native date inputs are rendered in `TransactionList.vue` alongside the search input and status filter, connected directly to the store's `setFromDate()` and `setToDate()` actions.

  ```vue
  <label>
    From
    <input
      v-model="fromDate"
      type="date"
      @change="onFromDateChange"
    />
  </label>

  <label>
    To
    <input
      v-model="toDate"
      type="date"
      @change="onToDateChange"
    />
  </label>
  ```

  ```ts
  const fromDate = ref('')
  const toDate = ref('')

  function onFromDateChange() {
    transactionStore.setFromDate(fromDate.value)
  }

  function onToDateChange() {
    transactionStore.setToDate(toDate.value)
  }
  ```

  Clearing either input sets its value to `''`, which the service interprets as "no date constraint" for that boundary.

  `setFromDate()` and `setToDate()` in the store:

  1. Update `query.fromDate` or `query.toDate`.
  2. Reset `query.page` to `1` — so a date change on any page always returns results from page 1.
  3. Call `fetchTransactions()`, which goes through the Mock API/Service.

  No filtering is done inside the component. The service applies the date range filter:

  - `fromDate` is **inclusive** — the service sets `00:00:00.000` on the from boundary.
  - `toDate` is **inclusive** — the service sets `23:59:59.999` on the to boundary.

  Date filtering is applied before pagination, so `totalCount` always reflects the number of records that match all active filters (search, status, and date range combined).

  Loading, error, empty-state, request cancellation, and race-condition handling are entirely managed by the existing store — the Date Range Filter UI does not add any parallel logic for these.

  ---

  ### Pagination UI

  A standard pagination control section is rendered in `TransactionList.vue`, utilizing `currentPage`, `totalPages`, and methods to handle page changes.

  - **`page/pageSize`:** The frontend sends `query.page` and `query.pageSize` (default: 10) to the Mock Service. The service calculates the requested slice and returns only that page of transactions.
  - **totalCount:** Reflects the count of items that match all current filters, calculated inside the service before slicing.
  - **totalPages calculation:** A computed property `Math.ceil(totalCount.value / query.value.pageSize)` tracks the total number of pages.
  - **Previous/Next behavior:**
    - Clicking "Previous" decrements the page. The button is disabled when `currentPage <= 1`.
    - Clicking "Next" increments the page. The button is disabled when `currentPage >= totalPages`.
  - **Page reset:** Any time a filter is applied (Search, Status, or Date Range), `query.page` safely resets back to `1` automatically in the store to ensure accurate mapping of new results.
  - **Payload efficiency:** The frontend strictly requests and receives only the items for the current page; results are not accumulated or cached across pages, mirroring production application memory management.

  ---

  ### Loading / Empty / Error States

  All three states are driven exclusively by the store's `loading`, `error`, and `totalCount` refs. The component contains no parallel logic.

  #### Loading

  While `loading` is `true` a `<p role="status" aria-live="polite">Loading...</p>` is shown. The error and results sections are behind `v-else-if` / `v-else`, so they are never rendered while a request is in progress.

  #### Empty

  When `loading` is `false`, `error` is `null`, and `totalCount === 0`, the component renders `<p role="status">No transactions found.</p>`. The transaction list and pagination controls are inside a nested `v-else` block that only renders when `totalCount > 0`, so they never appear alongside the empty message.

  The empty state is reached correctly for:
  - no filters + zero records in the dataset
  - search with no matching customer name or card number
  - status or date-range filter producing zero results
  - any combination of the above

  #### Error

  When `loading` is `false` and `error` is a non-null string, a `<div role="alert">` is rendered containing the error message and a **Retry** button. The `v-else-if` placement guarantees that no stale transaction rows are visible in the error state.

  The Retry button calls `transactionStore.fetchTransactions()` directly, which reuses the existing store/service flow (including request cancellation and race-condition protection) without duplicating any logic in the component.

  #### State transitions verified

  | Scenario                         | Observed result                                   |
  | -------------------------------- | ------------------------------------------------- |
  | Loading → Success                | Transactions render after loading clears          |
  | Loading → Empty (search no-hit)  | "No transactions found." shown; pagination hidden |
  | Loading → Error                  | Error message + Retry button shown; no stale rows |
  | Error → Retry → Success          | Retry clears error; transactions reload           |
  | Filter change while loading      | Previous request aborted; only latest result used |
  | AbortError on fast filter change | Not shown as a user-facing error                  |
  | Pagination                       | Page navigation still works; totalCount unchanged |
  | Status + Search combined filter  | Correct empty state when combined result is zero  |

  ---

  ### Simulated Network Latency

  The service simulates a random delay between **200 ms and 800 ms** per request. The delay is intentionally variable to make concurrent-request scenarios visible during development.

  The timer is connected to an `AbortSignal`: if the request is cancelled, the timer is cleared immediately and the promise rejects with an `AbortError`.

  ---

  ## Request Cancellation & Race-Condition Handling

  When the user changes a filter or page quickly, multiple requests can be in flight at the same time. Without protection, an older slow request could overwrite the result of a newer faster one.

  The store uses two complementary mechanisms to prevent this.

  ### AbortController — cancels the in-flight request

  ```ts
  currentController?.abort();
  currentController = new AbortController();
  ```

  Before starting a new request the previous controller is aborted. The service listens to the signal and rejects the promise immediately, stopping unnecessary work.

  ### Request ID — guards against stale responses

  ```ts
  const thisRequestId = ++requestId;
  ```

  Each call captures its own ID. When the response arrives, the store checks whether this is still the latest request:

  ```ts
  if (thisRequestId !== requestId) return;
  ```

  This handles the edge case where aborting does not immediately stop a promise from settling (e.g. the abort arrives after `simulateLatency` resolves but before the outer `await` returns).

  ### Combined result

  | Scenario                                         | Behaviour                                                     |
  | ------------------------------------------------ | ------------------------------------------------------------- |
  | Older request responds after a newer one started | Response is silently discarded                                |
  | Request is aborted (`AbortError`)                | No error shown; newer request manages its own state           |
  | Only the latest request                          | Controls `loading`, `error`, `transactions`, and `totalCount` |

  ---

  ## State Management

  The Pinia store (`transaction.store.ts`) uses **setup-store syntax** so that `currentController` and `requestId` live as per-instance closure variables rather than module-level globals.

  The store exposes:

  | Item                  | Kind   | Description                             |
  | --------------------- | ------ | --------------------------------------- |
  | `transactions`        | `ref`  | Current page of results                 |
  | `totalCount`          | `ref`  | Total matching records across all pages |
  | `loading`             | `ref`  | Whether a request is in progress        |
  | `error`               | `ref`  | Error message from the latest request   |
  | `query`               | `ref`  | Current filter + pagination parameters  |
  | `fetchTransactions()` | action | Fetches using current `query`           |
  | `setPage(page)`       | action | Updates page and refetches              |
  | `setSearch(search)`   | action | Resets to page 1 and refetches          |
  | `setStatus(status)`   | action | Resets to page 1 and refetches          |
  | `setFromDate(fromDate)` | action | Resets to page 1 and refetches        |
  | `setToDate(toDate)`   | action | Resets to page 1 and refetches          |

  `currentController` and `requestId` are **not** returned from the setup function and are therefore invisible to Vue's reactivity system and Pinia devtools.

  ---

  ## Performance Considerations

  The application is designed as if the backend could contain millions of records.

  ```text
  Frontend → Query → Service → Filter → Count → Paginate → Return page only
  ```

  The transaction store keeps only the currently requested page of transaction results — it does not accumulate or cache previous pages. The service abstraction decouples the store and UI from the mock data source, making it easier to replace `MockTransactionService` with a real HTTP API while keeping the store and component layer largely unchanged.

  ---

  ## Implementation Progress

  ### Backend / Data Layer

  - [x] 500+ mock transaction records
  - [x] Mock API/Service
  - [x] Pagination
  - [x] Search
  - [x] Status filter
  - [x] Date-range filter
  - [x] `totalCount`
  - [x] Variable network latency
  - [x] Request cancellation (`AbortController`)
  - [x] Race-condition protection (request ID guard)
  - [x] Frontend receives only the requested page

  ### UI

  - [x] Basic transaction table
  - [x] Loading state foundation
  - [x] Error state foundation
  - [x] Empty state foundation
  - [x] Search UI
  - [x] Status filter UI
  - [x] Date-range filter UI
  - [x] Pagination UI
  - [x] Final loading / empty / error UX
  - [ ] Final performance and rendering review

  ### Documentation

  - [x] Architecture documentation
  - [x] Mock API behaviour documented
  - [x] Race-condition strategy documented
  - [x] Final implementation checklist
  - [x] AI usage documentation

  ## Performance Investigation

  ### Search `@input` — Unnecessary Request Frequency

  #### Observation

  The search input fires `@input` on every keystroke. There is no delay (debounce) between the keystroke and the request. Typing a multi-character word like `"Ali"` triggers one service call per character.

  #### Reproduction steps

  1. Open the app.
  2. Click the search input.
  3. Type `"Ali"` — three keystrokes in rapid succession (~80 ms apart, realistic fast typing).
  4. Observe how many `fetchTransactions()` calls are made and which ones are aborted.

  #### Evidence

  Instrumented the exact `@input → onSearch() → setSearch() → fetchTransactions()` call chain using the real service parameters (200–800 ms latency, 500 records). Two scenarios were measured.

  **Scenario A — realistic fast typing (~80 ms/keystroke):**

  ```text
  Typed: "Ali"   (3 keystrokes × 80 ms apart)

  Service calls started:       3
  Call #1  search="A"    outcome=aborted-during-latency   ran for  82 ms
  Call #2  search="Al"   outcome=aborted-during-latency   ran for  80 ms
  Call #3  search="Ali"  outcome=resolved                 ran for ~407 ms

  Store request outcomes:
    requestId=1  search="A"    → aborted  (stale, discarded)
    requestId=2  search="Al"   → aborted  (stale, discarded)
    requestId=3  search="Ali"  → applied  (totalCount=109)

  loading=true  flips: 1  (set on first keystroke, stays true throughout)
  loading=false flips: 1  (cleared only after "Ali" resolves)

  Final state: loading=false, error=null, totalCount=109, search="Ali"
  ✓ Only "Ali" wrote to store
  ✓ Stale "A" and "Al" results never reached the store
  ```

  **Scenario B — very fast typing (~20 ms/keystroke):**

  ```text
  Service calls started:       3
  Call #1  search="A"    outcome=aborted-during-latency   ran for 22 ms
  Call #2  search="Al"   outcome=aborted-during-latency   ran for 21 ms
  Call #3  search="Ali"  outcome=resolved

  Aborted-before-latency (free): 0
  Aborted-during-latency  (timer started then cancelled): 2
  ```

  Even at 20 ms between keystrokes the `simulateLatency` timer starts before the abort signal arrives, so every discarded call still allocates a `setTimeout` and an `AbortController` before being cancelled.

  #### Hypotheses considered

  | Hypothesis | Verdict |
  | --- | --- |
  | Stale result from "A" or "Al" could overwrite the "Ali" result | ✗ False — request ID guard and AbortController both prevent this |
  | Loading state could flicker on each keystroke | ✗ False — `loading` stays `true` throughout typing, flips once at the end |
  | The UI could show an empty state mid-typing | ✗ False — `loading=true` hides the results/empty branch entirely |
  | Extra service calls are made per keystroke | ✓ True — one call per keystroke, no batching |
  | Cancelled calls still do some work before being aborted | ✓ True — the `simulateLatency` timer starts before the abort fires |

  #### Root cause

  The search input fires `@input` synchronously on every keystroke. There is no delay between the event and `setSearch()`. Every `setSearch()` unconditionally calls `fetchTransactions()`. The result is one service call per character typed.

  The service's `simulateLatency` function starts a `setTimeout` before listening for the abort signal. Because the JavaScript event loop does not immediately switch to the abort handler (it only fires on the next microtask/macrotask after `abort()` is called), the latency timer always starts — and runs for however many milliseconds pass before the next keystroke — before it is cancelled. At 80 ms/keystroke, calls #1 and #2 each ran their timer for ~80 ms before being aborted.

  #### Current impact

  | Aspect | Impact |
  | --- | --- |
  | **Correctness** | None — stale results never reach the store |
  | **Race conditions** | None — both AbortController and request ID guard work correctly |
  | **User-visible flicker** | None — `loading` is held `true` from first keystroke to final result |
  | **Unnecessary work** | Moderate — N−1 extra requests are started and aborted for every N-character word; each discarded call still starts a latency timer and sets up event listeners |
  | **Real backend impact** | Would send N−1 extra HTTP requests to a real server per typed word; each request would reach the server before the abort signal could cancel it |

  #### No fix applied (investigation stage)

  The investigation stage made no code changes. The fix was applied in the following implementation step.

  ---

  ### Fix

  #### What was changed

  A 300 ms debounce was added to the `onSearch()` handler in [`TransactionList.vue`](src/components/transactions/TransactionList.vue). Only the search handler was changed — status filter, date filters, and pagination are unaffected.

  ```ts
  // Before
  function onSearch() {
    transactionStore.setSearch(searchInput.value)
  }

  // After
  let searchDebounceTimer: ReturnType<typeof setTimeout> | undefined

  function onSearch() {
    clearTimeout(searchDebounceTimer)
    searchDebounceTimer = setTimeout(() => {
      transactionStore.setSearch(searchInput.value)
    }, 300)
  }

  onUnmounted(() => {
    clearTimeout(searchDebounceTimer)
  })
  ```

  No new dependency was introduced. No store, service, or type files were modified.

  #### Why 300ms

  300 ms is a widely used debounce value for search inputs. It sits comfortably above a realistic fast-typing inter-keystroke interval (~80–120 ms), so a word typed quickly is fully captured before the request fires. It is short enough that the delay feels responsive to the user. Values below ~200 ms start to miss keystrokes for fast typists; values above ~500 ms feel sluggish.

  #### Before / after request counts

  Measured with the real service parameters (200–800 ms latency, 500 records):

  ```text
  Scenario: type "Ali" at ~80 ms/keystroke

  BEFORE (no debounce)
    Keystrokes : 3
    Requests   : 3
    Call #1  search="A"    → aborted-during-latency
    Call #2  search="Al"   → aborted-during-latency
    Call #3  search="Ali"  → resolved  (totalCount=109)

  AFTER (300ms debounce)
    Keystrokes : 3
    Requests   : 1
    Call #1  search="Ali"  → resolved  (totalCount=109)
  ```

  The final result (`totalCount=109`) is identical in both cases.

  #### Post-fix behavior

  | Scenario | Requests fired | Result |
  | --- | --- | --- |
  | Type `"A"`, wait >300ms | 1 | `totalCount=472` |
  | Type `"Ali"` quickly (~30ms/key) | 1 | `totalCount=109` |
  | Type `"Ali"` then immediately `"Ali Ahmadi"` | 1 | `totalCount` for `"Ali Ahmadi"` |
  | Clear search after search | 1 | all 500 records returned |

  #### AbortController remains as a second layer of protection

  The debounce reduces unnecessary calls at the component boundary. The AbortController and request ID guard in the store remain unchanged and continue to protect against stale responses in any case where two debounced requests do overlap (e.g., the user types, pauses, then resumes typing while the first request is still in flight).

  Measured verification: when two debounced requests overlap, the first is aborted and only the second (latest) result is applied to the store.

  #### Page reset behavior

  Unchanged. `setSearch()` in the store still resets `query.page` to `1` before calling `fetchTransactions()`. This runs after the debounce delay, so the page resets at the moment the request fires, not at each keystroke.

  ---

  ## AI Usage

  AI tools were used as development assistance during the implementation for:

  - Reviewing the project architecture
  - Discussing implementation approaches
  - Reviewing TypeScript/Vue code
  - Identifying race-condition scenarios
  - Improving request cancellation handling
  - Reviewing the implementation against the assignment requirements
  - Generating and refining parts of the mock data/service structure

  The final implementation was reviewed manually and kept focused on the requirements of the assignment.

  ---

  ## Why This Approach?

  The goal was not simply to create a table with 500 hardcoded records.

  The implementation models how the frontend would work with a real backend containing a potentially large amount of transaction data. The Mock API handles filtering, counting, pagination, latency, and cancellation — while the frontend only works with the current page.

  This makes it straightforward to replace the Mock API with a real HTTP API later without changing the overall frontend architecture.
