---
description: Systematic debugging of a symptom, reproduce, isolate, root-cause, failing test, fix, verify. No guess-patching.
argument-hint: <symptom>
---

Debug this symptom: $ARGUMENTS

Follow the `superpowers:systematic-debugging` approach for the full method behind this loop, do not re-derive it here. Do not skip a phase, and never propose a fix before root cause is established.

## The loop, in order

1. **Reproduce.** Get the symptom failing on demand, deterministically, before touching any code. If it cannot be reproduced yet, that is the first job, not a reason to guess.
2. **Isolate.** Narrow the reproduction to the smallest input, code path, or config that still triggers it. Cut everything unrelated out of the loop.
3. **Root-cause.** Explain why the isolated case fails, in terms of the actual mechanism, not a plausible-sounding guess. If the explanation cannot predict the symptom's exact shape, it is not the root cause yet, keep digging.
4. **Write a failing test.** Encode the isolated reproduction as a test that fails for the confirmed root cause, before writing the fix. This test is what proves the fix later and prevents regression.
5. **Fix.** Change the minimum code needed to address the root cause, not the symptom's surface. Resist patching around the failure at the call site if the defect lives deeper.
6. **Verify.** Run the failing test and confirm it now passes, then run the full relevant test suite to confirm nothing else broke. Only report the bug fixed once this evidence exists.

**No guess-patching.** A fix proposed without a reproduced, isolated, root-caused failure behind it is not acceptable output for this command, go back to step 1.

Report each phase's outcome briefly, then the final fix and verification evidence. Stay terse.
