# Terms-and-Conditions-Scanner

Timeline
- Development: Dec 2024 - Jan 2025 
- Public github release: aug 2025
>Goose Guard is a chrome extension that scans Terms/Privacy pages, highlights risky clauses, and shows an explainable risk score with examples.

How it works:
>loads the content script that walks visible text nodes on the page
>Uses rule patterns + a basic logistic ML assist (per-clause vocab + weights → sigmoid probability).
>Data sharing uses a proximity check (verb like “share/sell/disclose” near “personal/data/third party”).
>Wraps hits in colored highlights with tooltips; a side panel shows the risk score, counts, reasons, and top Examples with confidence levels

Tech stack:
Chrome MV3, Javascript, HTML, Regex, chrome runtime messaging

How to use:
>Download all the files on this repo and make a dir
>Go to chrome://extensions -> developer mode -> load unpack and load the dir on here.
>open any terms and conditions page (it has to be html)
>Run the extension
>In order to reset, refresh the page and repeat the above process

User interface:

<img width="321" height="237" alt="image" src="https://github.com/user-attachments/assets/b2705abe-6f6a-4433-bece-a74acd06f3ef" />
<img width="300" height="420" alt="image" src="https://github.com/user-attachments/assets/38732bf3-8806-4ea6-b3ee-9b0d5e053e02" />



