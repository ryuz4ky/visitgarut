# Deploy artifacts

`visitgarut-build-a9ce849.tgz` is a standalone production build (`.next` with `standalone`, plus `.youtube-worker`) of commit a9ce849 (branch `seo/audit-fixes-20261116`, fast-forwarded into `main`: SEO audit fixes on top of the live 2b9667c).
It was built off the host because the host's Next.js build can exceed the account's 1 GiB memory limit. It has no `public/` and no `.next/standalone/.next/static`: the deploy step copies `.next/static` into the standalone tree, the photos from the checkout's `public/`, and the WebP copies from the running build.

sha256: b39dcb4b4bfd2a7aa9f1e0003b74c1f5f3b66a92e6b6910a3609329054f0bd37
