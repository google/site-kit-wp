# Storybook Stories

Site Kit uses Storybook for component documentation, visual testing, and development workflow enhancement.

## Story Organization

### File Structure and Naming

Stories are co-located with the component they document, using the
`*.stories.js` (or, for TypeScript components, `*.stories.tsx`) suffix:

```
assets/js/
├── components/
│   ├── Component.js
│   └── Component.stories.js          // Basic component stories
├── googlesitekit/
│   └── components-gm2/
│       └── Button/
│           └── index.stories.js      // GM2 (Material) component stories
└── modules/
    └── analytics-4/
        └── components/
            └── dashboard/
                └── Widget.stories.js // Module-specific stories
```

New and migrated components increasingly ship `*.stories.tsx` files
(e.g. `assets/js/components/Notice/index.stories.tsx`,
`assets/js/googlesitekit/widgets/components/Widget.stories.tsx`). Both
extensions are picked up by Storybook — see the `stories` globs in
`storybook/main.js`.

### Story Categories

Stories are organized into a hierarchy via the `title` field of the default
export. Common top-level categories include:

- **Components**: Basic and GM2 UI components (`Components/Link`, `Components/Button`, `Components/Text Fields`)
- **Key Metrics**: Metric widgets (`Key Metrics/WidgetTiles/MetricTileNumeric`)
- **Modules**: Module-specific UI (`Modules/Analytics4/Setup/KeyMetricsSetupApp`, `Modules/Ads/WooCommerceRedirectModal`)
- **Views**: Top-level app views (`Views/AdminBarApp/AdminBarImpressions`)
- **Blocks**: WordPress block components (`Blocks/Reader Revenue Manager/EditorButton`)

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
import { withWidgetComponentProps } from '@/js/googlesitekit/widgets/util';
import MetricTileNumeric from './MetricTileNumeric';

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
// An empty `scenario` object opts this story into visual regression testing.
Positive.scenario = {};

export const Loading = Template.bind( {} );
Loading.storyName = 'Loading';
Loading.args = {
    title: 'New Visitors',
    loading: true,
};
Loading.scenario = {};
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

Storybook is configured in `storybook/main.js` (Storybook 8 with the
React + Webpack 5 framework). Stories are matched for both `.stories.js` and
`.stories.tsx`:

```javascript
module.exports = {
    framework: getModuleAbsolutePath( '@storybook/react-webpack5' ),
    stories: [
        path.resolve( rootDir, 'assets/js/**/*.stories.js' ),
        path.resolve( rootDir, 'assets/blocks/**/*.stories.js' ),
        path.resolve( rootDir, 'assets/js/**/*.stories.tsx' ),
        path.resolve( rootDir, 'assets/blocks/**/*.stories.tsx' ),
    ],
    addons: [
        getModuleAbsolutePath( '@storybook/addon-webpack5-compiler-babel' ),
        getModuleAbsolutePath( '@storybook/addon-viewport' ),
    ],
    previewHead( head ) {
        if ( process.env.VRT === '1' ) {
            return `${ head }\n${ vrtHead() }`;
        }
        return head;
    },
    // `webpackFinal` wires up the `@`/`@tests` aliases, the Site Kit package
    // aliases, the SVG rule and SCSS/PostCSS loaders.
};
```

### Preview Configuration

Global decorators and parameters live in `storybook/preview.js`. The shared
test utilities are imported through the `@tests` alias, and feature flags are
toggled via the `enabledFeatures` set from `assets/js/features` (the same set
the app reads at runtime):

