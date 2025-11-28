# Feature Flags System

Site Kit uses a comprehensive feature flag system to control the availability of experimental features and gradual rollouts.

## Core Architecture

### Feature Flag Definition
Feature flags are defined in `/feature-flags.json` at the project root:

```json
[
  "adsPax",
  "gtagUserData", 
  "googleTagGateway",
  "privacySandboxModule"
]
```

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
import FeaturesContext from '../components/FeaturesProvider/FeaturesContext';
import { isFeatureEnabled } from '../features';

export function useFeature( feature ) {
    const enabledFeatures = useContext( FeaturesContext );
    return isFeatureEnabled( feature, enabledFeatures );
}
```

#### `/assets/js/components/FeaturesProvider/FeaturesContext.js`
React context for feature flags:

```javascript
import { createContext } from '@wordpress/element';
import { enabledFeatures } from '../../features';

const FeaturesContext = createContext( enabledFeatures );
export default FeaturesContext;
```

## Usage Patterns

### Component Level Feature Flags
Components can conditionally render features based on flags:

```javascript
import { useFeature } from '../../../../hooks/useFeature';

export default function SettingsView() {
    const gtgEnabled = useFeature( 'googleTagGateway' );
    const paxEnabled = useFeature( 'adsPax' );
    
    return (
        <div>
            {gtgEnabled && <GoogleTagGatewaySettings />}
            {paxEnabled && <AdsPaxConfiguration />}
        </div>
    );
}
```

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
Feature flags support testing through optional parameters:
- `_enabledFeatureFlags` parameter in `isFeatureEnabled` for unit tests
- Context providers can be mocked for component testing
- Notification queue testing supports feature flag simulation
