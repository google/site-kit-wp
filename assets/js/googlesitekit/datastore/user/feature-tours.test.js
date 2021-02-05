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
import { STORE_NAME } from './constants';
import initialState from './feature-tours';

describe( 'core/user feature-tours', () => {
	let registry;
	let store;

	beforeEach( () => {
		registry = createTestRegistry();
		store = registry.stores[ STORE_NAME ].store;
	} );

	describe( 'actions', () => {
		describe( 'dismissTour', () => {
			const fetchDismissTourRegExp = /^\/google-site-kit\/v1\/core\/user\/data\/dismiss-tour/;

			it( 'requires a slug parameter', () => {
				expect( () => registry.dispatch( STORE_NAME ).dismissTour() )
					.toThrow( /a tour slug is required/i );
			} );

			it( 'adds the slug to dismissedTours immediately', () => {
				muteFetch( fetchDismissTourRegExp, [] );

				expect( store.getState().dismissedTours ).toBe( initialState.dismissedTours );
				expect( store.getState().dismissedTours || [] ).not.toContain( 'test-tour' );

				registry.dispatch( STORE_NAME ).dismissTour( 'test-tour' );

				expect( store.getState().dismissedTours ).toContain( 'test-tour' );
			} );

			it( 'dispatches a fetch request to persist the dismissal', async () => {
				muteFetch( fetchDismissTourRegExp, [] );

				await registry.dispatch( STORE_NAME ).dismissTour( 'test-tour' );

				expect( fetchMock ).toHaveFetched( fetchDismissTourRegExp );
			} );

			it( 'receives all dismissed tours as the new state from the server', async () => {
				fetchMock.postOnce( fetchDismissTourRegExp, { body: [ 'tour-a', 'tour-b' ] } );

				await registry.dispatch( STORE_NAME ).dismissTour( 'tour-b' );

				expect( store.getState().dismissedTours ).toEqual(
					expect.arrayContaining( [ 'tour-a', 'tour-b' ] )
				);
			} );
		} );
	} );

	describe( 'selectors', () => {
		const fetchGetDismissedToursRegExp = /^\/google-site-kit\/v1\/core\/user\/data\/dismissed-tours/;

		describe( 'getDismissedTours', () => {
			it( 'returns the initial state before the resolver runs', () => {
				muteFetch( fetchGetDismissedToursRegExp, [] );

				expect( registry.select( STORE_NAME ).getDismissedTours() ).toBe( initialState.dismissedTours );
			} );

			it( 'receives dismissed tours from the fetch dispatched by the resolver', async () => {
				fetchMock.getOnce( fetchGetDismissedToursRegExp, { body: [ 'feature-x' ] } );

				registry.select( STORE_NAME ).getDismissedTours();

				await untilResolved( registry, STORE_NAME ).getDismissedTours();

				expect( registry.select( STORE_NAME ).getDismissedTours() ).toEqual( [ 'feature-x' ] );
				expect( fetchMock ).toHaveFetched();
			} );

			it( 'does not fetch if there are already dismissed tours in state', () => {
				registry.dispatch( STORE_NAME ).receiveGetDismissedTours( [] );

				registry.select( STORE_NAME ).getDismissedTours();

				expect( fetchMock ).not.toHaveFetched();
			} );

			it( 'returns the list of dismissed tours', () => {
				registry.dispatch( STORE_NAME ).receiveGetDismissedTours( [] );

				expect( registry.select( STORE_NAME ).getDismissedTours() ).toEqual( [] );

				registry.dispatch( STORE_NAME ).receiveGetDismissedTours( [ 'tour-a', 'feature-x' ] );

				expect( registry.select( STORE_NAME ).getDismissedTours() ).toEqual(
					expect.arrayContaining( [ 'feature-x', 'tour-a' ] )
				);
			} );
		} );

		describe( 'isTourDismissed', () => {
			it( 'returns `true` if the given slug is in the current list of dismissed tours', () => {
				registry.dispatch( STORE_NAME ).receiveGetDismissedTours( [] );

				expect( registry.select( STORE_NAME ).isTourDismissed( 'feature-x' ) ).toBe( false );

				registry.dispatch( STORE_NAME ).receiveGetDismissedTours( [ 'feature-x', 'tour-y' ] );

				expect( registry.select( STORE_NAME ).isTourDismissed( 'feature-x' ) ).toBe( true );
			} );

			it( 'will trigger the resolver for getDismissedTours and fetch if necessary', () => {
				muteFetch( fetchGetDismissedToursRegExp );

				registry.select( STORE_NAME ).isTourDismissed( 'feature-x' );

				expect( fetchMock ).toHaveFetched( fetchGetDismissedToursRegExp );
			} );

			it( 'returns `false` if dismissed tours are not resolved yet', () => {
				// The request will respond that `feature-x` _is dismissed_
				// but the selector will return `false` until the response is received.
				fetchMock.getOnce( fetchGetDismissedToursRegExp, { body: [ 'feature-x' ] } );
				expect( registry.select( STORE_NAME ).isTourDismissed( 'feature-x' ) ).toBe( false );
			} );
		} );
	} );
} );
