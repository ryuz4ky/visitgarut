# Deploy artifacts

`visitgarut-build-2b9667c.tgz` is a standalone production build (`.next` with `standalone/.next/static`, plus `.youtube-worker`) of the live checkout's commit 2b9667c (homepage UX fixes on top of a86775d).
It was built off the host because the host's Next.js build was killed for memory (SIGKILL). It has no `public/`: the deploy step copies the photos and their WebP copies from the running build.

sha256: 6778651d917da295c761f9d1d281007031fc74a4f4933dc5cd6b800c3b0791b2
