// Set the logo from the packaged file
document.getElementById('brand-logo').src = chrome.runtime.getURL('ggss.png');

// Send a message to the content script in the active tab
async function sendToActiveTab(msg) {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (!tab?.id) return;
  await chrome.tabs.sendMessage(tab.id, msg);
}

document.getElementById('scan').addEventListener('click', async () => {
  await sendToActiveTab({ type: 'GG_ANALYZE' });
  window.close(); // optional: close popup after clicking
});
