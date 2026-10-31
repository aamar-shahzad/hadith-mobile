# Hadith Mobile

Mobile-friendly Hadith PWA (same idea as [quran-mobile](https://github.com/aamar-shahzad/quran-mobile)).

## Features

- Kutub al-Sittah, Nawawi 40, Qudsi, and more
- Multiple languages per collection (English, Arabic, Urdu, Bengali, etc.) via [fawazahmed0/hadith-api](https://github.com/fawazahmed0/hadith-api)
- Chapter filter, search, bookmarks, copy
- Installable PWA with offline cache for hadith JSON

## GitHub Pages

Deploy from `main` branch, root folder `/`.

Live URL (after publish): `https://aamar-shahzad.github.io/hadith-mobile/`

Update `manifest.webmanifest` `start_url` / `scope` if you use a different repo name.

## Local preview

```bash
python3 -m http.server 8080
# open http://localhost:8080
```
