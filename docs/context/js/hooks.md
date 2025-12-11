# Custom Hooks Architecture

Site Kit uses a comprehensive custom hooks system to encapsulate reusable logic, provide consistent APIs, and manage complex state interactions across the application.

## Hook Organization and Storage

### Global-Level Hooks Location

**Primary Location**: `/assets/js/hooks/`

All application-wide custom hooks are stored in the **`/assets/js/hooks/`** directory. This is the centralized location for hooks that are used across multiple components, modules, or contexts.

```
assets/js/hooks/
├── useActivateModuleCallback.js     # Module activation logic
├── useBreakpoint.js                 # Responsive breakpoint detection
├── useChecks.js                     # System checks and validations
├── useDashboardType.js              # Dashboard type detection
├── useDebounce.js                   # Debouncing utilities
├── useDebouncedState.js             # Debounced state management
├── useFeature.js                    # Feature flag access
├── useInView.js                     # Viewport detection
├── useInViewSelect.js               # Performance-optimized datastore selectors
├── useLatestIntersection.js         # Advanced intersection observer
├── useQueryArg.js                   # URL query parameter management
├── useViewContext.js                # Application view context
├── useViewOnly.js                   # View-only mode detection
├── useWindowSize.js                 # Window size tracking
└── useRefocus.js                    # Focus management
```

### Module-Specific Hooks

Module-specific hooks are stored within each module's directory structure:

```
assets/js/modules/[module-name]/hooks/
├── useExistingTagEffect.js          # Module-specific tag detection
├── useCustomDimensionsData.js       # Module-specific data hooks
└── useCreateCustomDimensionEffect.js # Module-specific effects
```

### Component-Specific Hooks

Component-specific hooks are co-located with their components:

```
assets/js/components/[component-name]/hooks/
├── useDisplayCTAWidget.js           # Component-specific logic
└── useNavChipHelpers.js             # Navigation-specific helpers
```

## Hook Categories and Patterns

### 1. State Management Hooks

#### Basic State Management

```javascript
import { useDebouncedState } from '../hooks/useDebouncedState';

function SearchComponent() {
    const [searchTerm, setSearchTerm] = useState('');
    
    // Debounce search input to avoid excessive API calls
    const debouncedSearchTerm = useDebouncedState(searchTerm, 300);
    
    useEffect(() => {
        if (debouncedSearchTerm) {
            // Trigger search API call
        }
    }, [debouncedSearchTerm]);
    
    return (
        <input 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search..."
        />
    );
}
```

#### URL State Management

```javascript
import useQueryArg from '../hooks/useQueryArg';

function FilterableList() {
    const [filter, setFilter] = useQueryArg('filter', 'all');
    const [sortBy, setSortBy] = useQueryArg('sort', 'name');
    
    // URL automatically updates when state changes
    // State is restored from URL on page load
    
    return (
        <div>
            <select value={filter} onChange={(e) => setFilter(e.target.value)}>
                <option value="all">All</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
            </select>
            
            <select value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
                <option value="name">Name</option>
                <option value="date">Date</option>
            </select>
        </div>
    );
}
```

### 2. Performance Optimization Hooks

#### Viewport-Based Loading

```javascript
import { useInViewSelect } from '../hooks/useInViewSelect';
import { useSelect } from 'googlesitekit-data';

function ExpensiveWidget() {
    // Only fetch data when component is in viewport
    const reportData = useInViewSelect(
        (select) => select(MODULES_ANALYTICS_4).getReport(reportOptions),
        [reportOptions]
    );
    
    // Regular useSelect for lightweight data
    const isLoading = useSelect((select) => 
        !select(MODULES_ANALYTICS_4).hasFinishedResolution('getReport', [reportOptions])
    );
    
    if (!reportData) {
        return <div>Widget not in view</div>;
    }
    
    return <div>Report data: {JSON.stringify(reportData)}</div>;
}
```

#### Debounced Operations

