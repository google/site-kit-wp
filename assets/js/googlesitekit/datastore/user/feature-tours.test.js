/**
 * `core/user` data store: feature tours tests.
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
import {
	createTestRegistry,
	muteFetch,
	untilResolved,
} from '../../../../../tests/js/utils';
import * as CacheModule from '../../../googlesitekit/api/cache';
import { STORE_NAME } from './constants';
import initialState, {
	FEATURE_TOUR_COOLDOWN_SECONDS,
	FEATURE_TOUR_LAST_DISMISSED_AT,
} from './feature-tours';
const { setItem } = CacheModule;

describe( 'core/user feature-tours', () => {
	let registry;
	let store;
	let setItemSpy;

	const testTourA = {
		slug: 'test-tour-a',
		version: '2.0.0',
		contexts: [ 'common-context' ],
		steps: [
			{
				title: 'Test Tour A - Step 1 Title',
				content: 'Test Tour A - Step 1 Content',
				target: 'test-tour-a-step-1-target',
			},
		],
	};
	const testTourB = {
		slug: 'test-tour-b',
		version: '2.1.0',
		contexts: [ 'common-context', 'b-only-context' ],
		steps: [
			{
				title: 'Test Tour B - Step 1 Title',
				content: 'Test Tour B - Step 1 Content',
				target: 'test-tour-b-step-1-target',
			},
		],
	};

	beforeEach( () => {
		setItemSpy = jest.spyOn( CacheModule, 'setItem' );
		registry = createTestRegistry();
		store = registry.stores[ STORE_NAME ].store;
		registry.dispatch( STORE_NAME ).receiveInitialSiteKitVersion( '1.0.0' );
	} );

	afterEach( () => {
		setItemSpy.mockRestore();
	} );

	describe( 'actions', () => {
		describe( 'dismissTour', () => {
			const fetchDismissTourRegExp = /^\/google-site-kit\/v1\/core\/user\/data\/dismiss-tour/;

			it( 'requires a slug parameter', () => {
				expect( () => registry.dispatch( STORE_NAME ).dismissTour() )
					.toThrow( /a tour slug is required/i );
			} );

			it( 'adds the slug to dismissedTourSlugs immediately', () => {
				muteFetch( fetchDismissTourRegExp, [] );

				expect( store.getState().dismissedTourSlugs ).toBe( initialState.dismissedTourSlugs );
				expect( store.getState().dismissedTourSlugs || [] ).not.toContain( 'test-tour' );

				registry.dispatch( STORE_NAME ).dismissTour( 'test-tour' );

				expect( store.getState().dismissedTourSlugs ).toContain( 'test-tour' );
			} );

			it( 'dispatches a fetch request to persist the dismissal', async () => {
				muteFetch( fetchDismissTourRegExp, [] );

				await registry.dispatch( STORE_NAME ).dismissTour( 'test-tour' );

				expect( fetchMock ).toHaveFetched( fetchDismissTourRegExp );
			} );

			it( 'receives all dismissed tours as the new state from the server', async () => {
				fetchMock.postOnce( fetchDismissTourRegExp, { body: [ 'tour-a', 'tour-b' ] } );

				await registry.dispatch( STORE_NAME ).dismissTour( 'tour-b' );

				expect( store.getState().dismissedTourSlugs ).toEqual(
					expect.arrayContaining( [ 'tour-a', 'tour-b' ] )
				);
			} );

			it( 'sets the lastDismissedAt timestamp to mark the start of the cooldown period', async () => {
				muteFetch( fetchDismissTourRegExp, [] );

				await registry.dispatch( STORE_NAME ).dismissTour( 'test-tour' );

				expect( store.getState().lastDismissedAt ).toBeDefined();
				// cache should have been set as well
				expect( setItemSpy ).toHaveBeenCalledWith(
					FEATURE_TOUR_LAST_DISMISSED_AT,
					expect.any( Number ), // timestamp
					expect.objectContaining( { ttl: FEATURE_TOUR_COOLDOWN_SECONDS } ),
				);
			} );
		} );

		describe( 'receiveAllFeatureTours', () => {
			it( 'requires tours to be an array', () => {
				expect( () => registry.dispatch( STORE_NAME ).receiveAllFeatureTours() )
					.toThrow( 'tours must be an array' );
			} );

			it( 'receives the given tours into the state', () => {
				const tours = [ testTourA, testTourB ];
				registry.dispatch( STORE_NAME ).receiveAllFeatureTours( tours );
				expect( store.getState().tours ).toEqual( tours );
			} );
		} );

		describe( 'receiveFeatureToursForView', () => {
			it( 'requires viewTours to be an array', () => {
				expect( () => registry.dispatch( STORE_NAME ).receiveFeatureToursForView() )
					.toThrow( 'viewTours must be an array' );
			} );

			it( 'requires a viewContext to be provided for the viewTours', () => {
				expect( () => registry.dispatch( STORE_NAME ).receiveFeatureToursForView( [] ) )
					.toThrow( 'viewContext is required' );
			} );

			it( 'receives the given viewTours into the state for the viewContext', () => {
				const tours = [ testTourA, testTourB ];
				registry.dispatch( STORE_NAME ).receiveFeatureToursForView( tours, { viewContext: 'foo' } );
				expect( store.getState().viewTours.foo ).toEqual( tours );
			} );
		} );

		describe( 'receiveLastDismissedAt', () => {
			it( 'requires a timestamp to be provided', () => {
				expect( () => registry.dispatch( STORE_NAME ).receiveLastDismissedAt() )
					.toThrow( 'A timestamp is required.' );
			} );

			it( 'sets the lastDismissedAt timestamp in the store', () => {
				const timestamp = Date.now();
				registry.dispatch( STORE_NAME ).receiveLastDismissedAt( timestamp );
				expect( store.getState().lastDismissedAt ).toEqual( timestamp );
			} );
		} );

		describe( 'setLastDismissedAt', () => {
			it( 'requires a timestamp to be provided', () => {
				expect( () => registry.dispatch( STORE_NAME ).receiveLastDismissedAt() )
					.toThrow( 'A timestamp is required.' );
			} );

			it( 'sets the lastDismissedAt timestamp in the store', async () => {
				const timestamp = Date.now();
				await registry.dispatch( STORE_NAME ).setLastDismissedAt( timestamp );
				expect( store.getState().lastDismissedAt ).toEqual( timestamp );
			} );

			it( 'sets the lastDismissedAt timestamp in the cache', async () => {
				const timestamp = Date.now();

				await registry.dispatch( STORE_NAME ).setLastDismissedAt( timestamp );

				expect( setItemSpy ).toHaveBeenCalledWith(
					FEATURE_TOUR_LAST_DISMISSED_AT,
					timestamp,
					expect.objectContaining( { ttl: FEATURE_TOUR_COOLDOWN_SECONDS } )
				);
			} );
		} );
	} );

	describe( 'selectors', () => {
		const fetchGetDismissedToursRegExp = /^\/google-site-kit\/v1\/core\/user\/data\/dismissed-tours/;

		describe( 'getDismissedFeatureTourSlugs', () => {
			it( 'returns the initial state before the resolver runs', () => {
				muteFetch( fetchGetDismissedToursRegExp, [] );

				expect( registry.select( STORE_NAME ).getDismissedFeatureTourSlugs() ).toBe( initialState.dismissedTourSlugs );
			} );

			it( 'receives dismissed tours from the fetch dispatched by the resolver', async () => {
				fetchMock.getOnce( fetchGetDismissedToursRegExp, { body: [ 'feature-x' ] } );

				registry.select( STORE_NAME ).getDismissedFeatureTourSlugs();

				await untilResolved( registry, STORE_NAME ).getDismissedFeatureTourSlugs();

				expect( registry.select( STORE_NAME ).getDismissedFeatureTourSlugs() ).toEqual( [ 'feature-x' ] );
				expect( fetchMock ).toHaveFetched();
			} );

			it( 'does not fetch if there are already dismissed tours in state', () => {
				registry.dispatch( STORE_NAME ).receiveGetDismissedTours( [] );

				registry.select( STORE_NAME ).getDismissedFeatureTourSlugs();

				expect( fetchMock ).not.toHaveFetched();
			} );

			it( 'returns the list of dismissed tours', () => {
				registry.dispatch( STORE_NAME ).receiveGetDismissedTours( [] );

				expect( registry.select( STORE_NAME ).getDismissedFeatureTourSlugs() ).toEqual( [] );

				registry.dispatch( STORE_NAME ).receiveGetDismissedTours( [ 'tour-a', 'feature-x' ] );

				expect( registry.select( STORE_NAME ).getDismissedFeatureTourSlugs() ).toEqual(
					expect.arrayContaining( [ 'feature-x', 'tour-a' ] )
				);
			} );
		} );

		describe( 'getFeatureToursForView', () => {
			beforeEach( () => {
				registry.dispatch( STORE_NAME ).receiveGetDismissedTours( [] );
			} );

			it( 'returns `undefined` while tour readiness is being resolved', () => {
				expect(
					registry.select( STORE_NAME ).getFeatureToursForView( 'test-view-context' )
				).toBeUndefined();
			} );

			it( 'returns an array of tours that qualify for the given view context', async () => {
				registry.dispatch( STORE_NAME ).receiveAllFeatureTours( [ testTourA, testTourB ] );

				expect(
					await registry.__experimentalResolveSelect( STORE_NAME ).getFeatureToursForView( 'common-context' )
				).toEqual( [ testTourA, testTourB ] );

				expect(
					await registry.__experimentalResolveSelect( STORE_NAME ).getFeatureToursForView( 'b-only-context' )
				).toEqual( [ testTourB ] );
			} );

			it( 'returns an array of tours that have a version greater than the user’s initial Site Kit version', async () => {
				const initialVersion = '1.0.0';
				const tourVersion = '2.0.0';
				registry.dispatch( STORE_NAME ).receiveInitialSiteKitVersion( initialVersion );
				registry.dispatch( STORE_NAME ).receiveAllFeatureTours( [
					{ ...testTourA, version: initialVersion },
					{ ...testTourB, version: tourVersion },
				] );
				// Tour A's version matches the user's initial version, so only Tour B is returned.
				const viewTours = await registry.__experimentalResolveSelect( STORE_NAME ).getFeatureToursForView( 'common-context' );
				expect( viewTours.map( ( { slug } ) => slug ) ).toEqual( [ testTourB.slug ] );
			} );

			it( 'returns an array of tours that have not been dismissed by the user yet', async () => {
				registry.dispatch( STORE_NAME ).receiveAllFeatureTours( [ testTourA, testTourB ] );
				registry.dispatch( STORE_NAME ).receiveGetDismissedTours( [ testTourB.slug ] );
				// Tour B was received as dismissed, but A was not.
				expect(
					await registry.__experimentalResolveSelect( STORE_NAME ).getFeatureToursForView( 'common-context' )
				).toEqual( [ testTourA ] );
			} );

			it( 'returns an array of tours that use their own logic for checking additional requirements', async () => {
				// Check A will resolve with `true` on the next tick.
				const checkA = jest.fn(
					async () => new Promise( ( resolve ) => setTimeout( resolve( true ) ) )
				);
				// Check B will resolve with `false` on the next tick.
				const checkB = jest.fn(
					async () => new Promise( ( resolve ) => setTimeout( resolve( false ) ) )
				);
				registry.dispatch( STORE_NAME ).receiveAllFeatureTours( [
					{ ...testTourA, checkRequirements: checkA },
					{ ...testTourB, checkRequirements: checkB },
				] );

				const viewTours = await registry.__experimentalResolveSelect( STORE_NAME ).getFeatureToursForView( 'common-context' );
				expect( viewTours.map( ( { slug } ) => slug ) ).toEqual( [ testTourA.slug ] );
				// Check functions should be called with the registry as the first parameter.
				const registryMatcher = expect.objectContaining( {
					select: expect.any( Function ),
					dispatch: expect.any( Function ),
				} );
				// The registry instance passed to the function is slightly different for some reason
				// so we can't simply call `.toHaveBeenCalledWith( registry )`
				expect( checkA ).toHaveBeenCalledWith( registryMatcher );
				expect( checkB ).toHaveBeenCalledWith( registryMatcher );
			} );
		} );

		describe( 'getAllFeatureTours', () => {
			it( 'returns all tours in the store', () => {
				const tours = [ testTourA, testTourB ];
				registry.dispatch( STORE_NAME ).receiveAllFeatureTours( tours );

				expect(
					registry.select( STORE_NAME ).getAllFeatureTours()
				).toEqual( tours );
			} );
		} );

		describe( 'isTourDismissed', () => {
			it( 'returns `true` if the given slug is in the current list of dismissed tours', () => {
				registry.dispatch( STORE_NAME ).receiveGetDismissedTours( [] );

				expect( registry.select( STORE_NAME ).isTourDismissed( 'feature-x' ) ).toBe( false );

				registry.dispatch( STORE_NAME ).receiveGetDismissedTours( [ 'feature-x', 'tour-y' ] );

				expect( registry.select( STORE_NAME ).isTourDismissed( 'feature-x' ) ).toBe( true );
			} );

			it( 'will trigger the resolver for getDismissedFeatureTourSlugs and fetch if necessary', () => {
				muteFetch( fetchGetDismissedToursRegExp );

				registry.select( STORE_NAME ).isTourDismissed( 'feature-x' );

				expect( fetchMock ).toHaveFetched( fetchGetDismissedToursRegExp );
			} );

			it( 'returns `undefined` if dismissed tours are not resolved yet', () => {
				// The request will respond that `feature-x` _is dismissed_
				// but the selector will return `false` until the response is received.
				fetchMock.getOnce( fetchGetDismissedToursRegExp, { body: [ 'feature-x' ] } );
				expect( registry.select( STORE_NAME ).isTourDismissed( 'feature-x' ) ).toBeUndefined();
			} );
		} );

		describe( 'getLastDismissedAt', () => {
			// Note: storage is cleared before every test in the global config.

			it( 'returns initial state (undefined) if there is no lastDismissedAt timestamp', () => {
				const lastDismissedAt = registry.select( STORE_NAME ).getLastDismissedAt();
				expect( lastDismissedAt ).toEqual( undefined );
			} );

			it( 'returns the lastDismissedAt timestamp if there is one', () => {
				const timestamp = Date.now();
				registry.dispatch( STORE_NAME ).receiveLastDismissedAt( timestamp );
				expect( registry.select( STORE_NAME ).getLastDismissedAt() ).toEqual( timestamp );
			} );

			it( 'uses a resolver to set lastDismissedAt in the store if there is a value in the cache', async () => {
				const timestamp = Date.now();
				await setItem( FEATURE_TOUR_LAST_DISMISSED_AT, timestamp );

				registry.select( STORE_NAME ).getLastDismissedAt();
				await untilResolved( registry, STORE_NAME ).getLastDismissedAt();

				expect( registry.select( STORE_NAME ).getLastDismissedAt() ).toBe( timestamp );
			} );

			it( 'returns false for an expired lastDismissedAt value in the cache', async () => {
				const timestamp = Date.now();
				// Set an item that is guaranteed to be expired when called with `getItem`
				await setItem( FEATURE_TOUR_LAST_DISMISSED_AT, timestamp, { ttl: -1 } );

				registry.select( STORE_NAME ).getLastDismissedAt();
				await untilResolved( registry, STORE_NAME ).getLastDismissedAt();

				expect( registry.select( STORE_NAME ).getLastDismissedAt() ).toBe( null );
			} );
		} );

		describe( 'areFeatureToursOnCooldown', () => {
			it( 'returns undefined if there is no lastDismissedAt timestamp', () => {
				expect( registry.select( STORE_NAME ).areFeatureToursOnCooldown() ).toBeUndefined();
			} );

			it( 'returns true if the lastDismissedAt timestamp is within the feature tour cooldown period', () => {
				const timestamp = Date.now();
				const coolDownPeriodMilliseconds = FEATURE_TOUR_COOLDOWN_SECONDS * 1000;
				const justInsideCoolDownPeriod = timestamp + coolDownPeriodMilliseconds - 1000;

				registry.dispatch( STORE_NAME ).receiveLastDismissedAt( justInsideCoolDownPeriod );

				expect( registry.select( STORE_NAME ).areFeatureToursOnCooldown() ).toEqual( true );
			} );

			it( 'returns false if the feature tour cooldown period has expired', () => {
				const coolDownPeriodMilliseconds = FEATURE_TOUR_COOLDOWN_SECONDS * 1000;
				const startOfCoolDownPeriod = Date.now() - coolDownPeriodMilliseconds;

				registry.dispatch( STORE_NAME ).receiveLastDismissedAt( startOfCoolDownPeriod );

				expect( registry.select( STORE_NAME ).areFeatureToursOnCooldown() ).toEqual( false );
			} );

			it( 'returns false for an expired lastDismissedAt value in the cache', async () => {
				registry.dispatch( STORE_NAME ).receiveLastDismissedAt( null );

				expect( registry.select( STORE_NAME ).areFeatureToursOnCooldown() ).toEqual( false );
			} );
		} );
	} );
} );
