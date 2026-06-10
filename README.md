# CSV Qty Consolidator for Vercel

A Vercel-ready Next.js web app that lets users upload multiple CSV files and download a consolidated CSV.

## Output columns

- BLItemNo
- ColorName
- Qty
- Source

## What it does

- Accepts any number of CSV files.
- Extracts BLItemNo, ColorName and Qty.
- Removes Total Qty / Total Weight footer rows and every row after them.
- Finds the highest Qty for each BLItemNo + ColorName combination.
- Shows the sources where each combination exists.

## Deploy to Vercel

1. Create a GitHub repository.
2. Upload all files in this folder.
3. Go to https://vercel.com/new
4. Import the GitHub repository.
5. Framework preset: Next.js
6. Click Deploy.

## Local testing

```bash
npm install
npm run dev
```

Then open:

```text
http://localhost:3000
```
