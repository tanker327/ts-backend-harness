# Retry and Loop Bounding Policy

## CI retries
- Maximum 2 retries for flaky CI failures before investigating root cause
- If the same test fails 3 times, stop retrying and diagnose

## Agent self-repair loops
- If a fix attempt fails twice in a row (same error), stop and report to the user
- Do not blindly retry the same approach — diagnose why it failed
- After 3 consecutive failed tool calls, pause and reassess strategy

## Test-fix cycles
- If a test fix introduces a new test failure, revert and rethink
- Do not chain more than 3 fix attempts without running the full suite

## When to escalate
- Error you don't understand after reading source and docs
- Circular dependency between fixes
- Environment issue (missing tool, permission, network)
