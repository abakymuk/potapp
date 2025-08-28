The job failed due to several ESLint errors and unresolved imports. Here’s how to fix the main issues:

### 1. ESLint Import Order Errors

- Errors like "`next/error` import should occur before import of `posthog-js`" and "`react` import should occur after import of `posthog-js/react`" indicate import statements are in the wrong order.
- Solution: Reorder your imports in affected files according to your ESLint config. Group and order imports as prescribed.

Example fix for import order:
```tsx
// Before
import posthog from 'posthog-js';
import Error from 'next/error';

// After
import Error from 'next/error';
import posthog from 'posthog-js';
```

### 2. Unable to Resolve Module Errors

- Errors like "Unable to resolve path to module 'react'" and "Unable to resolve path to module 'next/error'" mean dependencies aren't installed or the path is incorrect.
- Solution: Ensure required dependencies are installed:
  ```sh
  pnpm install react next posthog-js
  ```
- If you use workspaces, run install from the root and check package.json for missing dependencies.

### 3. `.eslintignore` Warning

- The warning says `.eslintignore` is deprecated. Add the `ignores` property to your `eslint.config.js` ([migration guide](https://eslint.org/docs/latest/use/configure/migration-guide#ignoring-files)).

Example:
```js
// eslint.config.js
module.exports = {
  ignores: ['node_modules/', 'dist/', '*.test.tsx']
};
```

### 4. Usage of Undefined Variables

- Errors like `'process' is not defined` and `'require' is not defined` suggest you are using Node-specific variables in a non-Node context (like front-end code).
- Solution: Replace `require` with ES module imports and avoid using `process` on the client side. If you need environment variables, use Next.js environment variable support.

Example:
```js
// Before
const something = require('some-module');
console.log(process.env.MY_VAR);

// After
import something from 'some-module';
// Use Next.js env support for environment variables
```

### 5. Fixable Errors

- Run ESLint with the `--fix` option to automatically fix many issues:
  ```sh
  pnpm lint --fix
  ```

---

#### Summary
- Reorder your imports as per the ESLint config in all affected files.
- Ensure all required modules are installed.
- Migrate `.eslintignore` rules to `eslint.config.js`.
- Use ES module imports and avoid Node.js globals in client code.
- Run `pnpm lint --fix` to auto-resolve many errors.

Links to affected files (with your job's ref):
- [apps/web/app/global-error.tsx](https://github.com/abakymuk/potapp/blob/29e459eed38df04cfd0818edf515e0b761e2d7e3/apps/web/app/global-error.tsx)
- [apps/web/app/providers.tsx](https://github.com/abakymuk/potapp/blob/29e459eed38df04cfd0818edf515e0b761e2d7e3/apps/web/app/providers.tsx)
- [packages/lib/src/ff/index.ts](https://github.com/abakymuk/potapp/blob/29e459eed38df04cfd0818edf515e0b761e2d7e3/packages/lib/src/ff/index.ts)
- [packages/lib/src/ff/web.ts](https://github.com/abakymuk/potapp/blob/29e459eed38df04cfd0818edf515e0b761e2d7e3/packages/lib/src/ff/web.ts)

Apply these changes and rerun your CI workflow. If you want specific code fixes for any file, let me know!

Run pnpm lint

> potlucky@ lint /home/runner/work/potapp/potapp
> eslint .

(node:2374) ESLintIgnoreWarning: The ".eslintignore" file is no longer supported. Switch to using the "ignores" property in "eslint.config.js": https://eslint.org/docs/latest/use/configure/migration-guide#ignoring-files
(Use `node --trace-warnings ...` to show where the warning was created)

/home/runner/work/potapp/potapp/apps/web/app/error.tsx
Warning:   4:27  warning  Unable to resolve path to module 'react'  import/no-unresolved

/home/runner/work/potapp/potapp/apps/web/app/ff-demo/client.tsx
Warning:   2:44  warning  Unable to resolve path to module 'react'  import/no-unresolved

/home/runner/work/potapp/potapp/apps/web/app/global-error.tsx
Error:   4:1   error    `next/error` import should occur before import of `posthog-js`           import/order
Warning:   4:23  warning  Unable to resolve path to module 'next/error'                            import/no-unresolved
Warning:   5:27  warning  Unable to resolve path to module 'react'                                 import/no-unresolved
Warning:   9:3   warning  'reset' is defined but never used. Allowed unused args must match /^_/u  @typescript-eslint/no-unused-vars

/home/runner/work/potapp/potapp/apps/web/app/page.tsx
Warning:   4:34  warning  Unable to resolve path to module 'react'  import/no-unresolved

/home/runner/work/potapp/potapp/apps/web/app/providers.tsx
Warning:   3:10  warning  'usePathname' is defined but never used. Allowed unused vars must match /^_/u      @typescript-eslint/no-unused-vars
Warning:   3:23  warning  'useSearchParams' is defined but never used. Allowed unused vars must match /^_/u  @typescript-eslint/no-unused-vars
Warning:   3:46  warning  Unable to resolve path to module 'next/navigation'                                 import/no-unresolved
Error:   4:1   error    `react` import should occur after import of `posthog-js/react`                     import/order
Warning:   4:27  warning  Unable to resolve path to module 'react'                                           import/no-unresolved
Error:   5:1   error    There should be no empty line within import group                                  import/order
Error:   5:1   error    `posthog-js/react` import should occur after import of `posthog-js`                import/order
Warning:   5:10  warning  'usePostHog' is defined but never used. Allowed unused vars must match /^_/u       @typescript-eslint/no-unused-vars

/home/runner/work/potapp/potapp/apps/web/instrumentation-client.js
Error:   3:14  error  'process' is not defined  no-undef
Error:   4:13  error  'process' is not defined  no-undef

/home/runner/work/potapp/potapp/apps/web/instrumentation.js
Warning:    5:52  warning  'context' is defined but never used. Allowed unused args must match /^_/u  @typescript-eslint/no-unused-vars
Error:    6:7   error    'process' is not defined                                                   no-undef
Error:    7:34  error    Require statement not part of import statement                             @typescript-eslint/no-var-requires
Error:    7:34  error    'require' is not defined                                                   no-undef
Error:   21:11  error    'console' is not defined                                                   no-undef

/home/runner/work/potapp/potapp/apps/worker/src/routes/ff-demo.ts
Warning:   2:52  warning  'env' is defined but never used. Allowed unused args must match /^_/u                  @typescript-eslint/no-unused-vars
Warning:   5:9   warning  'distinctId' is assigned a value but never used. Allowed unused vars must match /^_/u  @typescript-eslint/no-unused-vars

/home/runner/work/potapp/potapp/packages/lib/src/ff/index.ts
Error:   3:1  error  `./types` type import should occur before import of `./web`  import/order

/home/runner/work/potapp/potapp/packages/lib/src/ff/web.ts
Error:   1:1  error  There should be at least one empty line between import groups  import/order

✖ 26 problems (12 errors, 14 warnings)
  6 errors and 0 warnings potentially fixable with the `--fix` option.

 ELIFECYCLE  Command failed with exit code 1.
Error: Process completed with exit code 1.