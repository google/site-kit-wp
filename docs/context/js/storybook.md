# Storybook Stories

Site Kit uses Storybook for component documentation, visual testing, and development workflow enhancement.

## Story Organization

### File Structure and Naming

Stories follow consistent patterns:

```
assets/js/
├── components/
│   ├── Component.js
│   └── Component.stories.js          // Basic component stories
├── googlesitekit/
│   └── components-gm2/
│       └── Button/
│           └── index.stories.js      // Material Design stories
└── modules/
    └── analytics-4/
        └── components/
            └── dashboard/
                └── Widget.stories.js // Module-specific stories
```

### Story Categories

Stories are organized by hierarchical categories:

- **Components**: Basic UI components (`Components/Badge`, `Components/Link`)
- **Key Metrics**: Metric widgets (`Key Metrics/WidgetTiles/MetricTileNumeric`)
- **Material Design**: GM2 components (`Material Design/Button`, `Material Design/TextField`)
- **Module Components**: Module-specific UI (`Analytics 4/Dashboard Widget`)
- **Blocks**: WordPress block components (`Blocks/Reader Revenue Manager`)

## Story Creation Patterns

### Basic Story Structure

Simple component stories follow this template:

```javascript
/**
 * Component Stories.
 *
 * Site Kit by Google, Copyright 2021 Google LLC
 */

/**
 * Internal dependencies
 */
import Component from './Component';

function Template( args ) {
    return <Component { ...args } />;
}

export const Default = Template.bind( {} );
Default.storyName = 'Default Component';
Default.args = {
    title: 'Example Title',
    value: 'Example Value',
};

export const Alternative = Template.bind( {} );
Alternative.storyName = 'Alternative State';
Alternative.args = {
    title: 'Alternative Title',
    variant: 'secondary',
};

export default {
    title: 'Components/Component',
    component: Component,
};
```

### Advanced Story Patterns

Complex stories with multiple variants:

```javascript
/**
 * Link Component Stories.
 */
import { Fragment } from '@wordpress/element';
import PencilIcon from './../../svg/icons/pencil-alt.svg';
import Link from './Link';
import VisuallyHidden from './VisuallyHidden';

function Template( args ) {
    const { children, ...rest } = args;
    return (
        <p>
            <Link { ...rest }>{ children }</Link>
        </p>
    );
}

export const Default = Template.bind( {} );
Default.args = {
    href: 'http://google.com',
    children: 'Default Link',
};

export const LinkButtonWithIconPrefix = Template.bind( {} );
LinkButtonWithIconPrefix.args = {
    onClick: () => {},
    children: 'Default Link Button With Icon Prefix',
    leadingIcon: <PencilIcon width={ 18 } height={ 18 } />,
};

export const ExternalLinkWithVisuallyHiddenContent = Template.bind( {} );
ExternalLinkWithVisuallyHiddenContent.args = {
    href: 'http://google.com',
    children: (
        <Fragment>
            External <VisuallyHidden>I am hiding </VisuallyHidden>
            Link with VisuallyHidden content
        </Fragment>
    ),
    external: true,
};

// Visual Regression Testing story
export function VRTStory() {
    const linkStories = [
        Default,
        LinkButtonWithIconPrefix,
        ExternalLinkWithVisuallyHiddenContent,
        // ... more stories
    ];

    return (
        <div>
            { linkStories.map( ( Story, index ) => (
                <p key={ index }>
                    <Story { ...Story.args } />
                </p>
            ) ) }
        </div>
    );
}
VRTStory.storyName = 'All Links VRT';
VRTStory.scenario = {
    hoverSelector: '.googlesitekit-cta-link--hover',
    postInteractionWait: 1000,
    onReadyScript: 'mouse.js',
};

export default {
    title: 'Components/Link',
    component: Link,
};
```

### Widget Stories with HOCs

Widget components often use higher-order components:

```javascript
/**
 * MetricTileNumeric Component Stories.
 */
import MetricTileNumeric from './MetricTileNumeric';
import { withWidgetComponentProps } from '../../googlesitekit/widgets/util';

const WidgetWithComponentProps = 
    withWidgetComponentProps( 'test' )( MetricTileNumeric );

function Template( { ...args } ) {
    return <WidgetWithComponentProps { ...args } />;
}

export const Positive = Template.bind( {} );
Positive.storyName = 'Positive';
Positive.args = {
    title: 'New Visitors',
    metricValue: 100,
    subText: 'of 1,234 total visitors',
    currentValue: 100,
    previousValue: 91,
};

export const Loading = Template.bind( {} );
Loading.storyName = 'Loading';
Loading.args = {
    title: 'New Visitors',
    loading: true,
};
Loading.decorators = [
    ( Story ) => {
        // Ensure animation is paused for VRT tests
        return (
            <div className="googlesitekit-vrt-animation-paused">
                <Story />
            </div>
        );
    },
];

export default {
    title: 'Key Metrics/WidgetTiles/MetricTileNumeric',
    component: MetricTileNumeric,
};
```

## Storybook Configuration

### Main Configuration

Storybook is configured in `storybook/main.js`:

```javascript
module.exports = {
    stories: [
        '../assets/js/**/*.stories.js',
        '../assets/blocks/**/*.stories.js',
    ],
    addons: [ '@storybook/addon-viewport', '@storybook/addon-postcss' ],
    previewHead: ( head ) => {
        if ( process.env.VRT === '1' ) {
            return `${ head }\n${ vrtHead() }`;
        }
        return head;
    },
};
```

