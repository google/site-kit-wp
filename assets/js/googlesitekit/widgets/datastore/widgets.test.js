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

describe( 'core/widgets Widgets', () => {
	let registry;
	let store;

	beforeEach( () => {
		registry = createTestRegistry();
		store = registry.stores[ STORE_NAME ].store;
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
			const slug = 'widget-spinner';
			const component = ( props ) => {
				return ( <div>Hello { props.children }!</div> );
			};

			it( 'requires a component to be provided', () => {
				expect(
					() => registry.dispatch( STORE_NAME ).registerWidget( slug )
				).toThrow( 'component is required to register a widget.' );
			} );

			it( 'requires a valid width to be provided', () => {
				expect(
					() => registry.dispatch( STORE_NAME ).registerWidget( slug, { component, width: 'HUUGE' } )
				).toThrow( 'Widget width should be one of' );
			} );

			it( 'registers the component with the given settings and component', () => {
				registry.dispatch( STORE_NAME ).registerWidget( slug, { component, priority: 11 } );

				expect( store.getState().widgets[ slug ].component ).toEqual( component );
				expect( store.getState().widgets[ slug ].priority ).toEqual( 11 );

				// Ensure we can render a component with the widget's component, verifying it's still a
				// usable React component.
				const Component = store.getState().widgets[ slug ].component;
				const { container } = render( <Component>world</Component> );
				expect( container.firstChild ).toMatchSnapshot();
			} );

			it( 'does not overwrite an existing widget', () => {
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

				// Ensure original widget's component is registered.
				expect( store.getState().widgets[ slug ].component ).toEqual( WidgetOne );
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
