# QuickInfo

QuickInfo is a lightweight Chrome extension for keeping reusable job application answers close at hand. Find a detail, copy its answer, and paste it into an application form.

## Features

- Search saved labels and answers.
- Copy an answer to the clipboard with one click.
- Add, edit, and delete your own details.
- Prevent duplicate labels, ignoring capitalization and surrounding spaces.
- Start with common labels for email, phone, LinkedIn, portfolio, location, and experience. Answers are blank until you add them.
- Keep your data in Chrome on your device with `chrome.storage.local`.

## Install locally

1. Download or clone this repository.
2. Open `chrome://extensions` in Chrome.
3. Turn on **Developer mode**.
4. Click **Load unpacked** and select the `quick-info` folder.
5. Pin QuickInfo from Chrome’s Extensions menu for easy access.

## Use

- Click **+** to add a detail.
- Select a label or its **···** button to edit it. The editor also has a delete action.
- Select **Copy** to copy a saved answer. Blank answers cannot be copied.
- Search by label or answer, or press `/` to focus the search field.

## Privacy

QuickInfo stores the information you enter using Chrome’s local extension storage. It does not send your details to a server. The extension requests storage access to save your entries and clipboard access to copy them.

## Project files

- `manifest.json` — Chrome Extension Manifest V3 configuration.
- `popup.html`, `popup.css`, `popup.js` — extension popup interface and behavior.

