/**
 * `core/widgets` data store: widget tests.
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
import { STORE_NAME } from './constants';

describe( 'core/widgets Widget areas', () => {
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
		describe( 'assignWidgetArea', () => {
			it( 'should implicitly create a context when assigning a widget area, if one does not exist', () => {
				// Assign this widget area to the testarea context.
				registry.dispatch( STORE_NAME ).assignWidgetArea( 'header', 'testarea' );

				const { contextAssignments } = store.getState();

				expect( contextAssignments.testarea ).toEqual( [ 'header' ] );
			} );

			it( 'should re-use a context if one is already created', () => {
				registry.dispatch( STORE_NAME ).assignWidgetArea( 'header', 'testarea' );
				registry.dispatch( STORE_NAME ).assignWidgetArea( 'footer', 'testarea' );

				const { contextAssignments } = store.getState();

				expect( contextAssignments.testarea ).toEqual( [ 'header', 'footer' ] );
			} );

			it( 'should assign a registered widget area to a context', () => {
				// Register the widget area.
				const slug = 'header';
				const settings = {
					priority: 10,
					title: 'Your Site',
					subtitle: 'Learn about your site!',
					icon: '/wp-content/plugins/googlesitekit/header.svg',
					style: 'boxes',
				};
				registry.dispatch( STORE_NAME ).registerWidgetArea( slug, settings );

				// Assign this widget area to the testarea context.
				registry.dispatch( STORE_NAME ).assignWidgetArea( slug, 'testarea' );

				// Get all assigned widget areas for the testarea context.
				const testareaAreas = registry.select( STORE_NAME ).getWidgetAreas( 'testarea' );

				expect( testareaAreas ).toHaveLength( 1 );
				expect( testareaAreas.some( ( area ) => area.slug === slug ) ).toEqual( true );
			} );
		} );

		describe( 'registerWidgetArea', () => {
			it( 'should register a widget area', () => {
				const slug = 'header';
				const settings = {
					priority: 10,
					title: 'Your Site',
					subtitle: 'Learn about your site!',
					icon: '/wp-content/plugins/googlesitekit/header.svg',
					style: 'boxes',
				};
				registry.dispatch( STORE_NAME ).registerWidgetArea( slug, settings );
				const state = store.getState();

				expect( registry.select( STORE_NAME ).isWidgetAreaRegistered( slug ) ).toEqual( true );
				// There is no selector for unassigned widget areas, so we inspect the store directly for
				// this test.
				expect( state.areas ).toMatchObject( {
					[ slug ]: { ...settings, slug },
				} );
			} );

			it( 'requires a slug', () => {
				expect( () => {
					registry.dispatch( STORE_NAME ).registerWidgetArea( null, {} );
				} ).toThrow( 'slug is required.' );
			} );

			it( 'requires settings', () => {
				// (It will throw for the first missing param, because the settings argument is
				// always defined .)
				expect( () => {
					registry.dispatch( STORE_NAME ).registerWidgetArea( 'my-cool-slug' );
				} ).toThrow( 'settings.title is required.' );
			} );

			it( 'requires a title and subtitle in settings', () => {
				expect( () => {
					registry.dispatch( STORE_NAME ).registerWidgetArea( 'header', {} );
				} ).toThrow( 'settings.title is required.' );

				expect( () => {
					registry.dispatch( STORE_NAME ).registerWidgetArea( 'header', {
						title: 'Analytics Header',
					} );
				} ).toThrow( 'settings.subtitle is required.' );

				expect( () => {
					registry.dispatch( STORE_NAME ).registerWidgetArea( 'header', {
						title: 'Analytics Header',
						subtitle: 'Analytics tell you about visitors',
					} );
				} ).not.toThrow();

				expect( () => {
					registry.dispatch( STORE_NAME ).registerWidgetArea( 'header', {
						title: 'Analytics Header',
						subtitle: 'Analytics tell you about visitors',
						style: 'composite',
					} );
				} ).not.toThrow();

				expect( console ).toHaveWarned();
			} );

			it( 'should register multiple widget areas', () => {
				const slugOne = 'dashboard-header';
				const settingsOne = {
					priority: 10,
					title: 'Header',
					subtitle: 'Cool stuff only!',
					icon: '/wp-content/plugins/googlesitekit/header.svg',
					style: 'boxes',
				};
				const slugTwo = 'dashboard-footer';
				const settingsTwo = {
					priority: 12,
					title: 'Footer',
					subtitle: 'Less important stuff.',
					icon: '/wp-content/plugins/googlesitekit/footer.svg',
					style: 'boxes',
				};
				registry.dispatch( STORE_NAME ).registerWidgetArea( slugOne, settingsOne );
				registry.dispatch( STORE_NAME ).registerWidgetArea( slugTwo, settingsTwo );
				const state = store.getState();

				expect( registry.select( STORE_NAME ).isWidgetAreaRegistered( slugOne ) ).toEqual( true );
				expect( registry.select( STORE_NAME ).isWidgetAreaRegistered( slugTwo ) ).toEqual( true );
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
					icon: '/wp-content/plugins/googlesitekit/pageviews.svg',
					style: 'boxes', // 'composite'
				};
				registry.dispatch( STORE_NAME ).registerWidgetArea( slug, settings );
				const state = store.getState();

				expect( registry.select( STORE_NAME ).isWidgetAreaRegistered( slug ) ).toEqual( true );
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
					icon: '/wp-content/plugins/googlesitekit/pageviews.svg',
					style: 'boxes', // 'composite'
				};
				// We don't want other widget areas to be able to overwrite existing areas.
				const differentSettings = {
					priority: 10,
					title: 'Mega Page Views',
					subtitle: 'Subscribe for more features!',
					icon: '/wp-content/plugins/googlesitekit/pageviews.svg',
					style: 'composite',
				};
				registry.dispatch( STORE_NAME ).registerWidgetArea( slug, settings );

				// Expect console warning about duplicate slug.
				const consoleWarnSpy = jest.spyOn( global.console, 'warn' );
				registry.dispatch( STORE_NAME ).registerWidgetArea( slug, differentSettings );
				expect( consoleWarnSpy ).toHaveBeenCalledWith( `Could not register widget area with slug "${ slug }". Widget area "${ slug }" is already registered.` );
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
		} );
	} );

	describe( 'selectors', () => {
		describe( 'getWidgetAreas', () => {
			it( 'requires a contextSlug', () => {
				expect( () => {
					registry.select( STORE_NAME ).getWidgetAreas();
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
					icon: '/wp-content/plugins/googlesitekit/header.svg',
					style: 'boxes',
				};
				registry.dispatch( STORE_NAME ).registerWidgetArea( slugOne, settings );
				registry.dispatch( STORE_NAME ).registerWidgetArea( slugTwo, settings );

				// Assign this widget area to the testarea context.
				registry.dispatch( STORE_NAME ).assignWidgetArea( slugOne, 'testarea' );
				registry.dispatch( STORE_NAME ).assignWidgetArea( slugTwo, 'testarea' );

				// Get all assigned widget areas for the testarea context.
				const testareaAreas = registry.select( STORE_NAME ).getWidgetAreas( 'testarea' );

				expect( testareaAreas ).toMatchObject( [
					{ ...settings, slug: slugOne },
					{ ...settings, slug: slugTwo },
				] );
			} );

			it( 'does not return unregistered widget areas', () => {
				// Assign this widget area to the testarea context.
				registry.dispatch( STORE_NAME ).assignWidgetArea( 'area-one', 'testarea' );
				registry.dispatch( STORE_NAME ).assignWidgetArea( 'area-two', 'testarea' );

				// Get all assigned widget areas for the testarea context.
				const testareaAreas = registry.select( STORE_NAME ).getWidgetAreas( 'testarea' );

				expect( testareaAreas ).toHaveLength( 0 );
			} );

			it( 'returns widget areas that were registered after they were assigned', () => {
				const slugOne = 'header';
				const slugTwo = 'subheader';

				// Assign this widget area to the testarea context.
				registry.dispatch( STORE_NAME ).assignWidgetArea( slugOne, 'testarea' );
				registry.dispatch( STORE_NAME ).assignWidgetArea( slugTwo, 'testarea' );

				// Register the widget areas.
				const settings = {
					priority: 10,
					title: 'Your Site',
					subtitle: 'Learn about your site!',
					icon: '/wp-content/plugins/googlesitekit/header.svg',
					style: 'boxes',
				};
				registry.dispatch( STORE_NAME ).registerWidgetArea( slugOne, settings );
				registry.dispatch( STORE_NAME ).registerWidgetArea( slugTwo, settings );

				// Get all assigned widget areas for the testarea context.
				const testareaAreas = registry.select( STORE_NAME ).getWidgetAreas( 'testarea' );

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
					icon: '/wp-content/plugins/googlesitekit/header.svg',
					style: 'boxes',
				};
				registry.dispatch( STORE_NAME ).registerWidgetArea( slugLowest, { ...settings, priority: 5 } );
				registry.dispatch( STORE_NAME ).registerWidgetArea( slugMedium, { ...settings, priority: 10 } );
				registry.dispatch( STORE_NAME ).registerWidgetArea( slugMediumTwo, { ...settings, priority: 10 } );
				registry.dispatch( STORE_NAME ).registerWidgetArea( slugHighest, { ...settings, priority: 15 } );

				// Assign this widget area to the testarea context.
				registry.dispatch( STORE_NAME ).assignWidgetArea( slugLowest, 'testarea' );
				registry.dispatch( STORE_NAME ).assignWidgetArea( slugMedium, 'testarea' );
				registry.dispatch( STORE_NAME ).assignWidgetArea( slugMediumTwo, 'testarea' );
				registry.dispatch( STORE_NAME ).assignWidgetArea( slugHighest, 'testarea' );

				// Get all assigned widget areas for the testarea context.
				const testareaAreas = registry.select( STORE_NAME ).getWidgetAreas( 'testarea' );

				// The lowest priority appears first.
				expect( testareaAreas[ 0 ] ).toMatchObject( { ...settings, slug: slugLowest } );
				// Widgets assigned with the same priority should be last-in, last-out.
				expect( testareaAreas[ 1 ] ).toMatchObject( { ...settings, slug: slugMedium } );
				expect( testareaAreas[ 2 ] ).toMatchObject( { ...settings, slug: slugMediumTwo } );
				expect( testareaAreas[ 3 ] ).toMatchObject( { ...settings, slug: slugHighest } );
			} );
		} );

		describe( 'getWidgetArea', () => {
			it( 'returns an area if the widget area is registered', () => {
				registry.dispatch( STORE_NAME ).registerWidgetArea( 'TestArea', {
					title: 'Test Header',
					subtitle: 'Cool stuff for yoursite.com',
					style: 'composite',
				} );

				expect( registry.select( STORE_NAME ).getWidgetArea( 'TestArea' ) ).toEqual( {
					icon: undefined,
					priority: 10,
					title: 'Test Header',
					subtitle: 'Cool stuff for yoursite.com',
					style: 'composite',
					slug: 'TestArea',
				} );
			} );

			it( 'returns null if the widget area is not registered', () => {
				expect( registry.select( STORE_NAME ).getWidgetArea( 'NotRealArea' ) ).toEqual( null );
			} );
		} );

		describe( 'isWidgetAreaRegistered', () => {
			it( 'returns true if the widget area is registered', () => {
				registry.dispatch( STORE_NAME ).registerWidgetArea( 'TestArea', {
					title: 'Test Header',
					subtitle: 'Cool stuff for yoursite.com',
					style: 'composite',
				} );

				expect( registry.select( STORE_NAME ).isWidgetAreaRegistered( 'TestArea' ) ).toEqual( true );
			} );

			it( 'returns false if the widget area is not registered', () => {
				expect( registry.select( STORE_NAME ).isWidgetAreaRegistered( 'NotRealArea' ) ).toEqual( false );
			} );
		} );
	} );
} );
