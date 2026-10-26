# Local RFQ file reading

Baseline backup: 2a93387458a6711db7f2b207733e9966cd628f10 in Git history.

Both price panels read PDF (text and scanned), DOC/DOCX, XLS/XLSX, CSV/TSV/TXT, JPG/JPEG/PNG/WebP/GIF and supported files within ZIP. Reading happens in the browser. Files are not sent to a document AI service. Readers and English OCR models load from the pinned vendor CDNs. Only reviewed product codes, manufacturers and country go to the existing price-search service. Original attachments still use the separate private Attach Files control.

Users must check the extracted draft and compare it against the read-only source transcription before Find Prices. Three-column tables and labeled manufacturer/part/quantity blocks are recognized. Arbitrary prose, missing makers/quantities, complex layouts and OCR errors require correction; the app does not invent missing values. This is document extraction with assisted row recognition, not unrestricted AI interpretation.

Limits: five files, 15 MB per file, 20 MB total; 20 PDF pages, up to ten scanned PDF pages; 24 MP images; 20 ZIP entries, 40 MB expanded; no nested ZIP reading; document containers capped at 40 MB expanded. At most 50 product rows. Password-protected, malformed or unsupported documents show warnings. English OCR. Legacy DOC reading runs in an isolated worker with a 20-second timeout.

Dependencies: SheetJS 0.20.3, Mammoth 1.13.0, PDF.js 6.4.299, Tesseract.js 7.0.0, JSZip 3.10.2. Legacy DOC reader is bundled from word-extractor 1.0.4 with Browserify and its Buffer/stream dependencies. See bundled license. Existing markup, country pricing and private attachment checks remain in effect.

Favicon: existing gold mQ brand icon marinequo-192.png, linked from both HTML pages. Google decides when and whether it displays the updated icon.

Legacy DOC bundle compatibility patch: OLE UTF-16 directory names use an even byte length to match Node Buffer decoding in browser Buffer. Verified against upstream test01.doc.
