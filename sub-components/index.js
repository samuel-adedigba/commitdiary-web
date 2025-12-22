/**
 * The folder sub-components contains sub component of all the pages,
 * so here you will find folder names which are listed in root pages.
 */

// sub components for /pages/settings
import DeleteAccount from "sub-components/settings/DeleteAccount";
import GeneralSetting from "sub-components/settings/GeneralSetting";

// sub components for dashboard
import ActiveRepositories from "sub-components/dashboard/ActiveRepositories";
import RecentCommits from "sub-components/dashboard/RecentCommits";
import StatsOverview from "sub-components/dashboard/StatsOverview";

// sub components for share widget
import UserActivityHeatmap from "sub-components/share/UserActivityHeatmap";
import RepoTabNavigation from "sub-components/share/RepoTabNavigation";

export {
  DeleteAccount,
  GeneralSetting,
  ActiveRepositories,
  RecentCommits,
  StatsOverview,
  UserActivityHeatmap,
  RepoTabNavigation,
};
