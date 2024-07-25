/**
 * `core/widgets` data store: widget tests.
 *
 * Site Kit by Google, Copyright 2021 Google LLC
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
import { createTestRegistry } from '../../../../../tests/js/utils';
import { CORE_WIDGETS } from './constants';
import Null from '../../../components/Null';
import SiteKitLogo from '../../../../svg/graphics/logo-sitekit.svg';

describe( 'core/widgets Widget areas', () => {
	let registry;
	let store;

	beforeEach( () => {
		registry = createTestRegistry();
		store = registry.stores[ CORE_WIDGETS ].store;
	} );

	afterEach( () => {} );

	describe( 'actions', () => {
		describe( 'assignWidgetArea', () => {
			it( 'should implicitly create a context when assigning a widget area, if one does not exist', () => {
				// Assign this widget area to the testarea context.
				registry
					.dispatch( CORE_WIDGETS )
					.assignWidgetArea( 'header', 'testarea' );

				const { contextAssignments } = store.getState();

				expect( contextAssignments.testarea ).toEqual( [ 'header' ] );
			} );

			it( 'should re-use a context if one is already created', () => {
				registry
					.dispatch( CORE_WIDGETS )
					.assignWidgetArea( 'header', 'testarea' );
				registry
					.dispatch( CORE_WIDGETS )
					.assignWidgetArea( 'footer', 'testarea' );

				const { contextAssignments } = store.getState();

				expect( contextAssignments.testarea ).toEqual( [
					'header',
					'footer',
				] );
			} );

			it( 'should assign a registered widget area to a context', () => {
				// Register the widget area.
				const slug = 'header';
				const settings = {
					priority: 10,
					title: 'Your Site',
					subtitle: 'Learn about your site!',
					Icon: SiteKitLogo,
					style: 'boxes',
				};
				registry
					.dispatch( CORE_WIDGETS )
					.registerWidgetArea( slug, settings );

				// Assign this widget area to the testarea context.
				registry
					.dispatch( CORE_WIDGETS )
					.assignWidgetArea( slug, 'testarea' );

				// Get all assigned widget areas for the testarea context.
				const testareaAreas = registry
					.select( CORE_WIDGETS )
					.getWidgetAreas( 'testarea' );

				expect( testareaAreas ).toHaveLength( 1 );
				expect(
					testareaAreas.some( ( area ) => area.slug === slug )
				).toBe( true );
			} );
		} );

		describe( 'registerWidgetArea', () => {
			it( 'should register a widget area', () => {
				const slug = 'header';
				const settings = {
					priority: 10,
					title: 'Your Site',
					subtitle: 'Learn about your site!',
					Icon: SiteKitLogo,
					style: 'boxes',
				};
				registry
					.dispatch( CORE_WIDGETS )
					.registerWidgetArea( slug, settings );
				const state = store.getState();

				expect(
					registry
						.select( CORE_WIDGETS )
						.isWidgetAreaRegistered( slug )
				).toBe( true );
				// There is no selector for unassigned widget areas, so we inspect the store directly for
				// this test.
				expect( state.areas ).toMatchObject( {
					[ slug ]: { ...settings, slug },
				} );
			} );

			it( 'requires a slug', () => {
				expect( () => {
					registry
						.dispatch( CORE_WIDGETS )
						.registerWidgetArea( null, {} );
				} ).toThrow( 'slug is required.' );
			} );

			it( 'allows settings without a title', () => {
				expect( () => {
					registry
						.dispatch( CORE_WIDGETS )
						.registerWidgetArea( 'my-cool-slug', {
							subtitle: 'Analytics tell you about visitors',
						} );
				} ).not.toThrow();
			} );

			it( 'correctly handles settings with a title', () => {
				expect( () => {
					registry
						.dispatch( CORE_WIDGETS )
						.registerWidgetArea( 'header', {
							title: 'Analytics Header',
							subtitle: 'Analytics tell you about visitors',
							style: 'composite',
						} );
				} ).not.toThrow();
			} );

			it( 'should register multiple widget areas', () => {
				const slugOne = 'dashboard-header';
				const settingsOne = {
					priority: 10,
					title: 'Header',
					subtitle: 'Cool stuff only!',
					Icon: SiteKitLogo,
					style: 'boxes',
				};
				const slugTwo = 'dashboard-footer';
				const settingsTwo = {
					priority: 12,
					title: 'Footer',
					subtitle: 'Less important stuff.',
					Icon: SiteKitLogo,
					style: 'boxes',
				};
				registry
					.dispatch( CORE_WIDGETS )
					.registerWidgetArea( slugOne, settingsOne );
				registry
					.dispatch( CORE_WIDGETS )
					.registerWidgetArea( slugTwo, settingsTwo );
				const state = store.getState();

				expect(
					registry
						.select( CORE_WIDGETS )
						.isWidgetAreaRegistered( slugOne )
				).toBe( true );
				expect(
					registry
						.select( CORE_WIDGETS )
						.isWidgetAreaRegistered( slugTwo )
				).toBe( true );
				// There is no selector for unassigned widget areas, so we inspect the store directly for
				// this test.
				expect( state.areas ).toMatchObject( {
					[ slugOne ]: { ...settingsOne, slug: slugOne },
					[ slugTwo ]: { ...settingsTwo, slug: slugTwo },
				} );
			} );

			it( 'should use priority: 10 as a default', () => {
				const slug = 'pageviews';
				const settings = {
					title: 'Page Views',
					subtitle: 'See all your views!',
					Icon: SiteKitLogo,
					style: 'boxes', // 'composite'
				};
				registry
					.dispatch( CORE_WIDGETS )
					.registerWidgetArea( slug, settings );
				const state = store.getState();

				expect(
					registry
						.select( CORE_WIDGETS )
						.isWidgetAreaRegistered( slug )
				).toBe( true );
				// There is no selector for unassigned widget areas, so we inspect the store directly for
				// this test.
				expect( state.areas ).toMatchObject( {
					[ slug ]: { ...settings, priority: 10, slug },
				} );
			} );

			it( 'should not overwrite an existing widget area', () => {
				const slug = 'pageviews';
				const settings = {
					priority: 10,
					title: 'Page Views',
					subtitle: 'See all your views!',
					Icon: SiteKitLogo,
					style: 'boxes', // 'composite'
				};
				// We don't want other widget areas to be able to overwrite existing areas.
				const differentSettings = {
					priority: 10,
					title: 'Mega Page Views',
					subtitle: 'Subscribe for more features!',
					Icon: SiteKitLogo,
					style: 'composite',
				};
				registry
					.dispatch( CORE_WIDGETS )
					.registerWidgetArea( slug, settings );

				// Expect console warning about duplicate slug.
				const consoleWarnSpy = jest.spyOn( global.console, 'warn' );
				registry
					.dispatch( CORE_WIDGETS )
					.registerWidgetArea( slug, differentSettings );
				expect( consoleWarnSpy ).toHaveBeenCalledWith(
					`Could not register widget area with slug "${ slug }". Widget area "${ slug }" is already registered.`
				);
				consoleWarnSpy.mockClear();

				const state = store.getState();

				// Ensure the original settings are registered.
				expect( state.areas ).toMatchObject( {
					[ slug ]: { ...settings, slug },
				} );
				expect( state.areas ).not.toMatchObject( {
					[ slug ]: { ...differentSettings, slug },
				} );
			} );

			it( 'should register a widget area with a `filterActiveWidgets` function', () => {
				const slug = 'filtered-widgets';
				const filterActiveWidgetsMock = jest.fn();
				const settings = {
					priority: 10,
					title: 'Filtered Widgets',
					subtitle: 'Filtered widgets only!',
					Icon: SiteKitLogo,
					style: 'boxes',
					filterActiveWidgets: filterActiveWidgetsMock,
				};
				registry
					.dispatch( CORE_WIDGETS )
					.registerWidgetArea( slug, settings );
				const state = store.getState();

				expect(
					registry
						.select( CORE_WIDGETS )
						.isWidgetAreaRegistered( slug )
				).toBe( true );

				// Ensure the original settings are registered.
				expect( state.areas ).toMatchObject( {
					[ slug ]: { ...settings, slug },
				} );

				// Validate that filterActiveWidgets is correctly registered
				expect( state.areas[ slug ].filterActiveWidgets ).toBe(
					filterActiveWidgetsMock
				);
			} );
		} );
	} );

	describe( 'selectors', () => {
		describe( 'getWidgetAreas', () => {
			it( 'requires a contextSlug', () => {
				expect( () => {
					registry.select( CORE_WIDGETS ).getWidgetAreas();
				} ).toThrow( 'contextSlug is required.' );
			} );

			it( 'returns all registered widget areas', () => {
				// Register the widget area.
				const slugOne = 'header';
				const slugTwo = 'subheader';
				const settings = {
					priority: 10,
					title: 'Your Site',
					subtitle: 'Learn about your site!',
					Icon: SiteKitLogo,
					style: 'boxes',
				};
				registry
					.dispatch( CORE_WIDGETS )
					.registerWidgetArea( slugOne, settings );
				registry
					.dispatch( CORE_WIDGETS )
					.registerWidgetArea( slugTwo, settings );

				// Assign this widget area to the testarea context.
				registry
					.dispatch( CORE_WIDGETS )
					.assignWidgetArea( slugOne, 'testarea' );
				registry
					.dispatch( CORE_WIDGETS )
					.assignWidgetArea( slugTwo, 'testarea' );

				// Get all assigned widget areas for the testarea context.
				const testareaAreas = registry
					.select( CORE_WIDGETS )
					.getWidgetAreas( 'testarea' );

				expect( testareaAreas ).toMatchObject( [
					{ ...settings, slug: slugOne },
					{ ...settings, slug: slugTwo },
				] );
			} );

			it( 'does not return unregistered widget areas', () => {
				// Assign this widget area to the testarea context.
				registry
					.dispatch( CORE_WIDGETS )
					.assignWidgetArea( 'area-one', 'testarea' );
				registry
					.dispatch( CORE_WIDGETS )
					.assignWidgetArea( 'area-two', 'testarea' );

				// Get all assigned widget areas for the testarea context.
				const testareaAreas = registry
					.select( CORE_WIDGETS )
					.getWidgetAreas( 'testarea' );

				expect( testareaAreas ).toHaveLength( 0 );
			} );

			it( 'returns widget areas that were registered after they were assigned', () => {
				const slugOne = 'header';
				const slugTwo = 'subheader';

				// Assign this widget area to the testarea context.
				registry
					.dispatch( CORE_WIDGETS )
					.assignWidgetArea( slugOne, 'testarea' );
				registry
					.dispatch( CORE_WIDGETS )
					.assignWidgetArea( slugTwo, 'testarea' );

				// Register the widget areas.
				const settings = {
					priority: 10,
					title: 'Your Site',
					subtitle: 'Learn about your site!',
					Icon: SiteKitLogo,
					style: 'boxes',
				};
				registry
					.dispatch( CORE_WIDGETS )
					.registerWidgetArea( slugOne, settings );
				registry
					.dispatch( CORE_WIDGETS )
					.registerWidgetArea( slugTwo, settings );

				// Get all assigned widget areas for the testarea context.
				const testareaAreas = registry
					.select( CORE_WIDGETS )
					.getWidgetAreas( 'testarea' );

				expect( testareaAreas ).toMatchObject( [
					{ ...settings, slug: slugOne },
					{ ...settings, slug: slugTwo },
				] );
			} );

			it( 'returns the widget areas sorted by priority', () => {
				// Register the widget area.
				const slugLowest = 'header';
				const slugMedium = 'header2';
				const slugMediumTwo = 'header3';
				const slugHighest = 'header4';
				const settings = {
					title: 'Your title',
					subtitle: 'Okay!',
					Icon: SiteKitLogo,
					style: 'boxes',
				};
				registry
					.dispatch( CORE_WIDGETS )
					.registerWidgetArea( slugLowest, {
						...settings,
						priority: 5,
					} );
				registry
					.dispatch( CORE_WIDGETS )
					.registerWidgetArea( slugMedium, {
						...settings,
						priority: 10,
					} );
				registry
					.dispatch( CORE_WIDGETS )
					.registerWidgetArea( slugMediumTwo, {
						...settings,
						priority: 10,
					} );
				registry
					.dispatch( CORE_WIDGETS )
					.registerWidgetArea( slugHighest, {
						...settings,
						priority: 15,
					} );

				// Assign this widget area to the testarea context.
				registry
					.dispatch( CORE_WIDGETS )
					.assignWidgetArea( slugLowest, 'testarea' );
				registry
					.dispatch( CORE_WIDGETS )
					.assignWidgetArea( slugMedium, 'testarea' );
				registry
					.dispatch( CORE_WIDGETS )
					.assignWidgetArea( slugMediumTwo, 'testarea' );
				registry
					.dispatch( CORE_WIDGETS )
					.assignWidgetArea( slugHighest, 'testarea' );

				// Get all assigned widget areas for the testarea context.
				const testareaAreas = registry
					.select( CORE_WIDGETS )
					.getWidgetAreas( 'testarea' );

				// The lowest priority appears first.
				expect( testareaAreas[ 0 ] ).toMatchObject( {
					...settings,
					slug: slugLowest,
				} );
				// Widgets assigned with the same priority should be last-in, last-out.
				expect( testareaAreas[ 1 ] ).toMatchObject( {
					...settings,
					slug: slugMedium,
				} );
				expect( testareaAreas[ 2 ] ).toMatchObject( {
					...settings,
					slug: slugMediumTwo,
				} );
				expect( testareaAreas[ 3 ] ).toMatchObject( {
					...settings,
					slug: slugHighest,
				} );
			} );
		} );

		describe( 'getWidgetArea', () => {
			it( 'returns an area if the widget area is registered', () => {
				registry
					.dispatch( CORE_WIDGETS )
					.registerWidgetArea( 'TestArea', {
						title: 'Test Header',
						subtitle: 'Cool stuff for yoursite.com',
						style: 'composite',
					} );

				expect(
					registry.select( CORE_WIDGETS ).getWidgetArea( 'TestArea' )
				).toEqual( {
					slug: 'TestArea',
					title: 'Test Header',
					subtitle: 'Cool stuff for yoursite.com',
					Icon: undefined,
					style: 'composite',
					priority: 10,
					hasNewBadge: false,
					CTA: undefined,
					Footer: undefined,
					filterActiveWidgets: undefined,
				} );
			} );

			it( 'returns null if the widget area is not registered', () => {
				expect(
					registry
						.select( CORE_WIDGETS )
						.getWidgetArea( 'NotRealArea' )
				).toBe( null );
			} );
		} );

		describe( 'isWidgetAreaActive', () => {
			beforeEach( () => {
				// Register a test area which will remain empty.
				registry
					.dispatch( CORE_WIDGETS )
					.registerWidgetArea( 'EmptyTestArea', {
						title: 'Test Header 1',
						subtitle: 'Cool stuff for yoursite.com',
						style: 'composite',
					} );

				// Register a test area to populate with widgets.
				registry
					.dispatch( CORE_WIDGETS )
					.registerWidgetArea( 'TestArea', {
						title: 'Test Header 2',
						subtitle: 'More cool stuff for yoursite.com',
						style: 'composite',
					} );

				// Register an active widget with default widget state.
				registry
					.dispatch( CORE_WIDGETS )
					.registerWidget( 'TestWidget1', {
						Component() {
							return <div>Test Widget 1</div>;
						},
						modules: [ 'test-module-1', 'test-module-2' ],
					} );

				function Component() {
					return <div>Test Widget 2</div>;
				}

				// Register an active widget with state set to a component other than the `Null` component.
				registry
					.dispatch( CORE_WIDGETS )
					.registerWidget( 'TestWidget2', {
						Component,
						modules: [ 'test-module-3' ],
					} );

				registry
					.dispatch( CORE_WIDGETS )
					.setWidgetState( 'TestWidget2', Component, {} );

				// Assign the widgets to the widget area.
				registry
					.dispatch( CORE_WIDGETS )
					.assignWidget( 'TestWidget1', 'TestArea' );

				registry
					.dispatch( CORE_WIDGETS )
					.assignWidget( 'TestWidget2', 'TestArea' );
			} );

			it( 'requires a widgetAreaSlug', () => {
				expect( () => {
					registry.select( CORE_WIDGETS ).isWidgetAreaActive();
				} ).toThrow(
					'widgetAreaSlug is required to check a widget area is active.'
				);
			} );

			it( 'returns false if there are no widgets registered for the area', () => {
				expect(
					registry
						.select( CORE_WIDGETS )
						.isWidgetAreaActive( 'EmptyTestArea' )
				).toBe( false );
			} );

			it( 'returns true when the area widgets are active', () => {
				expect(
					registry
						.select( CORE_WIDGETS )
						.isWidgetAreaActive( 'TestArea' )
				).toBe( true );
			} );

			it( 'returns true when at least one area widget is active', () => {
				registry
					.dispatch( CORE_WIDGETS )
					.setWidgetState( 'TestWidget1', Null, {} );

				expect(
					registry
						.select( CORE_WIDGETS )
						.isWidgetAreaActive( 'TestArea' )
				).toBe( true );
			} );

			it( 'returns false when none of the area widgets are active', () => {
				registry
					.dispatch( CORE_WIDGETS )
					.setWidgetState( 'TestWidget1', Null, {} );

				registry
					.dispatch( CORE_WIDGETS )
					.setWidgetState( 'TestWidget2', Null, {} );

				expect(
					registry
						.select( CORE_WIDGETS )
						.isWidgetAreaActive( 'TestArea' )
				).toBe( false );
			} );

			it( 'returns true when passed a list of modules and the area contains active widgets for those modules', () => {
				expect(
					registry
						.select( CORE_WIDGETS )
						.isWidgetAreaActive( 'TestArea', {
							modules: [ 'test-module-1', 'test-module-2' ],
						} )
				).toBe( true );

				expect(
					registry
						.select( CORE_WIDGETS )
						.isWidgetAreaActive( 'TestArea', {
							modules: [ 'test-module-3' ],
						} )
				).toBe( true );
			} );

			it( 'returns false when passed a list of modules and the area does not contain active widgets for those modules', () => {
				// A widget is only considered a match when the widget's module list is a subset of the specified modules. Hence, this check will fail.
				expect(
					registry
						.select( CORE_WIDGETS )
						.isWidgetAreaActive( 'TestArea', {
							modules: [ 'test-module-1' ],
						} )
				).toBe( false );

				// Test for non-existent module.
				expect(
					registry
						.select( CORE_WIDGETS )
						.isWidgetAreaActive( 'TestArea', {
							modules: [ 'test-module-4' ],
						} )
				).toBe( false );
			} );

			it( 'returns false when `filterActiveWidgets` removes all widgets', () => {
				registry
					.dispatch( CORE_WIDGETS )
					.registerWidgetArea( 'FilteredTestArea', {
						title: 'Filtered Test Area',
						subtitle: 'Cool stuff for yoursite.com',
						style: 'composite',
						// eslint-disable-next-line no-unused-vars
						filterActiveWidgets( select, areaWidgets ) {
							return [];
						},
					} );
				registry
					.dispatch( CORE_WIDGETS )
					.assignWidget( 'TestWidget1', 'FilteredTestArea' );
				registry
					.dispatch( CORE_WIDGETS )
					.assignWidget( 'TestWidget2', 'FilteredTestArea' );

				expect(
					registry
						.select( CORE_WIDGETS )
						.isWidgetAreaActive( 'FilteredTestArea' )
				).toBe( false );
			} );

			it( 'returns true when `filterActiveWidgets` returns at least one widget', () => {
				registry
					.dispatch( CORE_WIDGETS )
					.registerWidgetArea( 'FilteredTestArea', {
						title: 'Filtered Test Area',
						subtitle: 'Cool stuff for yoursite.com',
						style: 'composite',
						filterActiveWidgets( select, areaWidgets ) {
							return areaWidgets.length === 1 ? [] : areaWidgets;
						},
					} );
				registry
					.dispatch( CORE_WIDGETS )
					.assignWidget( 'TestWidget1', 'FilteredTestArea' );
				registry
					.dispatch( CORE_WIDGETS )
					.assignWidget( 'TestWidget2', 'FilteredTestArea' );

				expect(
					registry
						.select( CORE_WIDGETS )
						.isWidgetAreaActive( 'FilteredTestArea' )
				).toBe( true );
			} );

			it( 'returns true when `filterActiveWidgets` is implemented but returns the widgets unchanged and widgets are active', () => {
				registry
					.dispatch( CORE_WIDGETS )
					.registerWidgetArea( 'UnfilteredTestArea', {
						title: 'Unfiltered Test Area',
						subtitle: 'More cool stuff for yoursite.com',
						style: 'composite',
						filterActiveWidgets( select, areaWidgets ) {
							return areaWidgets;
						},
					} );
				registry
					.dispatch( CORE_WIDGETS )
					.assignWidget( 'TestWidget1', 'UnfilteredTestArea' );
				registry
					.dispatch( CORE_WIDGETS )
					.assignWidget( 'TestWidget2', 'UnfilteredTestArea' );

				expect(
					registry
						.select( CORE_WIDGETS )
						.isWidgetAreaActive( 'UnfilteredTestArea' )
				).toBe( true );
			} );
		} );

		describe( 'isWidgetAreaRegistered', () => {
			it( 'returns true if the widget area is registered', () => {
				registry
					.dispatch( CORE_WIDGETS )
					.registerWidgetArea( 'TestArea', {
						title: 'Test Header',
						subtitle: 'Cool stuff for yoursite.com',
						style: 'composite',
					} );

				expect(
					registry
						.select( CORE_WIDGETS )
						.isWidgetAreaRegistered( 'TestArea' )
				).toBe( true );
			} );

			it( 'returns false if the widget area is not registered', () => {
				expect(
					registry
						.select( CORE_WIDGETS )
						.isWidgetAreaRegistered( 'NotRealArea' )
				).toBe( false );
			} );
		} );
	} );
} );