```javascript
import { useDebounce } from '../hooks/useDebounce';

function AutoSaveForm() {
    const [formData, setFormData] = useState({});
    const { saveSettings } = useDispatch(MODULES_ANALYTICS_4);
    
    // Debounce save operation to avoid excessive API calls
    const debouncedSave = useDebounce(
        useCallback(async (data) => {
            await saveSettings(data);
        }, [saveSettings]),
        1000  // 1 second delay
    );
    
    useEffect(() => {
        if (Object.keys(formData).length > 0) {
            debouncedSave(formData);
        }
    }, [formData, debouncedSave]);
    
    return (
        <form onChange={(e) => setFormData({...formData, [e.target.name]: e.target.value})}>
            {/* Form fields */}
        </form>
    );
}
```

### 3. Responsive Design Hooks

#### Breakpoint Detection

```javascript
import { useBreakpoint, BREAKPOINT_SMALL, BREAKPOINT_TABLET } from '../hooks/useBreakpoint';

function ResponsiveComponent() {
    const breakpoint = useBreakpoint();
    
    const isMobile = breakpoint === BREAKPOINT_SMALL;
    const isTablet = breakpoint === BREAKPOINT_TABLET;
    
    return (
        <div>
            {isMobile && <MobileLayout />}
            {isTablet && <TabletLayout />}
            {!isMobile && !isTablet && <DesktopLayout />}
        </div>
    );
}
```

#### Window Size Tracking

```javascript
import { useWindowWidth, useWindowHeight, useWindowSize } from '../hooks/useWindowSize';

function AdaptiveComponent() {
    const windowWidth = useWindowWidth();
    const windowHeight = useWindowHeight();
    const [width, height] = useWindowSize();
    
    const showSidebar = windowWidth > 1024;
    const cardColumns = Math.floor(windowWidth / 300);
    
    return (
        <div style={{ display: 'grid', gridTemplateColumns: `repeat(${cardColumns}, 1fr)` }}>
            {showSidebar && <Sidebar />}
            <MainContent />
        </div>
    );
}
```

### 4. Context and Feature Detection Hooks

#### View Context Detection

```javascript
import useViewContext from '../hooks/useViewContext';
import useDashboardType, { DASHBOARD_TYPE_MAIN, DASHBOARD_TYPE_ENTITY } from '../hooks/useDashboardType';
import useViewOnly from '../hooks/useViewOnly';

function ContextAwareComponent() {
    const viewContext = useViewContext();
    const dashboardType = useDashboardType();
    const isViewOnly = useViewOnly();
    
    if (isViewOnly) {
        return <ViewOnlyComponent />;
    }
    
    if (dashboardType === DASHBOARD_TYPE_MAIN) {
        return <MainDashboardWidget />;
    }
    
    if (dashboardType === DASHBOARD_TYPE_ENTITY) {
        return <EntityDashboardWidget />;
    }
    
    return <DefaultComponent />;
}
```

#### Feature Flag Detection

```javascript
import { useFeature } from '../hooks/useFeature';

function ConditionalFeature() {
    const isNewFeatureEnabled = useFeature('newDashboardLayout');
    const isBetaFeatureEnabled = useFeature('betaAnalytics');
    
    return (
        <div>
            {isNewFeatureEnabled && <NewDashboardLayout />}
            {isBetaFeatureEnabled && <BetaAnalyticsWidget />}
            <StandardContent />
        </div>
    );
}
```

### 5. Module Integration Hooks

#### Module Activation

```javascript
import useActivateModuleCallback from '../hooks/useActivateModuleCallback';

function ModuleConnectCTA({ moduleSlug }) {
    const activateModule = useActivateModuleCallback(moduleSlug);
    
    // Returns null if user lacks permissions or module doesn't exist
    if (!activateModule) {
        return null;
    }
    
    return (
        <button onClick={activateModule}>
            Connect {moduleSlug}
        </button>
    );
}
```

#### Module-Specific Effects