### Preview Configuration

Global decorators and parameters in `storybook/preview.js`:

```javascript
/**
 * Storybook preview config.
 */
import { createTestRegistry, provideUserInfo, setEnabledFeatures } from '../tests/js/test-utils';
import { RegistryProvider } from 'googlesitekit-data';
import InViewProvider from '../assets/js/components/InViewProvider';
import FeaturesProvider from '../assets/js/components/FeaturesProvider';

// Decorators run from last added to first (reverse order)
export const decorators = [
    ( Story, { parameters, kind } ) => {
        const { padding } = parameters || {};
        const styles = padding !== undefined ? { padding } : {};

        // Different layout for block stories
        if ( kind.startsWith( 'Blocks/' ) ) {
            return (
                <Grid style={ styles }>
                    <Story />
                </Grid>
            );
        }

        return (
            <Grid className="googlesitekit-plugin-preview js" style={ styles }>
                <Row>
                    <Cell size={ 12 } className="googlesitekit-plugin">
                        <Story />
                    </Cell>
                </Row>
            </Grid>
        );
    },
    
    // Features and registry setup
    ( Story, { parameters } ) => {
        const { features = [], route } = parameters;
        const registry = createTestRegistry();
        const featuresToEnable = new Set( features );

        // Populate basic test data
        provideUserInfo( registry );
        setEnabledFeatures( features );

        return (
            <InViewProvider value={ inViewState }>
                <RegistryProvider value={ registry }>
                    <FeaturesProvider value={ featuresToEnable }>
                        <Router history={ history }>
                            <Story />
                        </Router>
                    </FeaturesProvider>
                </RegistryProvider>
            </InViewProvider>
        );
    },
];

export const parameters = {
    layout: 'fullscreen',
    options: {
        storySort: {
            method: 'alphabetical',
        },
    },
};
```

## Visual Regression Testing

### VRT Story Patterns

Stories for visual regression testing include special configuration:

```javascript
export function VRTStory() {
    const buttonStories = [
        DefaultButton,
        DangerButton,
        DisabledButton,
        TertiaryButton,
        // ... all button variants
    ];

    return (
        <div>
            { buttonStories.map( ( ButtonStory, index ) => (
                <p key={ index }>
                    <ButtonStory { ...ButtonStory.args } />
                </p>
            ) ) }
        </div>
    );
}
VRTStory.storyName = 'All Buttons VRT';
VRTStory.scenario = {
    hoverSelector: '.googlesitekit-button--icon',
    postInteractionWait: 3000,
    onReadyScript: 'mouse.js',
};
```

### Hover and Interaction States

Stories can test interactive states:

```javascript
export const HoverButton = Template.bind( {} );
HoverButton.storyName = 'Default Button Hover';
HoverButton.args = {
    children: 'Default Button Hover',
    className: 'googlesitekit-cta-link--hover',  // CSS class for hover state
};

// VRT scenario for interactions
VRTStory.scenario = {
    hoverSelector: '.googlesitekit-button--icon',
    postInteractionWait: 3000,
    onReadyScript: 'mouse.js',
};
```

### Loading State Testing

Loading states require special animation handling:

```javascript
export const Loading = Template.bind( {} );
Loading.decorators = [
    ( Story ) => {
        // Ensure animation is paused for VRT tests
        return (
            <div className="googlesitekit-vrt-animation-paused">
                <Story />
            </div>
        );
    },
];
```

## Story Development Guidelines

### Story Parameters

Stories can accept configuration through parameters:

```javascript
// Story with custom parameters
export const FeatureStory = Template.bind( {} );
FeatureStory.parameters = {
    features: [ 'userInput', 'keyMetrics' ],  // Enable feature flags
    route: '/dashboard',                       // Set router location
    padding: '20px',                          // Custom styling
};
```

### Best Practices

1. **Comprehensive Coverage**: Create stories for all component states (default, loading, error, empty)
2. **Descriptive Names**: Use clear story names that explain the variant
3. **Minimal Props**: Provide only necessary props to demonstrate the specific state
4. **VRT Considerations**: Include VRT stories for visual regression testing
5. **Documentation**: Add comments explaining complex story setups
6. **Consistent Structure**: Follow established patterns for similar component types

### Testing Integration

Stories can be tested alongside regular unit tests:

```javascript
// stories.test.js - validates all stories can render
import { composeStories } from '@storybook/testing-react';
import { render } from '@testing-library/react';
import * as stories from './Component.stories';

const { Default, Loading, Error } = composeStories( stories );

describe( 'Component Stories', () => {
    it( 'should render Default story', () => {
        render( <Default /> );
        // Assertions...
    } );

    it( 'should render Loading story', () => {
        render( <Loading /> );
        // Assertions...
    } );
} );
```

### Development Workflow

1. **Create Component**: Develop the component functionality
2. **Write Tests**: Add unit and integration tests
3. **Create Stories**: Document all component states
4. **Visual Review**: Use Storybook for development and review
5. **VRT Setup**: Configure visual regression testing scenarios
6. **Documentation**: Ensure stories serve as living documentation

Storybook serves as both a development tool and documentation system, enabling component-driven development and maintaining visual consistency across Site Kit's interface.