```javascript
/**
 * Storybook preview config.
 */
import { createMemoryHistory } from 'history';
import { Router } from 'react-router';
import { RegistryProvider } from 'googlesitekit-data';
import { createTestRegistry, provideUserInfo } from '@tests/js/test-utils';
import FeaturesProvider from '../assets/js/components/FeaturesProvider';
import InViewProvider from '../assets/js/components/InViewProvider';
import { enabledFeatures } from '../assets/js/features';
import { Cell, Grid, Row } from '../assets/js/material-components';

// Decorators run from last added to first. (Eg. In reverse order as listed.)
export const decorators = [
    ( Story, { parameters, kind } ) => {
        const styles = {};

        const { padding } = parameters || {};
        if ( padding !== undefined ) {
            styles.padding = padding;
        }

        // Render block stories in non-Site Kit context.
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
    // Features must be set up before the test registry is initialized.
    ( Story, { parameters } ) => {
        const { features = [], route } = parameters;

        enabledFeatures.clear();
        for ( const feature of features ) {
            enabledFeatures.add( feature );
        }

        const registry = createTestRegistry();
        const history = createMemoryHistory();
        const featuresToEnable = new Set( features );

        // Populate most basic data which should not affect any tests.
        provideUserInfo( registry );

        if ( route ) {
            history.push( route );
        }

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
        // Custom comparator that sorts folders before files, then alphabetically.
        storySort: ( a, b ) => { /* ... */ },
    },
};
```

## Visual Regression Testing

BackstopJS scenarios are generated automatically from stories by
`tests/backstop/scenarios.js`, which parses every story file and emits one VRT
scenario for each story that declares a `scenario` **object**. An empty
`scenario = {}` opts a story in with default capture behaviour; properties on
the object (such as `delay`, `readySelector`, `hoverSelector`, `clickSelector`,
`postInteractionWait`, `onReadyScript`) customise the capture. A story with no
`scenario` property — or one whose `scenario` is anything other than a plain
object — is rendered in Storybook but not captured for VRT.

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
    features: [ 'pdfGeneration' ], // Enable feature flags (see feature-flags.json)
    route: '/dashboard',           // Set router history location
    padding: '20px',               // Custom padding applied by the layout decorator
};
```

### Best Practices

1. **Comprehensive Coverage**: Create stories for all component states (default, loading, error, empty)
2. **Descriptive Names**: Use clear story names that explain the variant
3. **Minimal Props**: Provide only necessary props to demonstrate the specific state
4. **VRT Considerations**: Add `scenario` to the stories that should be captured for visual regression testing
5. **Documentation**: Add comments explaining complex story setups
6. **Consistent Structure**: Follow established patterns for similar component types

### TypeScript Stories

When the component is TypeScript, name the story file `*.stories.tsx`. The CSF
authoring pattern is identical to the JavaScript form above — a `Template`
function, `export const X = Template.bind( {} )`, story-level `args`/`scenario`,
and a default export with `title`/`component`. Import the component (and any
helpers) with the `@/` alias and standard `import` statements; for component
prop typing, follow `component-conventions.md` (the source of truth for TS
component conventions) rather than redefining it here.

### Testing Integration

Every story is smoke-tested by the Storybook **test-runner**
(`@storybook/test-runner`, driven through Playwright). Running
`npm run test:storybook` builds Storybook, serves it locally and visits each
story, failing if a story throws while rendering. The shared assertion lives in
the `puppeteerTest` parameter in `storybook/preview.js`, which checks that the
story rendered without Storybook's error overlay:

```javascript
// storybook/preview.js
export const parameters = {
    async puppeteerTest( page ) {
        await page.waitForTimeout( 50 );

        expect(
            await page.$eval( 'body', ( element ) =>
                element.classList.contains( 'sb-show-errordisplay' )
            )
        ).toBe( false );
    },
};
```

Component behaviour is otherwise covered by the co-located Jest +
React Testing Library tests (`Component.test.js` / `Component.test.tsx`) that
import and render the component directly — Site Kit does not compose stories
into Jest tests.

### Development Workflow

1. **Create Component**: Develop the component functionality
2. **Write Tests**: Add unit and integration tests
3. **Create Stories**: Document all component states
4. **Visual Review**: Use Storybook for development and review
5. **VRT Setup**: Configure visual regression testing scenarios
6. **Documentation**: Ensure stories serve as living documentation

Storybook serves as both a development tool and documentation system, enabling component-driven development and maintaining visual consistency across Site Kit's interface.
