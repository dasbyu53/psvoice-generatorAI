# GitHub Pages deployment notes

1. Add the GitHub Actions secret `VITE_CONVEX_URL` with your Convex deployment URL.
2. Push this project to GitHub and enable Pages -> Build and deployment -> GitHub Actions.
3. The Vite build uses a relative base (`./`) so assets work under a repository subpath.
4. `404.html` is included as a fallback for client-side routes.
5. If `VITE_CONVEX_URL` is missing, the app now shows a clear configuration message instead of a blank white screen.