```javascript
// In analytics-4/hooks/useExistingTagEffect.js
import { useEffect, useRef } from '@wordpress/element';
import { useSelect, useDispatch } from 'googlesitekit-data';

export default function useExistingTagEffect() {
    const { setUseSnippet } = useDispatch(MODULES_ANALYTICS_4);
    
    const existingTag = useSelect((select) =>
        select(MODULES_ANALYTICS_4).getExistingTag()
    );
    const measurementID = useSelect((select) =>
        select(MODULES_ANALYTICS_4).getMeasurementID()
    );
    
    const skipEffect = useRef(true);
    
    useEffect(() => {
        if (existingTag && measurementID !== undefined) {
            if (measurementID === '' || skipEffect.current) {
                skipEffect.current = false;
                return;
            }
            
            if (measurementID === existingTag) {
                // Disable snippet if existing tag matches
                setUseSnippet(false);
            } else {
                // Enable snippet for different measurement ID
                setUseSnippet(true);
            }
        }
    }, [setUseSnippet, existingTag, measurementID]);
}

// Usage in component
function AnalyticsSettings() {
    useExistingTagEffect(); // Automatically manages snippet settings
    
    return <SettingsForm />;
}
```

### 6. Widget and Component State Hooks

#### Widget State Management

```javascript
import useWidgetStateEffect from '../googlesitekit/widgets/hooks/useWidgetStateEffect';

function ExpandableWidget({ widgetSlug }) {
    const [isExpanded, setIsExpanded] = useState(false);
    
    // Automatically set/unset widget state
    useWidgetStateEffect(
        widgetSlug,
        isExpanded ? ExpandedComponent : null,
        { expanded: isExpanded }
    );
    
    return (
        <div>
            <button onClick={() => setIsExpanded(!isExpanded)}>
                {isExpanded ? 'Collapse' : 'Expand'}
            </button>
            {/* Widget content */}
        </div>
    );
}
```

### 7. Advanced Intersection Observer Hooks

#### Latest Intersection Tracking

```javascript
import useLatestIntersection from '../hooks/useLatestIntersection';

function LazyLoadedComponent() {
    const elementRef = useRef();
    
    const intersectionEntry = useLatestIntersection(elementRef, {
        rootMargin: '100px',  // Load 100px before element enters viewport
        threshold: 0.1        // Trigger when 10% visible
    });
    
    const isVisible = intersectionEntry?.isIntersecting;
    
    return (
        <div ref={elementRef}>
            {isVisible ? <ExpensiveComponent /> : <PlaceholderComponent />}
        </div>
    );
}
```

## Hook Implementation Patterns

### 1. Custom Hook Structure

All custom hooks follow this standardized structure:

```javascript
/**
 * `useCustomHook` hook.
 *
 * Site Kit by Google, Copyright 2025 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     https://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

/**
 * External dependencies
 */
import { useCallback, useEffect } from '@wordpress/element';

/**
 * Internal dependencies
 */
import { useSelect, useDispatch } from 'googlesitekit-data';

/**
 * Custom hook description.
 *
 * @since 1.25.0
 *
 * @param {string} parameter Description of parameter.
 * @return {*} Description of return value.
 */
export default function useCustomHook(parameter) {
    // Hook implementation
    
    return hookReturnValue;
}
```

### 2. Error Handling in Hooks

```javascript
import { useState, useEffect } from '@wordpress/element';

export default function useAsyncOperation(operation) {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    
    const execute = useCallback(async (...args) => {
        setLoading(true);
        setError(null);
        
        try {
            const result = await operation(...args);
            setData(result);
            return { data: result, error: null };
        } catch (err) {
            setError(err);
            return { data: null, error: err };
        } finally {
            setLoading(false);
        }
    }, [operation]);
    
    return {
        data,
        loading,
        error,
        execute,
        reset: () => {
            setData(null);
            setError(null);
        }
    };
}
```

### 3. Datastore Integration Patterns

