// Clicking the toolbar icon opens the side panel instead of a popup,
// so it stays open while you click into different form fields on the page.
chrome.sidePanel
  .setPanelBehavior({ openPanelOnActionClick: true })
  .catch((error) => console.error(error));
