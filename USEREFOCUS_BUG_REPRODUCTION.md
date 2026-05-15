# useRefocus Bug Reproduction Guide

## Quick Start

### Option 1: Use DevTools Console Directly (Quickest)

1. **Open Browser DevTools Console** (F12 or Cmd+Option+I)

2. **Navigate away from tab** → Switch to another tab or minimize browser

    - Console will show: `[useRefocus] Blur event - waiting 5000ms before sync`

3. **Simulate state change** (this is where the bug happens):

    - Run in console while waiting for the 5 seconds to elapse:

    ```javascript
    // Simulate a component re-rendering with a new callback reference
    // by temporarily dispatching another blur event to trigger hook re-init
    window.dispatchEvent( new Event( 'blur' ) );
    ```

    - Console will show: `[useRefocus] useEffect cleanup - clearing timeout`
    - **The timeout from step 2 is now cleared!** ❌

4. **Return to the tab** → Switch back to the browser tab
    - Console will show: `[useRefocus] Focus event - but timeout was cleared or not yet elapsed`
    - **BUG CONFIRMED:** The callback never executes because the timeout was cleared! ❌

---

### Option 2: Use the Reproduction Component (Most Reliable)

The reproduction component creates an interactive test environment:

#### Setup:

1. Create a test page or add to Storybook with the reproduction component:

    ```javascript
    import UseRefocusBugReproduction from '@/js/hooks/useRefocus-bug-reproduction';

    export default function TestPage() {
    	return <UseRefocusBugReproduction />;
    }
    ```

2. **Open the page in browser and open DevTools console** (F12)

#### Steps to See the Bug:

1. **Click "🔴 Leave Tab (Blur)" button**

    - Simulates blur event
    - Console shows: `[useRefocus] Blur event - waiting 5000ms before sync`
    - A 5-second timer starts

2. **Within 5 seconds, click "⚠️ Toggle State (Trigger Bug)" button**

    - This changes internal state
    - New callback reference is created (due to useCallback dependency)
    - useRefocus detects new callback in dependency array
    - Console shows: `[useRefocus] useEffect cleanup - clearing timeout` ← **The bug!**
    - The 5-second timeout set in step 1 is now **cleared prematurely**

3. **Click "🟢 Return to Tab (Focus)" button** (doesn't matter if 5 seconds have passed)
    - Simulates focus event
    - Console shows: `[useRefocus] Focus event - but timeout was cleared or not yet elapsed`
    - **Expected:** Sync Execution Count should increment
    - **Actual:** Counter doesn't change because callback never ran (BUG!)

#### Console Log Pattern (Bug Visible):

```
[useRefocus] Blur event - waiting 5000ms before sync
[useRefocus-Bug-Repro] State toggled - new callback reference will be created
[useRefocus] useEffect cleanup - clearing timeout              ← BUG: Timeout cleared!
[useRefocus] Focus event - but timeout was cleared...         ← Callback doesn't execute
(Missing: [useRefocus] onSync callback executed!)             ← BUG CONFIRMED!
```

---

## Expected Behavior (After Fix)

After the fix is applied, the pattern should be:

```
[useRefocus] Blur event - waiting 5000ms before sync
[useRefocus-Bug-Repro] State toggled - new callback reference will be created
(NO cleanup message - effect not re-initialized unnecessarily)
(Wait for 5 seconds OR click focus earlier)
[useRefocus] Timeout elapsed after 5000ms
[useRefocus] Focus event - executing callback
[useRefocus] onSync callback executed!                        ← SUCCESS!
```

---

## Why This Happens (Technical Explanation)

### Current Buggy Code:

```javascript
useEffect( () => {
	let timeout;
	let runCallback = false;

	function countIdleTime() {
		timeout = global.setTimeout( () => {
			runCallback = true;
		}, milliseconds );
	}

	function onFocus() {
		global.clearTimeout( timeout );
		if ( ! runCallback ) return;
		callback();
	}

	global.addEventListener( 'focus', onFocus );
	global.addEventListener( 'blur', countIdleTime );

	return () => {
		global.removeEventListener( 'focus', onFocus );
		global.removeEventListener( 'blur', countIdleTime );
		global.clearTimeout( timeout ); // ⚠️ Problem: clears timeout set by blur event!
	};
}, [ milliseconds, callback ] ); // ⚠️ Problem: callback in dependencies
```

### Race Condition:

1. User _blurs_ window → blur listener sets `timeout` to fire in 5000ms
2. Parent component state updates → new callback reference created
3. useEffect dependency array `[ milliseconds, callback ]` detects change
4. Cleanup function runs:
    - `global.clearTimeout( timeout )` is called
    - **The timeout set in step 1 is cleared** (never gets to fire)
5. New effect initializes with new callback
6. User _refocuses_ window → focus event fires but `runCallback` is still `false`
7. Callback never executes ❌

### The Fix:

Use `useRef` to avoid putting callback in dependency array:

-   Callback stored in ref, always has fresh reference
-   Only `milliseconds` in dependency array
-   Cleanup won't re-run when callback changes
-   Timeout set by blur won't be cleared prematurely ✅

---

## Testing Variations

### Test Case 1: Blur → State Change → Immediate Focus

-   **Shows:** Timeout cleared by state change before focus
-   **Console:** useEffect cleanup appears before focus event

### Test Case 2: Blur → Wait Full Timeout → State Change → Focus

-   **Shows:** Callback still might not run if state change happens after timeout but before focus
-   **Depends on:** Exact timing of re-render

### Test Case 3: Multiple State Changes Between Blur and Focus

-   **Shows:** Each state change clears the previous timeout
-   **Result:** Callback definitely won't execute

---

## Cleanup

After testing the bug (before applying the fix), you may want to:

1. Remove console.log statements from [assets/js/hooks/useRefocus.js](assets/js/hooks/useRefocus.js)
2. Remove the [assets/js/hooks/useRefocus-bug-reproduction.js](assets/js/hooks/useRefocus-bug-reproduction.js) test component

Or keep them for now to verify the fix works correctly!