```javascript
import { useSelect, useDispatch } from 'googlesitekit-data';
import { useCallback } from '@wordpress/element';

export default function useModuleSettings(moduleSlug) {
    // Selectors
    const settings = useSelect((select) =>
        select(`modules/${moduleSlug}`).getSettings()
    );
    
    const hasChanges = useSelect((select) =>
        select(`modules/${moduleSlug}`).haveSettingsChanged()
    );
    
    const isSaving = useSelect((select) =>
        select(`modules/${moduleSlug}`).isDoingSaveSettings()
    );
    
    // Actions
    const { setSettings, saveSettings, rollbackSettings } = useDispatch(`modules/${moduleSlug}`);
    
    // Composed operations
    const updateSetting = useCallback((key, value) => {
        setSettings({ [key]: value });
    }, [setSettings]);
    
    const handleSave = useCallback(async () => {
        const { error } = await saveSettings();
        return { success: !error, error };
    }, [saveSettings]);
    
    return {
        settings,
        hasChanges,
        isSaving,
        updateSetting,
        saveSettings: handleSave,
        rollbackSettings
    };
}
```

### 4. Complex State Management

```javascript
import { useReducer, useCallback } from '@wordpress/element';

const actionTypes = {
    SET_LOADING: 'SET_LOADING',
    SET_DATA: 'SET_DATA',
    SET_ERROR: 'SET_ERROR',
    RESET: 'RESET'
};

function dataReducer(state, action) {
    switch (action.type) {
        case actionTypes.SET_LOADING:
            return { ...state, loading: action.payload, error: null };
        case actionTypes.SET_DATA:
            return { ...state, data: action.payload, loading: false, error: null };
        case actionTypes.SET_ERROR:
            return { ...state, error: action.payload, loading: false };
        case actionTypes.RESET:
            return { data: null, loading: false, error: null };
        default:
            return state;
    }
}

export default function useDataFetcher(fetchFunction) {
    const [state, dispatch] = useReducer(dataReducer, {
        data: null,
        loading: false,
        error: null
    });
    
    const fetchData = useCallback(async (...args) => {
        dispatch({ type: actionTypes.SET_LOADING, payload: true });
        
        try {
            const data = await fetchFunction(...args);
            dispatch({ type: actionTypes.SET_DATA, payload: data });
        } catch (error) {
            dispatch({ type: actionTypes.SET_ERROR, payload: error });
        }
    }, [fetchFunction]);
    
    const reset = useCallback(() => {
        dispatch({ type: actionTypes.RESET });
    }, []);
    
    return {
        ...state,
        fetchData,
        reset
    };
}
```

## Hook Composition Patterns

### 1. Compound Hooks

Combine multiple hooks for complex functionality:

```javascript
export default function useAnalyticsDashboard() {
    const viewContext = useViewContext();
    const isViewOnly = useViewOnly();
    const breakpoint = useBreakpoint();
    
    const isAnalyticsConnected = useSelect((select) =>
        select(MODULES_ANALYTICS_4).isConnected()
    );
    
    const reportOptions = useMemo(() => ({
        startDate: '30daysAgo',
        endDate: 'today',
        metrics: ['sessions', 'users']
    }), []);
    
    const reportData = useInViewSelect(
        (select) => select(MODULES_ANALYTICS_4).getReport(reportOptions),
        [reportOptions]
    );
    
    const showMobileLayout = breakpoint === BREAKPOINT_SMALL;
    const canViewReports = isAnalyticsConnected && !isViewOnly;
    
    return {
        viewContext,
        isViewOnly,
        breakpoint,
        showMobileLayout,
        canViewReports,
        reportData
    };
}
```

### 2. Hook Factories

Create hooks dynamically for different modules:

```javascript
function createModuleHook(moduleSlug) {
    return function useModule() {
        const isConnected = useSelect((select) =>
            select(CORE_MODULES).isModuleConnected(moduleSlug)
        );
        
        const moduleData = useSelect((select) =>
            select(`modules/${moduleSlug}`).getSettings()
        );
        
        const activateModule = useActivateModuleCallback(moduleSlug);
        
        return {
            isConnected,
            moduleData,
            activateModule
        };
    };
}

// Usage
const useAnalytics = createModuleHook('analytics-4');
const useAdSense = createModuleHook('adsense');
```

