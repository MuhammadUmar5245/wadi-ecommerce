import "./globals.css";

// Fallback for paths outside /en and /ar (normally the middleware redirects these).
export default function RootNotFound() {
  return (
    <html lang="en" dir="ltr">
      <body className="flex min-h-screen items-center justify-center bg-background p-6 text-center font-sans text-foreground">
        <main>
          <p className="text-6xl font-extrabold text-primary">404</p>
          <h1 className="mt-4 text-2xl font-bold">Page not found · الصفحة غير موجودة</h1>
          <p className="mt-6 flex justify-center gap-4">
            <a href="/en" className="font-semibold text-primary underline">
              English
            </a>
            <a href="/ar" lang="ar" className="font-semibold text-primary underline">
              العربية
            </a>
          </p>
        </main>
      </body>
    </html>
  );
}
