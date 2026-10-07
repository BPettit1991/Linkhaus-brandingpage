// Default categories and "what it's for" notes, matched on the file's path inside kit/.
// They recognise the standard deliverables by name, whatever the brand prefix, so most kits
// need no rules of their own. brand.config.json "rules" are checked first and override these.
// Each rule: [pattern, category, title or null (derive from file name), description].
export const DEFAULT_RULES = [
  [/^README\.md$/, 'guides', 'Brand kit README', 'Specs for colours, type, video, platforms and printing. Start here.'],
  [/^style-guide\.html$/, 'guides', 'Brand style guide', 'The visual guide: logos, palette, typography and usage rules.'],
  [/^guides\//, 'guides', null, 'Brand guidance document.'],

  [/badge/, 'badge', null, 'Circular badge or seal: social profile images, stickers, window decals, presentations.'],
  [/^logos\/.*(?:(full|stacked|primary).*light-bg|light-bg.*(full|stacked|primary))/, 'logos', null, 'Primary logo for white or light backgrounds: letterhead, documents, light signage.'],
  [/^logos\/.*(?:(full|stacked|primary).*dark-bg|dark-bg.*(full|stacked|primary))/, 'logos', null, 'Primary logo for black or dark backgrounds: dark apparel, dark signage, video.'],
  [/^logos\/.*(?:horizontal.*light-bg)/, 'logos', null, 'Horizontal lockup for wide spaces on light backgrounds: email headers, vehicle sides, banners.'],
  [/^logos\/.*(?:horizontal.*dark-bg)/, 'logos', null, 'Horizontal lockup for wide spaces on dark backgrounds: website header, dark banners.'],
  [/^logos\/.*(?:wordmark)/, 'logos', null, 'Wordmark without the icon, for when the icon already appears nearby.'],
  [/^logos\/.*(?:icon|symbol|mark-only)/, 'logos', null, 'The icon on its own: app icons, favicons, small spaces, embroidery.'],
  [/^logos\/.*(?:mono-|one-colou?r)/, 'logos', null, 'One-colour logo for vinyl cutting, embroidery, engraving and stamps.'],
  [/^logos\/.*(?:favicon|apple-touch)/, 'logos', null, 'Browser and phone home-screen icon.'],
  [/^logos\//, 'logos', null, 'Logo file.'],

  [/^colou?rs\//, 'colours', null, 'Brand colours as code: CSS variables and JSON with usage notes.'],
  [/(OFL|LICEN[CS]E)[^/]*\.txt$/i, 'fonts', null, 'Font licence. Keep it with the font files.'],
  [/^fonts\//, 'fonts', null, 'Brand font file.'],

  [/^social\/profile\//, 'social', null, 'Profile photo, circle-safe: Facebook, Instagram, LinkedIn, Google Business.'],
  [/^social\/.*(?:facebook.*cover|cover.*facebook|^social\/covers\/.*facebook)/, 'social', null, 'Facebook page cover. Content stays inside the mobile crop.'],
  [/^social\/.*(?:linkedin)/, 'social', null, 'LinkedIn banner. Kept clear of where the profile photo sits.'],
  [/^social\/.*(?:(^|[-/])x-(header|cover|banner)|twitter)/, 'social', null, 'X (Twitter) header.'],
  [/^social\/.*(?:youtube)/, 'social', null, 'YouTube channel banner. Content sits inside the area YouTube shows on every device.'],
  [/^social\/.*(?:google)/, 'social', null, 'Google Business Profile image.'],
  [/^social\/posts\//, 'social', null, 'Ready-to-post image for Instagram and Facebook.'],
  [/^social\/stories\//, 'social', null, '1080×1920 story. Clear of the top and bottom app controls.'],
  [/^social\//, 'social', null, 'Social media image.'],

  [/^print\/.*(?:business-card.*light-back)/, 'print', null, 'Business card with a light back for writing on. 90×55 mm with bleed.'],
  [/^print\/.*(?:business-card)/, 'print', null, 'Business card, 90×55 mm with bleed.'],
  [/^print\/.*(?:letterhead)/, 'print', null, 'Letterhead. Use as a document background or have it printed.'],
  [/^print\/.*(?:compliments)/, 'print', null, 'DL compliments slip (210×99 mm).'],
  [/^print\/.*(?:site-sign|yard-sign|corflute)/, 'print', null, 'Site sign for corflute or ACM, with bleed.'],
  [/^print\/.*(?:magnet|vehicle|van-)/, 'print', null, 'Vehicle signage, with bleed.'],
  [/^print\/.*(?:label|sticker)/, 'print', null, 'Label or sticker, with bleed.'],
  [/^print\/.*(?:flyer|brochure|dl-)/, 'print', null, 'Flyer or brochure, print-ready.'],
  [/^print\//, 'print', null, 'Print-ready file.'],

  [/^digital\/.*(?:email-signature)/, 'digital', 'Email signature', 'Email signature for Gmail and Outlook. Open it, replace the name and role, copy and paste into settings.'],
  [/^digital\/.*(?:video-call|zoom|teams-background)/, 'digital', 'Video-call background', 'Zoom, Teams and Google Meet background.'],
  [/^digital\/.*(?:og-image|share-image|open-graph)/, 'digital', null, 'Link-preview image (1200×630) for websites and social shares.'],
  [/^digital\//, 'digital', null, 'Digital asset.'],

  [/^video\/.*(?:film-30s)/, 'video', null, '30 s brand film.'],
  [/^video\/.*(?:film-15s-credentials|15s-credentials)/, 'video', null, '15 s ad with credentials. For A/B testing against the main 15 s cut.'],
  [/^video\/.*(?:film-15s)/, 'video', null, '15 s ad cut.'],
  [/^video\/.*(?:sting|logo-reveal|intro|outro)/, 'video', null, 'Short logo sting: intro or outro for videos, stories and presentations.'],
  [/^video\/.*(?:\.(wav|mp3|m4a)$)/, 'video', null, 'Soundtrack master. Check its licence before reuse elsewhere.'],
  [/^video\//, 'video', null, 'Video file.'],
];

// Aspect ratios recognised in video file names (…-16x9.mp4) for the details line.
export const ASPECT = {
  '16x9': [1920, 1080, 'Widescreen: YouTube, website, Facebook feed'],
  '9x16': [1080, 1920, 'Vertical: Reels, Stories, TikTok'],
  '1x1': [1080, 1080, 'Square: Instagram and Facebook feed, LinkedIn'],
  '4x5': [1080, 1350, 'Portrait: Instagram and Facebook feed'],
};
