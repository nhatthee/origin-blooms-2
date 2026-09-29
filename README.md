# Origin Blooms landing page

Next.js App Router + TypeScript + plain CSS. The design uses purple and white, with sections for the orchid collection, brand story, process, and wholesale contact.

## Open in Cursor

1. Open the `origin-blooms` folder.
2. Run `npm install` in Cursor's terminal.
3. Run `npm run dev` and open `http://localhost:3000`.

## Add your photos

Put your own optimized WebP photographs in `public/images/` with these exact names:

| File | Placement | Suggested shape |
| --- | --- | --- |
| `hero-orchids.webp` | Main hero | portrait, ~1400 × 1700 px |
| `sonia-purple.webp` | Sonia Purple card | portrait, ~900 × 1100 px |
| `big-white.webp` | Big White card | portrait, ~900 × 1100 px |
| `loose-blooms.webp` | Loose Blooms card | portrait, ~900 × 1100 px |
| `origin-story.webp` | Story section | landscape, ~1400 × 1100 px |

The gradient placeholders remain visible until those files exist. After adding images, remove the `photo-hint` labels in `app/page.tsx` and consider reducing the color overlays in `app/globals.css`. Use photographs of your actual products for any live product claims. "Big White" is presented as a commercial product name; verify its botanical designation with the supplier before adding scientific details.

## Activate inquiries

Create `.env.local` in the project root:

```env
NEXT_PUBLIC_CONTACT_EMAIL=your-real-business-email@example.com
```

Restart `npm run dev`. The Request a Quote button will open the visitor's email application. For production, replace the mail link with your preferred form or CRM if needed. No inquiry address, pricing, guaranteed availability, or delivery promise is assumed by this starter.

## Main files

- `app/page.tsx` — copy, product cards, sections, and navigation
- `app/globals.css` — all layout, colors, and responsive styling
- `app/layout.tsx` — site metadata
