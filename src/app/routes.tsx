import { createHashRouter } from "react-router";
import { RootLayout } from "./components/RootLayout";
import { ProtectedRoute } from "./components/ProtectedRoute";
import { Dashboard } from "./pages/Dashboard";
import { Markets } from "./pages/Markets";
import { Stocks } from "./pages/Stocks";
import { MutualFunds } from "./pages/MutualFunds";
import { Forex } from "./pages/Forex";
import { Crypto } from "./pages/Crypto";
import { Portfolio } from "./pages/Portfolio";
import { Watchlist } from "./pages/Watchlist";
import { Insights } from "./pages/Insights";
import { News } from "./pages/News";
import { Alerts } from "./pages/Alerts";
import { Settings } from "./pages/Settings";
import { Auth } from "./pages/Auth";

export const router = createHashRouter([
  {
    path: "/auth",
    Component: Auth,
  },
  {
    path: "/",
    Component: ProtectedRoute,
    children: [
      {
        path: "",
        Component: RootLayout,
        children: [
          { index: true, Component: Dashboard },
          { path: "markets", Component: Markets },
          { path: "stocks", Component: Stocks },
          { path: "mutual-funds", Component: MutualFunds },
          { path: "forex", Component: Forex },
          { path: "crypto", Component: Crypto },
          { path: "portfolio", Component: Portfolio },
          { path: "watchlist", Component: Watchlist },
          { path: "insights", Component: Insights },
          { path: "news", Component: News },
          { path: "alerts", Component: Alerts },
          { path: "settings", Component: Settings },
        ],
      },
    ],
  },
]);
