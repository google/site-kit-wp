# Feature Flags System

Site Kit uses a feature flag system to control the availability of experimental features and gradual rollouts.

## Core Architecture

### Feature Flag Definition
Feature flags are defined in `/feature-flags.json` at the project root:

```json
[
  "googleTagGateway",
  "gtagUserData",
  "pdfGeneration",
  "proactiveUserEngagement",
  "rrmExpressSetup",
  "setupFlowRefresh",
  "setupFlowRefreshPhase4"
]
```

This list changes over time as features are added and removed; treat
`/feature-flags.json` itself as the source of truth for the current set.

### Server Integration
Feature flags are passed from the server to the client via a global JavaScript variable:
- `global._googlesitekitBaseData.enabledFeatures` contains the array of enabled feature flags
- This data is set during PHP rendering and made available to the frontend

### JavaScript Implementation
The feature flag system consists of several key files:

#### `/assets/js/features/index.js`
Core feature flag utilities:

```javascript
// Global set of enabled features from server
export const enabledFeatures = new Set(
    global?._googlesitekitBaseData?.enabledFeatures || []
);

// Check if a feature is enabled
export function isFeatureEnabled(
    feature,
    _enabledFeatures = enabledFeatures
) {
    if ( ! ( _enabledFeatures instanceof Set ) ) {
        return false;
    }
    return _enabledFeatures.has( feature );
}
```

#### `/assets/js/hooks/useFeature.js`
React hook for feature flag checking:

```javascript
import { useContext } from '@wordpress/element';
import FeaturesContext from '@/js/components/FeaturesProvider/FeaturesContext';
import { isFeatureEnabled } from '@/js/features';

export function useFeature( feature ) {
    const enabledFeatures = useContext( FeaturesContext );
    return isFeatureEnabled( feature, enabledFeatures );
}
```

#### `/assets/js/components/FeaturesProvider/FeaturesContext.js`
React context for feature flags:

```javascript
import { createContext } from '@wordpress/element';
import { enabledFeatures } from '@/js/features';

const FeaturesContext = createContext( enabledFeatures );
export default FeaturesContext;
```

## Usage Patterns

### Component Level Feature Flags
Components can conditionally render features based on flags:

```javascript
import { useFeature } from '@/js/hooks/useFeature';

export default function SettingsView() {
    const gtgEnabled = useFeature( 'googleTagGateway' );
    const gtagUserDataEnabled = useFeature( 'gtagUserData' );

    return (
        <div>
            {gtgEnabled && <GoogleTagGatewaySettings />}
            {gtagUserDataEnabled && <EnhancedConversionsSettings />}
        </div>
    );
}
```

> Internal imports use the `@/` path alias (`@/*` → `assets/*`), so
> `useFeature` is imported from `@/js/hooks/useFeature` regardless of where the
> consuming component lives. In TypeScript components the same hook is used
> unchanged; type props with an interface per
> [`component-conventions.md`](./component-conventions.md).

### Notification Level Feature Flags
Notifications can be controlled by feature flags using the `featureFlag` property:

```javascript
// In notification registration
{
    Component: GoogleTagGatewaySetupBanner,
    featureFlag: 'googleTagGateway',
    // other notification properties...
}
```

The notification system automatically checks feature flags when determining which notifications to show:

```javascript
// From shouldNotificationBeAddedToQueue.js
if (
    notification?.featureFlag &&
    ! isFeatureEnabled(
        notification.featureFlag,
        _enabledFeatureFlags ? new Set( _enabledFeatureFlags ) : undefined
    )
) {
    return false;
}
```

## Implementation Guidelines

### Adding New Feature Flags
1. Add the flag name to `/feature-flags.json`
2. Use `useFeature` hook in React components
3. Use `isFeatureEnabled` function in utility code
4. Add `featureFlag` property to notifications if needed

### Best Practices
- Feature flag names should be camelCase
- Use descriptive names that clearly indicate the feature
- Always provide fallback behavior when flags are disabled
- Test both enabled and disabled states
- Remove feature flags and conditional code after full rollout

### Testing
Feature flags support testing through several mechanisms:

- The custom `render` and `renderHook` from `@tests/js/test-utils` accept a
  `features` option that enables flags for the duration of the test:

  ```javascript
  import { renderHook } from '@tests/js/test-utils';
  import { useFeature } from '@/js/hooks/useFeature';

  const { result } = renderHook( () => useFeature( 'pdfGeneration' ), {
      features: [ 'pdfGeneration' ],
  } );
  ```

  Under the hood this calls `setEnabledFeatures( features )` (also exported from
  `@tests/js/test-utils`), which mutates the shared `enabledFeatures` `Set`. The
  global test setup clears it in an `afterEach`, so flags don't leak between
  tests.
- The `isFeatureEnabled` helper accepts an optional `_enabledFeatures` `Set`
  argument for direct unit testing.
- `shouldNotificationBeAddedToQueue` accepts an `_enabledFeatureFlags` array
  (passed through to `isFeatureEnabled` as a `Set`) for notification-queue tests.
- Test files are co-located and may be `.test.js`, `.test.ts`, or `.test.tsx`.
  Run a single file with `npm -w tests/js run test:js -- <path>`.
