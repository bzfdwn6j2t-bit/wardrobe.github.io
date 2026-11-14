# WARDROBE v6 — AI mannequin preview

This release restores an actual AI-generated mannequin image in the Stylist. It uses Cloudflare Workers AI with FLUX.1 Schnell.

## Important: keep your wardrobe data

- Replace the existing seven website files in your GitHub Pages repository: `index.html`, `styles.css`, `app.js`, `sw.js`, `manifest.webmanifest`, `icon.svg`, and `README.md`.
- Do not delete the repository.
- Do not upload `cloudflare-worker.js` to the GitHub Pages site. It is the private server-side worker code that you paste into Cloudflare.
- Your clothing records and photos remain in the browser's IndexedDB on your iPhone. This update does not intentionally clear them.

## What the AI preview does

WARDROBE selects clothes from your saved wardrobe and builds a text description using each selected item's name, colour, style and notes. Cloudflare's FLUX.1 Schnell model generates a full-length mannequin fashion image from that description.

The actual wardrobe photographs are **not** uploaded to the AI provider. The generated result is an approximation: it may change garment details, patterns, fit or colour slightly. This is text-to-image, not virtual try-on.

## Set up the free Cloudflare connection (one time)

Cloudflare currently includes 10,000 Workers AI Neurons per day on its Free plan. FLUX.1 Schnell is included in Workers AI. The free allowance resets daily at 00:00 UTC. If the daily allowance is used up, image generation pauses until the reset; this Worker does not automatically upgrade or add paid billing.

1. Create or sign in to a free Cloudflare account: https://dash.cloudflare.com/
2. Open **Workers & Pages** and choose **Create** / **Create Worker**.
3. Create a Worker and give it a name such as `wardrobe-ai`.
4. Open the Worker editor. Replace the starter code with the complete contents of `cloudflare-worker.js` from this ZIP, then save and deploy.
5. Open the Worker **Settings** → **Bindings** (sometimes shown as **Settings → Bindings**). Add a **Workers AI** binding with the variable name exactly `AI`. Save.
6. In **Settings** → **Variables and Secrets**, add a secret named exactly `WARDROBE_TOKEN`. Use the private key supplied in the setup instructions in this conversation. Save and redeploy if Cloudflare asks.
7. Copy the Worker URL shown in the Cloudflare dashboard. It will look similar to `https://wardrobe-ai.your-account.workers.dev`.

## Connect WARDROBE on your iPhone

After GitHub Pages has updated:

1. Open WARDROBE and go to **Stylist**.
2. Under **AI MANNEQUIN PREVIEW · FREE**, paste your Worker URL.
3. Paste the same private access key you saved as the `WARDROBE_TOKEN` secret.
4. Tap **Save AI connection**.
5. Generate an outfit. The preview will show a loading message while Cloudflare creates the image.

The Worker URL and access key are saved only in this browser's local storage, not in the public GitHub repository.

## Privacy and safety

- Only the selected garments' text descriptions are sent to Cloudflare; the stored garment photos are not.
- The Worker checks the website origin and requires the private bearer key.
- FLUX.1 Schnell is listed by Cloudflare as a zero-data-retention model.
- Do not share the private access key. If you believe it has been exposed, replace the `WARDROBE_TOKEN` secret in Cloudflare and update the saved key in WARDROBE.

## Free usage and limitations

Cloudflare's current Workers AI Free plan allowance is 10,000 Neurons per day. FLUX.1 Schnell is charged in Neurons according to image tiles and steps. This Worker requests a single 512×512-tile image at four steps, so the allowance should support many previews per day, but exact daily capacity can vary with model pricing and platform changes. If the free allowance is exhausted, requests fail until the daily reset. No paid plan is required for this configuration.

Cloudflare's free Worker plan also has request limits. The Worker is designed for a personal wardrobe app, not public high-volume use.

## Troubleshooting

- **Incorrect private access key:** confirm the `WARDROBE_TOKEN` secret and the key saved in WARDROBE match exactly.
- **Missing AI binding:** add a Workers AI binding named `AI`.
- **Daily allowance reached:** wait until 00:00 UTC.
- **Worker URL error:** use the complete `https://...workers.dev` URL.
- **Old app still showing:** close and reopen the installed WARDROBE app after GitHub Pages deploys. The service-worker cache has been bumped to v6.


## Version 7 — activity-aware outfit suggestions

- The Stylist page now includes a free-text activity/setting field.
- The activity is included in the AI mannequin prompt.
- Outfit selection treats layers as optional rather than automatically adding one.
- Suit blazers are excluded from smart-casual activities (such as wine tasting) unless the setting is explicitly formal or cold weather makes a layer appropriate.
- Weather and activity cues can still trigger practical outerwear.

To update the website, replace the seven website files in your existing GitHub Pages repository. Keep your Cloudflare Worker and its settings unchanged; this release does not require changes to Cloudflare.


## Version 8 — wardrobe editing restored

- Tap a wardrobe item to open its details, then choose **Edit item**.
- Edit its name, category, colour, style, warmth, notes and photo. If you do not choose a new photo, the existing photo is retained.
- Notes are also displayed directly on wardrobe cards.
- Existing item IDs and IndexedDB records are retained; edits update the existing record rather than creating a duplicate.


## Version 9 — reliable editing and compatibility-aware styling

- Each wardrobe card now has a visible **Edit item** action; tapping the card still opens its detail view.
- Restored backup items are normalised on import (stable unique IDs and safe defaults for missing fields) so they remain editable.
- Outfit selection now scores top/bottom pairs for colour contrast, formality and occasion before choosing; shoes are selected for dress-code compatibility rather than at random.
- Olive combinations are guided by menswear advice: olive trousers are commonly paired with cream/white, navy, pale blue and grey; avoid near-identical green-on-green unless clearly tonal. The generator uses these as starting heuristics, not absolute rules.
- The chosen outfit includes a short explanation of its palette and any weather/activity layer.

### Styling research used as inspiration
- Quietly Well Dressed, “What Colours Go With Olive Green Pants?” (updated 3 October 2026): https://quietlywelldressed.com/journal/what-colours-go-with-olive-green-pants-men
- Smart Casual Attire, “Smart Casual Color Combinations That Always Work”: https://www.smartcasualattire.com/what-to-wear/colour/colour-combinations-smart-casual/
- Jos. A. Bank, “How to Wear Chinos” (2026): https://www.josbank.com/blog/how-to-wear-chinos/
- John Lewis & Partners, “Guide to Smart Casual Dressing for Men” (2026): https://www.johnlewis.com/content/fashion/men/guide-to-smart-casual-dressing-for-men

These are inspiration sources for compatibility heuristics, not a guarantee that any one pairing will suit every shade, cut or personal preference.