## Advanced Hook Patterns

### 1. Conditional Hook Execution

```javascript
export default function useConditionalEffect(condition, effect, deps) {
    const shouldRun = useRef(false);
    
    useEffect(() => {
        if (condition && !shouldRun.current) {
            shouldRun.current = true;
            effect();
        } else if (!condition) {
            shouldRun.current = false;
        }
    }, [condition, effect, ...deps]);
}
```

### 2. Hook Cleanup Management

```javascript
export default function useAsyncEffect(asyncFunction, deps) {
    useEffect(() => {
        let cancelled = false;
        
        (async () => {
            try {
                const result = await asyncFunction();
                if (!cancelled) {
                    // Handle result
                }
            } catch (error) {
                if (!cancelled) {
                    // Handle error
                }
            }
        })();
        
        return () => {
            cancelled = true;
        };
    }, deps);
}
```

### 3. Previous Value Tracking

```javascript
export default function usePrevious(value) {
    const ref = useRef();
    
    useEffect(() => {
        ref.current = value;
    }, [value]);
    
    return ref.current;
}

// Usage
function ComponentWithPreviousValue({ currentValue }) {
    const previousValue = usePrevious(currentValue);
    
    useEffect(() => {
        if (previousValue !== undefined && previousValue !== currentValue) {
            console.log(`Value changed from ${previousValue} to ${currentValue}`);
        }
    }, [currentValue, previousValue]);
    
    return <div>Current: {currentValue}, Previous: {previousValue}</div>;
}
```

## Testing Custom Hooks

### 1. Basic Hook Testing

```javascript
import { renderHook, act } from '@testing-library/react-hooks';
import { useDebounce } from '../useDebounce';

describe('useDebounce', () => {
    it('should debounce function calls', async () => {
        const mockFn = jest.fn();
        const { result } = renderHook(() => useDebounce(mockFn, 100));
        
        act(() => {
            result.current();
            result.current();
            result.current();
        });
        
        expect(mockFn).not.toHaveBeenCalled();
        
        await act(async () => {
            await new Promise(resolve => setTimeout(resolve, 150));
        });
        
        expect(mockFn).toHaveBeenCalledTimes(1);
    });
});
```

### 2. Hook Testing with Context

```javascript
import { renderHook } from '@testing-library/react-hooks';
import { useFeature } from '../useFeature';
import FeaturesProvider from '../components/FeaturesProvider';

const wrapper = ({ children }) => (
    <FeaturesProvider value={['newFeature']}>
        {children}
    </FeaturesProvider>
);

describe('useFeature', () => {
    it('should return true for enabled features', () => {
        const { result } = renderHook(
            () => useFeature('newFeature'),
            { wrapper }
        );
        
        expect(result.current).toBe(true);
    });
});
```

## Best Practices

### Hook Development
1. **Use descriptive names** starting with "use"
2. **Follow the standard file header** format
3. **Include comprehensive JSDoc** documentation
4. **Return consistent data structures** across similar hooks
5. **Handle edge cases** and error states

### Performance
1. **Use useCallback and useMemo** appropriately for expensive operations
2. **Implement proper cleanup** in useEffect
3. **Avoid unnecessary re-renders** with dependency arrays
4. **Use useInViewSelect** for data fetching in widgets

### Code Organization
1. **Place global hooks** in `/assets/js/hooks/`
2. **Co-locate module-specific hooks** with modules
3. **Co-locate component-specific hooks** with components
4. **Export hook constants** for reuse across components

### Error Handling
1. **Provide fallback values** for failed operations
2. **Use error boundaries** for hook-related errors
3. **Log errors appropriately** for debugging
4. **Return error states** in hook return values

### Testing
1. **Test hook behavior** not implementation details
2. **Mock external dependencies** (datastore, APIs)
3. **Test cleanup functions** and memory leaks
4. **Cover edge cases** and error scenarios
