# Admin Panel: Real-time Updates + Shop Analytics

## Part 1: Reusable Polling Hook

**Why polling over WebSocket:** No WS infrastructure exists. Polling is proven (TicketSection already uses 30s polling with fingerprinting). Adding socket.io would be a large infrastructure change for minimal benefit at this scale.

### New file: `ran-frontend/hooks/usePolling.ts`
- Generic hook: `usePolling<T>(fetchFn, intervalMs, options?)`
- Returns `{ data, loading, lastUpdated, refresh, error }`
- Auto-pauses when `document.hidden` (tab not visible)
- Starts on mount, stops on unmount
- Silent error handling (polling shouldn't crash UI)
- Optional `enabled` flag to conditionally enable/disable

### Integration:
- **Dashboard**: 60s polling for stats, trend, school/class data
- **Tickets**: Migrate existing 30s polling to shared hook (keep beep/fingerprint logic)
- **Shop items/categories**: 60s polling
- **Account/Character/News/Downloads/Logs**: These are search-based, keep manual refresh only

---

## Part 2: Shop Analytics Backend

### New file: `ran-backend/src/services/admin-panel/shopAnalytics.service.js`

**5 analytics queries:**

1. **`getTopItems(days?)`** — Most purchased items
   ```sql
   SELECT TOP 10 l.ProductNum, m.ItemMain, m.ItemSub,
     COUNT(*) AS purchaseCount, SUM(l.ItemMoney) AS totalRevenue
   FROM ShopPurchaseLog l
   JOIN ShopItemMap m ON l.ProductNum = m.ProductNum
   WHERE (@days IS NULL OR l.Date >= DATEADD(day, -@days, GETUTCDATE()))
   GROUP BY l.ProductNum, m.ItemMain, m.ItemSub
   ORDER BY purchaseCount DESC
   ```

2. **`getRevenueSummary()`** — Total revenue by currency
   ```sql
   SELECT m.ShopType,
     COUNT(*) AS totalPurchases,
     SUM(l.ItemMoney) AS totalRevenue
   FROM ShopPurchaseLog l
   JOIN ShopItemMap m ON l.ProductNum = m.ProductNum
   GROUP BY m.ShopType
   ```

3. **`getDailySalesTrend(days=30)`** — Daily purchase count + revenue
   ```sql
   SELECT CAST(l.Date AS DATE) AS saleDate,
     COUNT(*) AS purchaseCount, SUM(l.ItemMoney) AS revenue
   FROM ShopPurchaseLog l
   WHERE l.Date >= DATEADD(day, -@days, GETUTCDATE())
   GROUP BY CAST(l.Date AS DATE)
   ORDER BY saleDate
   ```

4. **`getRecentPurchases(limit=20)`** — Live activity feed
   ```sql
   SELECT TOP 20 l.idx, l.ProductNum, l.ItemMain, l.ItemSub,
     l.ItemMoney, l.Date, l.UserID, m.ShopType
   FROM ShopPurchaseLog l
   LEFT JOIN ShopItemMap m ON l.ProductNum = m.ProductNum
   ORDER BY l.idx DESC
   ```

5. **`getShopOverview()`** — Summary KPIs
   - Total items in shop (active)
   - Total purchases (all time)
   - Purchases today
   - Out-of-stock items count

### New file: `ran-backend/src/api/controllers/admin-panel/shopAnalytics.controller.js`
- One controller per query, standard pattern

### Modified: `ran-backend/src/api/routes/admin-panel/shop.routes.js`
Add routes (all behind `requireStaff`):
- `GET /analytics/overview` — KPI summary
- `GET /analytics/top-items?days=` — Top items (optional days filter)
- `GET /analytics/revenue` — Revenue by currency
- `GET /analytics/daily-trend?days=30` — Daily sales trend
- `GET /analytics/recent` — Recent purchases feed

---

## Part 3: Shop Analytics Frontend

### New file: `ran-frontend/lib/data/admin.shopAnalytics.data.ts`
- API functions + TypeScript interfaces for all 5 endpoints

### New file: `ran-frontend/components/admin/sections/ShopAnalyticsSection.tsx`
- **KPI row**: Total purchases, Revenue (eP), Revenue (vP), Out-of-stock items, Purchases today
- **Daily Sales Trend**: Line/bar chart (recharts already available or simple CSS bars)
- **Top Items Table**: With tab switcher (All Time | 30 Days | 7 Days)
- **Recent Purchases Feed**: Auto-refreshing list with polling (30s)
- All sections use `usePolling` for auto-refresh

### Modified: `ran-frontend/components/app-sidebar.tsx`
- Add "Shop Analytics" nav item under shop group

### Modified: `ran-frontend/app/(admin)/dashboard/page.tsx`
- Add ShopAnalyticsSection to section switcher
- Wrap dashboard stats with `usePolling` for auto-refresh

---

## File Change Summary

### New files (6):
1. `ran-frontend/hooks/usePolling.ts`
2. `ran-backend/src/services/admin-panel/shopAnalytics.service.js`
3. `ran-backend/src/api/controllers/admin-panel/shopAnalytics.controller.js`
4. `ran-frontend/lib/data/admin.shopAnalytics.data.ts`
5. `ran-frontend/components/admin/sections/ShopAnalyticsSection.tsx`

### Modified files (4):
1. `ran-backend/src/api/routes/admin-panel/shop.routes.js` — add analytics routes
2. `ran-frontend/components/app-sidebar.tsx` — add nav item
3. `ran-frontend/app/(admin)/dashboard/page.tsx` — add polling + analytics section
4. `ran-frontend/components/admin/sections/TicketSection.tsx` — migrate to usePolling (optional, can keep as-is)
