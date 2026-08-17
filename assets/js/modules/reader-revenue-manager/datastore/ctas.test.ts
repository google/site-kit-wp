/**
 * `modules/reader-revenue-manager` data store: CTAs tests.
 *
 * Site Kit by Google, Copyright 2026 Google LLC
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
import fetchMock from 'fetch-mock';

/**
 * WordPress dependencies
 */
import { WPDataRegistry } from '@wordpress/data/build-types/registry';

/**
 * Internal dependencies
 */
import { createTestRegistry, untilResolved } from '@tests/js/utils';
import { MODULES_READER_REVENUE_MANAGER } from './constants';

describe( 'modules/reader-revenue-manager CTAs', () => {
	let registry: WPDataRegistry;

	const ctasEndpoint = new RegExp(
		'^/google-site-kit/v1/modules/reader-revenue-manager/data/ctas'
	);
	const createCTAEndpoint = new RegExp(
		'^/google-site-kit/v1/modules/reader-revenue-manager/data/create-cta'
	);

	const params = {
		organizationID: 'ABCD1234',
		publicationID: 'ABCD_123-4',
	};

	const createArgs = {
		...params,
		type: 'NEWSLETTER_SIGNUP',
		config: { title: 'Subscribe to our newsletter' },
	} as const;

	const cta = {
		name: 'organizations/ABCD1234/publications/ABCD_123-4/ctas/1',
		type: 'NEWSLETTER_SIGNUP',
	};

	beforeEach( () => {
		registry = createTestRegistry();
	} );

	describe( 'actions', () => {
		describe( 'createCTA', () => {
			it( 'should create the CTA and return the response', async () => {
				fetchMock.postOnce( createCTAEndpoint, {
					body: cta,
					status: 200,
				} );

				const { response, error } = await registry
					.dispatch( MODULES_READER_REVENUE_MANAGER )
					.createCTA( createArgs );

				expect( response ).toEqual( cta );
				expect( error ).toBeUndefined();
				expect( fetchMock ).toHaveFetched( createCTAEndpoint, {
					body: {
						data: createArgs,
					},
				} );
			} );

			it( 'should set an action error when the request fails', async () => {
				const errorResponse = {
					code: 'internal_server_error',
					message: 'Internal server error',
					data: { status: 500 },
				};
				fetchMock.postOnce( createCTAEndpoint, {
					body: errorResponse,
					status: 500,
				} );

				const { response, error } = await registry
					.dispatch( MODULES_READER_REVENUE_MANAGER )
					.createCTA( createArgs );

				expect( console ).toHaveErrored();
				expect( response ).toBeUndefined();
				expect( error ).toEqual( errorResponse );
				expect(
					registry
						.select( MODULES_READER_REVENUE_MANAGER )
						.getErrorForAction( 'createCTA', [] )
				).toEqual( errorResponse );
			} );

			it( 'should validate the publication parameters', () => {
				const { type, config } = createArgs;

				expect( () =>
					registry
						.dispatch( MODULES_READER_REVENUE_MANAGER )
						.createCTA( {
							publicationID: params.publicationID,
							type,
							config,
						} )
				).toThrow( 'organizationID is required and must be a string.' );

				expect( () =>
					registry
						.dispatch( MODULES_READER_REVENUE_MANAGER )
						.createCTA( {
							organizationID: params.organizationID,
							type,
							config,
						} )
				).toThrow( 'publicationID is required and must be a string.' );
			} );

			it( 'should throw for an unsupported CTA type', () => {
				expect( () =>
					registry
						.dispatch( MODULES_READER_REVENUE_MANAGER )
						.createCTA( { ...createArgs, type: 'SUBSCRIPTION' } )
				).toThrow( 'type is not supported.' );
			} );

			it( 'should validate the config via the CTA type handler', () => {
				expect( () =>
					registry
						.dispatch( MODULES_READER_REVENUE_MANAGER )
						.createCTA( { ...createArgs, config: undefined } )
				).toThrow( 'config is required and must be an object.' );

				expect( () =>
					registry
						.dispatch( MODULES_READER_REVENUE_MANAGER )
						.createCTA( {
							...createArgs,
							config: { unknownSetting: 'value' },
						} )
				).toThrow( 'config contains unsupported fields.' );

				expect( () =>
					registry
						.dispatch( MODULES_READER_REVENUE_MANAGER )
						.createCTA( { ...createArgs, config: { title: 123 } } )
				).toThrow( 'config.title must be a string.' );
			} );

			it( 'should validate the display name', () => {
				expect( () =>
					registry
						.dispatch( MODULES_READER_REVENUE_MANAGER )
						.createCTA( { ...createArgs, displayName: 123 } )
				).toThrow( 'displayName must be a string.' );
			} );
		} );
	} );

	describe( 'selectors', () => {
		describe( 'getCTAs', () => {
			it( 'should fetch the CTAs when they are not loaded', async () => {
				fetchMock.getOnce( ctasEndpoint, {
					body: [ cta ],
					status: 200,
				} );

				expect(
					registry
						.select( MODULES_READER_REVENUE_MANAGER )
						.getCTAs( params )
				).toBeUndefined();

				await untilResolved(
					registry,
					MODULES_READER_REVENUE_MANAGER
				).getCTAs( params );

				expect( fetchMock ).toHaveFetchedTimes( 1 );
				expect(
					registry
						.select( MODULES_READER_REVENUE_MANAGER )
						.getCTAs( params )
				).toEqual( [ cta ] );
			} );

			it( 'should return undefined without fetching when called with no params', async () => {
				expect(
					registry.select( MODULES_READER_REVENUE_MANAGER ).getCTAs()
				).toBeUndefined();

				await untilResolved(
					registry,
					MODULES_READER_REVENUE_MANAGER
				).getCTAs();

				expect( fetchMock ).toHaveFetchedTimes( 0 );
			} );

			it( 'should not fetch CTAs that are already loaded', async () => {
				registry
					.dispatch( MODULES_READER_REVENUE_MANAGER )
					.receiveGetCTAs( [ cta ], params );

				expect(
					registry
						.select( MODULES_READER_REVENUE_MANAGER )
						.getCTAs( params )
				).toEqual( [ cta ] );

				await untilResolved(
					registry,
					MODULES_READER_REVENUE_MANAGER
				).getCTAs( params );

				expect( fetchMock ).toHaveFetchedTimes( 0 );
			} );
		} );
	} );
} );
