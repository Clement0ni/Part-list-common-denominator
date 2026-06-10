export const metadata = {
  title: "CSV Qty Consolidator",
  description: "Consolidate BLItemNo, ColorName and Qty from multiple CSV files."
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
