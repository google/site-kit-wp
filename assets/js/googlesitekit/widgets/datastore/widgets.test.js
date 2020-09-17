/**
 * core/widgets data store: widget tests.
 *
 * Site Kit by Google, Copyright 2020 Google LLC
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
 * Internal dependencies
 */
import {
	createTestRegistry,
	unsubscribeFromAll,
} from '../../../../../tests/js/utils';
import { render } from '../../../../../tests/js/test-utils';
import { STORE_NAME } from './constants';
import { STORE_NAME as CORE_SITE_STORE_NAME } from '../../../googlesitekit/datastore/site';
import { WidgetComponents } from './widgets';

describe( 'core/widgets Widgets', () => {
	const resetWidgetComponents = () => {
		Object.keys( WidgetComponents ).forEach( ( registryKey ) => {
			delete WidgetComponents[ registryKey ];
		} );
	};
	let registry;
	let store;

	beforeEach( () => {
		registry = createTestRegistry();
		store = registry.stores[ STORE_NAME ].store;

		// Reset the WidgetComponents variable for each test; otherwise a new registry will
		// be created for each test.
		resetWidgetComponents();
	} );

	afterEach( () => {
		unsubscribeFromAll( registry );
	} );

	describe( 'actions', () => {
		describe( 'assignWidget', () => {
			it( 'should assign widgets to a widget area', () => {
				const WidgetComponent = () => {
					return ( <div>Foo bar!</div> );
				};
				const AnotherWidgetComponent = () => {
					return ( <div>Howdy friend!</div> );
				};
				registry.dispatch( STORE_NAME ).registerWidgetArea( 'dashboard-header', {
					title: 'Dashboard Header',
					subtitle: 'Cool stuff for yoursite.com',
					style: 'boxes',
				} );
				registry.dispatch( STORE_NAME ).assignWidgetArea( 'dashboard-header', 'dashboard' );

				// Register all the widgets.
				const slugOne = 'one';
				const settingsOne = {
					component: WidgetComponent,
					priority: 5,
				};
				registry.dispatch( STORE_NAME ).registerWidget( slugOne, settingsOne );

				const slugTwo = 'two';
				const settingsTwo = {
					component: WidgetComponent,
					priority: 10,
				};
				registry.dispatch( STORE_NAME ).registerWidget( slugTwo, settingsTwo );

				const slugThree = 'three';
				const settingsThree = {
					component: AnotherWidgetComponent,
					priority: 500,
				};
				registry.dispatch( STORE_NAME ).registerWidget( slugThree, settingsThree );

				// Assign all widgets to the widget area.
				registry.dispatch( STORE_NAME ).assignWidget( slugOne, 'dashboard-header' );
				registry.dispatch( STORE_NAME ).assignWidget( slugTwo, 'dashboard-header' );
				registry.dispatch( STORE_NAME ).assignWidget( slugThree, 'dashboard-header' );

				const widgets = registry.select( STORE_NAME ).getWidgets( 'dashboard-header' );

				expect( widgets ).toHaveLength( 3 );
				expect( widgets ).toMatchObject( [
					{ ...settingsOne, slug: slugOne },
					{ ...settingsTwo, slug: slugTwo },
					{ ...settingsThree, slug: slugThree },
				] );
			} );

			it( 'should allow assignment of non-registered widgets', () => {
				registry.dispatch( STORE_NAME ).registerWidgetArea( 'dashboard-header', {
					title: 'Dashboard Header',
					subtitle: 'Cool stuff for yoursite.com',
					style: 'boxes',
				} );
				registry.dispatch( STORE_NAME ).assignWidgetArea( 'dashboard-header', 'dashboard' );

				// Assign all widgets to the widget area.
				registry.dispatch( STORE_NAME ).assignWidget( 'slugOne', 'dashboard-header' );
				registry.dispatch( STORE_NAME ).assignWidget( 'slugTwo', 'dashboard-header' );
				registry.dispatch( STORE_NAME ).assignWidget( 'slugThree', 'dashboard-header' );

				const state = store.getState();

				expect( state.areaAssignments[ 'dashboard-header' ].includes( 'slugOne' ) ).toEqual( true );
				expect( state.areaAssignments[ 'dashboard-header' ].includes( 'slugTwo' ) ).toEqual( true );
				expect( state.areaAssignments[ 'dashboard-header' ].includes( 'slugThree' ) ).toEqual( true );
			} );

			it( 'should allow assignment of non-registered widget areas', () => {
				// Assign all widgets to the widget area.
				registry.dispatch( STORE_NAME ).assignWidget( 'testOne', 'dashboard-header' );
				registry.dispatch( STORE_NAME ).assignWidget( 'testTwo', 'dashboard-header' );

				const state = store.getState();

				expect( state.areaAssignments[ 'dashboard-header' ].includes( 'testOne' ) ).toEqual( true );
				expect( state.areaAssignments[ 'dashboard-header' ].includes( 'testTwo' ) ).toEqual( true );
			} );
		} );

		describe( 'registerWidget', () => {
			it( 'places the widget component in a variable external to the store, with a key from the store', () => {
				expect( Object.keys( WidgetComponents ) ).toHaveLength( 0 );

				const slug = 'WidgetSpinner';
				const WidgetSpinner = ( props ) => {
					return ( <div>Hello { props.children }!</div> );
				};
				registry.dispatch( STORE_NAME ).registerWidget( slug, {
					component: WidgetSpinner,
				} );
				const registryKey = registry.select( CORE_SITE_STORE_NAME ).getRegistryKey();

				// A registry key should have been created.
				expect( Object.keys( WidgetComponents ) ).toHaveLength( 1 );
				expect( WidgetComponents[ registryKey ][ slug ] ).toBeDefined();
				expect( WidgetComponents[ registryKey ][ slug ] ).toEqual( WidgetSpinner );

				// Ensure we can render a component with the widget's component, verifying it's still a
				// usable React component.
				const Component = WidgetComponents[ registryKey ][ slug ];
				const { container } = render( <Component>world</Component> );
				expect( container.firstChild ).toMatchSnapshot();
			} );

			it( 'uses the same WidgetsComponent section when multiple widgets are registered', () => {
				registry.dispatch( STORE_NAME ).registerWidget( 'widget-1', {
					component: () => {
						return ( <div>Hello world!</div> );
					},
				} );
				registry.dispatch( STORE_NAME ).registerWidget( 'widget-2', {
					component: () => {
						return ( <span>Hello again!</span> );
					},
				} );
				const registryKey = registry.select( CORE_SITE_STORE_NAME ).getRegistryKey();

				expect( Object.keys( WidgetComponents[ registryKey ] ) ).toHaveLength( 2 );
				// Another registry key should not have been created.
				expect( Object.keys( WidgetComponents ) ).toHaveLength( 1 );
			} );

			it( 'does not overwrite an existing widget', () => {
				const slug = 'widget-1';
				const WidgetOne = () => {
					return ( <div>Hello world!</div> );
				};
				const WidgetOneRedone = () => {
					return ( <div>Goodbye you!</div> );
				};
				registry.dispatch( STORE_NAME ).registerWidget( slug, {
					component: WidgetOne,
				} );

				registry.dispatch( STORE_NAME ).registerWidget( slug, {
					component: WidgetOneRedone,
				} );
				expect( console ).toHaveWarnedWith( `Could not register widget with slug "${ slug }". Widget "${ slug }" is already registered.` );

				const registryKey = registry.select( CORE_SITE_STORE_NAME ).getRegistryKey();

				// Ensure original widget's component is registered.
				expect( Object.keys( WidgetComponents[ registryKey ] ) ).toHaveLength( 1 );
				expect( WidgetComponents[ registryKey ][ slug ] ).toEqual( WidgetOne );
			} );
		} );
	} );

	describe( 'selectors', () => {
		describe( 'getWidgets', () => {
			it( 'requires a widgetAreaSlug', () => {
				expect( () => {
					registry.select( STORE_NAME ).getWidgets();
				} ).toThrow( 'widgetAreaSlug is required.' );
			} );

			it( 'should return an empty array when no widgets have been registered', () => {
				const widgets = registry.select( STORE_NAME ).getWidgets( 'dashboardHeader' );

				expect( widgets ).toEqual( [] );
			} );

			it( "should return all widgets for a given widgetAreaSlug after they're registered", () => {
				const PageViews = () => {
					return ( <div>Ten people viewed your page!</div> );
				};
				registry.dispatch( STORE_NAME ).registerWidgetArea( 'dashboard-header', {
					title: 'Dashboard Header',
					subtitle: 'Cool stuff for yoursite.com',
					style: 'boxes',
				} );
				registry.dispatch( STORE_NAME ).assignWidgetArea( 'dashboard-header', 'dashboard' );
				registry.dispatch( STORE_NAME ).registerWidget( 'PageViews', {
					component: PageViews,
				} );
				registry.dispatch( STORE_NAME ).assignWidget( 'PageViews', 'dashboard-header' );

				const widgets = registry.select( STORE_NAME ).getWidgets( 'dashboard-header' );

				expect( widgets ).toHaveLength( 1 );
			} );

			it( 'should return widgets in the correct priority', () => {
				const WidgetComponent = () => {
					return ( <div>Foo bar!</div> );
				};
				registry.dispatch( STORE_NAME ).registerWidgetArea( 'dashboard-header', {
					title: 'Dashboard Header',
					subtitle: 'Cool stuff for yoursite.com',
					style: 'boxes',
				} );
				registry.dispatch( STORE_NAME ).assignWidgetArea( 'dashboard-header', 'dashboard' );

				// Register all the widgets.
				registry.dispatch( STORE_NAME ).registerWidget( 'lowest', {
					component: WidgetComponent,
					priority: 5,
				} );
				registry.dispatch( STORE_NAME ).registerWidget( 'mediumOne', {
					component: WidgetComponent,
					priority: 10,
				} );
				registry.dispatch( STORE_NAME ).registerWidget( 'mediumTwo', {
					component: WidgetComponent,
					priority: 10,
				} );
				registry.dispatch( STORE_NAME ).registerWidget( 'highest', {
					component: WidgetComponent,
					priority: 500,
				} );

				// Assign all widgets to the widget area.
				registry.dispatch( STORE_NAME ).assignWidget( 'lowest', 'dashboard-header' );
				registry.dispatch( STORE_NAME ).assignWidget( 'mediumOne', 'dashboard-header' );
				registry.dispatch( STORE_NAME ).assignWidget( 'mediumTwo', 'dashboard-header' );
				registry.dispatch( STORE_NAME ).assignWidget( 'highest', 'dashboard-header' );

				const widgets = registry.select( STORE_NAME ).getWidgets( 'dashboard-header' );

				expect( widgets ).toHaveLength( 4 );
				expect( widgets[ 0 ].slug ).toEqual( 'lowest' );
				expect( widgets[ 1 ].slug ).toEqual( 'mediumOne' );
				expect( widgets[ 2 ].slug ).toEqual( 'mediumTwo' );
				expect( widgets[ 3 ].slug ).toEqual( 'highest' );
			} );

			it( 'should not return widgets that have been assigned but not registered', () => {
				registry.dispatch( STORE_NAME ).assignWidgetArea( 'dashboard-header', 'dashboard' );
				registry.dispatch( STORE_NAME ).assignWidget( 'PageViews', 'dashboard-header' );

				const widgets = registry.select( STORE_NAME ).getWidgets( 'dashboard-header' );

				expect( widgets ).toHaveLength( 0 );
			} );

			it( 'should return widgets that have been assigned before they were registered, once they have been registered', () => {
				const PageViews = () => {
					return ( <div>Only one person viewed your page, and it was you :-(</div> );
				};
				registry.dispatch( STORE_NAME ).assignWidgetArea( 'dashboard-header', 'dashboard' );
				registry.dispatch( STORE_NAME ).assignWidget( 'PageViews', 'dashboard-header' );
				registry.dispatch( STORE_NAME ).registerWidget( 'PageViews', {
					component: PageViews,
				} );

				const widgets = registry.select( STORE_NAME ).getWidgets( 'dashboard-header' );

				expect( widgets ).toHaveLength( 1 );
			} );
		} );

		describe( 'isWidgetRegistered', () => {
			it( 'returns true if the widget is registered', () => {
				registry.dispatch( STORE_NAME ).registerWidget( 'TestWidget', {
					component: () => {
						return ( <div>Hello test.</div> );
					},
				} );

				expect( registry.select( STORE_NAME ).isWidgetRegistered( 'TestWidget' ) ).toEqual( true );
			} );

			it( 'returns false if the widget is not registered', () => {
				expect( registry.select( STORE_NAME ).isWidgetAreaRegistered( 'NotRealWidget' ) ).toEqual( false );
			} );
		} );

		describe( 'getWidget', () => {
			it( 'returns a widget if one exists', () => {
				registry.dispatch( STORE_NAME ).registerWidget( 'TestWidget', {
					component: () => {
						return ( <div>Hello test.</div> );
					},
				} );

				expect( registry.select( STORE_NAME ).getWidget( 'TestWidget' ) ).toMatchSnapshot();
			} );

			it( 'returns null if the widget is not registered', () => {
				expect( registry.select( STORE_NAME ).getWidget( 'NotRealWidget' ) ).toEqual( null );
			} );
		} );
	} );
} );
