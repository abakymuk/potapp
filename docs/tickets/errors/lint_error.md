@potlucky/lib:typecheck
Error: @potlucky/lib#typecheck: command (/home/runner/work/potapp/potapp/packages/lib) /home/runner/setup-pnpm/node_modules/.bin/pnpm run typecheck exited (2)
cache miss, executing 040841b1e8dc1e9f

> @potlucky/lib@0.0.0 typecheck /home/runner/work/potapp/potapp/packages/lib
> tsc -p tsconfig.json --noEmit

Error: src/ff/decide.ts(4,20): error TS2580: Cannot find name 'process'. Do you need to install type definitions for node? Try `npm i --save-dev @types/node`.
Error: src/ff/decide.ts(29,23): error TS2304: Cannot find name 'fetch'.
Error: src/ff/index.ts(9,28): error TS2580: Cannot find name 'process'. Do you need to install type definitions for node? Try `npm i --save-dev @types/node`.
Error: src/ff/index.ts(10,32): error TS2580: Cannot find name 'process'. Do you need to install type definitions for node? Try `npm i --save-dev @types/node`.
Error: src/ff/web.ts(8,15): error TS2580: Cannot find name 'process'. Do you need to install type definitions for node? Try `npm i --save-dev @types/node`.
Error: src/ff/web.ts(9,16): error TS2580: Cannot find name 'process'. Do you need to install type definitions for node? Try `npm i --save-dev @types/node`.
 ELIFECYCLE  Command failed with exit code 2.
Error: command finished with error: command (/home/runner/work/potapp/potapp/packages/lib) /home/runner/setup-pnpm/node_modules/.bin/pnpm run typecheck exited (2)
ERROR run failed: command exited (2)

Tasks: 3 successful, 4 total
Cached: 0 cached, 4 total
Time: 2.166s
Failed: @potlucky/lib#typecheck

 ELIFECYCLE  Command failed with exit code 2.
Error: Process completed with exit code 2.
