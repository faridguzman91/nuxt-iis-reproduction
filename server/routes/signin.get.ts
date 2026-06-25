// Demonstrates the bug:
//
// sendRedirect(event, '/dashboard') always redirects to /dashboard,
// regardless of app.baseURL. When baseURL is '/' (the default) this
// accidentally works. When baseURL is '/myapp/' it silently breaks —
// the redirect lands outside the sub-path and returns 404.
//
// navigateTo('/dashboard') on the client-side DOES prepend baseURL
// and correctly reaches /myapp/dashboard. sendRedirect() does not.

export default defineEventHandler((event) => {
  return sendRedirect(event, '/dashboard', 302)
})
