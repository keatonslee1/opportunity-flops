/**
 * Service worker.
 *
 * The only job here is making the toolbar button open the side panel. All
 * calculator logic lives in the panel itself, so this worker stays idle and
 * unloads immediately.
 */

chrome.runtime.onInstalled.addListener(() => {
  chrome.sidePanel
    .setPanelBehavior({ openPanelOnActionClick: true })
    .catch((error) => console.error("setPanelBehavior failed", error));
});
