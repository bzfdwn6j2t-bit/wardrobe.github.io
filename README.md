# WARDROBE — iPhone PWA prototype

## Included in this prototype
- Add individual clothing photos from the iPhone camera or photo library.
- Store wardrobe pieces locally in the browser.
- Categorise items by tops, bottoms, layers, shoes and accessories.
- Generate basic outfit combinations from the wardrobe you entered.
- Browse and save starter inspiration concepts.
- Create a trip packing list from destination, dates, activities and a forecast lookup.
- Installable PWA shell with a service worker.

## Important prototype limitations
This is a working front-end prototype, not yet a production AI stylist. Item attributes are entered manually; there is no image-recognition service, account sync, cloud backup, advanced colour/fit matching or AI preference learning yet. Inspiration cards are starter visual concepts rather than a live editorial feed. Weather lookup uses the free Open-Meteo geocoding/forecast endpoints and requires internet access. Data and photos are stored in this browser on this device; clearing browser website data will remove them.

## Run locally
Serve this folder over localhost (not by opening index.html as a file). For example, with Python installed:
`python3 -m http.server 8000`
Then visit `http://localhost:8000`.

## Install on iPhone
1. Upload the folder contents to an HTTPS static host (for example, a static site host).
2. Open the HTTPS site in Safari on your iPhone.
3. Tap Share → Add to Home Screen.
4. Enable “Open as Web App” if shown, then tap Add.

For a public production app, add secure cloud storage/authentication, server-side AI image tagging and styling, a real inspiration image/content source with licensing, and privacy/backup controls before inviting other users.


## Updated storage and trip planning
- Clothing records and photos now use IndexedDB on the iPhone, with migration from the original localStorage collection.
- Use **Export backup** in the Wardrobe tab to save a JSON backup to Files. Use **Restore backup** to restore it.
- Trip planner can look up scheduled flight arrival details by flight number and flight date using Navo24's free beta schedule API. Coverage and free lookup limits apply; schedules may not be available for every airline/airport or dates beyond its published window. Always verify with the airline.
- The app remains a free, local-first PWA hosted on GitHub Pages. There is no account sync.


## Flight lookup robustness update
- Flight number matching now requires an exact operating or codeshare number rather than silently selecting the first returned record.
- Arrival parsing accepts documented `arrival_utc` timestamps and supported local-arrival fields, and uses the destination's IANA time zone when available.
- Clearer messages distinguish missing coverage, rate limits, and missing arrival/time-zone data.
- Flight results are scheduled timetable data, not live operational tracking; verify with the airline.


## AI mannequin previews and trend-aware styling
- Each generated outfit requests a single full-body mannequin preview from the public Pollinations image endpoint. Only text descriptions of the selected clothing are sent; user-uploaded clothing photos are not sent to the image service.
- The preview is an AI approximation based on item names, colours and notes, not an exact try-on or faithful reproduction of the photographed garments. The public free endpoint is rate-limited and availability can change; if unavailable, the outfit itself still displays.
- Discover includes links to current menswear trend coverage and a curated trend summary. The outfit selector lightly favours matching items already in the user's wardrobe (wide-leg/relaxed silhouettes, tailored outerwear, charcoal/chocolate/green tones, leather/denim and stripes). It does not scrape fashion websites live; the editorial trend references need periodic updating.
- No image-generation API key or paid account is required for the prototype endpoint. It is a third-party service, not an OpenAI image-generation integration.


## Version 5 — exact-photo outfit boards
The Stylist now presents the selected wardrobe pieces using their original saved photos in a clean editorial outfit board. It no longer calls the third-party text-to-image service for outfit previews. This is fully free, keeps garment imagery faithful to the uploaded photos, and does not transmit those photos to an image-generation provider. It is a visual outfit board, not a photorealistic virtual try-on.
