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
import { enabledFeatures } from '@/js/features';
import { createTestRegistry, untilResolved } from '@tests/js/utils';
import {
	EXPRESS_SETUP_CTAS,
	MODULES_READER_REVENUE_MANAGER,
} from './constants';

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

	const otherParams = {
		organizationID: 'WXYZ5678',
		publicationID: 'WXYZ_567-8',
	};

	const ctaData = {
		type: 'NEWSLETTER_SIGNUP',
		config: { title: 'Subscribe to our newsletter' },
	} as const;

	const createArgs = {
		...params,
		data: ctaData,
	};

	const cta = {
		name: 'organizations/ABCD1234/publications/ABCD_123-4/ctas/9d2418415-ab3a',
		type: 'NEWSLETTER_SIGNUP',
	};

	const otherCTA = {
		name: 'organizations/WXYZ5678/publications/WXYZ_567-8/ctas/8j8152411-cd4b',
		type: 'NEWSLETTER_SIGNUP',
	};

	beforeEach( () => {
		enabledFeatures.add( 'rrmExpressSetup' );
		registry = createTestRegistry();

		registry
			.dispatch( MODULES_READER_REVENUE_MANAGER )
			.receiveGetSettings( params );
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

			it( 'should create the CTA without the publication identifiers', async () => {
				fetchMock.postOnce( createCTAEndpoint, {
					body: cta,
					status: 200,
				} );

				await registry
					.dispatch( MODULES_READER_REVENUE_MANAGER )
					.createCTA( { data: ctaData } );

				expect( fetchMock ).toHaveFetched( createCTAEndpoint, {
					body: {
						data: { data: ctaData },
					},
				} );
			} );

			it( 'should add the created CTA to the loaded CTAs', async () => {
				registry
					.dispatch( MODULES_READER_REVENUE_MANAGER )
					.receiveGetCTAs( { ctas: [], params } );

				fetchMock.postOnce( createCTAEndpoint, {
					body: cta,
					status: 200,
				} );

				await registry
					.dispatch( MODULES_READER_REVENUE_MANAGER )
					.createCTA( createArgs );

				expect(
					registry.select( MODULES_READER_REVENUE_MANAGER ).getCTAs()
				).toEqual( [ cta ] );
			} );

			it( 'should add the created CTA using the saved publication ID when none is passed', async () => {
				registry
					.dispatch( MODULES_READER_REVENUE_MANAGER )
					.receiveGetCTAs( { ctas: [], params: {} } );

				fetchMock.postOnce( createCTAEndpoint, {
					body: cta,
					status: 200,
				} );

				await registry
					.dispatch( MODULES_READER_REVENUE_MANAGER )
					.createCTA( { data: ctaData } );

				expect(
					registry.select( MODULES_READER_REVENUE_MANAGER ).getCTAs()
				).toEqual( [ cta ] );
			} );

			it( 'should not add the created CTA to another publication list', async () => {
				registry
					.dispatch( MODULES_READER_REVENUE_MANAGER )
					.receiveGetCTAs( { ctas: [], params } );
				registry
					.dispatch( MODULES_READER_REVENUE_MANAGER )
					.receiveGetCTAs( { ctas: [], params: otherParams } );

				fetchMock.postOnce( createCTAEndpoint, {
					body: cta,
					status: 200,
				} );

				await registry
					.dispatch( MODULES_READER_REVENUE_MANAGER )
					.createCTA( createArgs );

				expect(
					registry.select( MODULES_READER_REVENUE_MANAGER ).getCTAs()
				).toEqual( [ cta ] );
				expect(
					registry
						.select( MODULES_READER_REVENUE_MANAGER )
						.getCTAs( otherParams )
				).toEqual( [] );
			} );

			it( 'should not add the created CTA before the CTAs are loaded', async () => {
				fetchMock.postOnce( createCTAEndpoint, {
					body: cta,
					status: 200,
				} );
				fetchMock.getOnce( ctasEndpoint, { body: [], status: 200 } );

				await registry
					.dispatch( MODULES_READER_REVENUE_MANAGER )
					.createCTA( createArgs );

				expect(
					registry.select( MODULES_READER_REVENUE_MANAGER ).getCTAs()
				).toBeUndefined();

				await untilResolved(
					registry,
					MODULES_READER_REVENUE_MANAGER
				).getCTAs();

				expect(
					registry.select( MODULES_READER_REVENUE_MANAGER ).getCTAs()
				).toEqual( [] );
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
						.getErrorForAction( 'createCTA', [ createArgs ] )
				).toEqual( errorResponse );
			} );

			it( 'should validate the publication parameters when provided', () => {
				expect( () =>
					registry
						.dispatch( MODULES_READER_REVENUE_MANAGER )
						.createCTA( { ...createArgs, organizationID: '' } )
				).toThrow(
					'organizationID must be a non-empty string when provided.'
				);

				expect( () =>
					registry
						.dispatch( MODULES_READER_REVENUE_MANAGER )
						.createCTA( { ...createArgs, publicationID: 123 } )
				).toThrow(
					'publicationID must be a non-empty string when provided.'
				);
			} );

			it( 'should require the CTA data', () => {
				expect( () =>
					registry
						.dispatch( MODULES_READER_REVENUE_MANAGER )
						.createCTA( params )
				).toThrow( 'data is required and must be a non-empty object.' );
			} );

			it( 'should throw for an unsupported CTA type', () => {
				expect( () =>
					registry
						.dispatch( MODULES_READER_REVENUE_MANAGER )
						.createCTA( {
							...createArgs,
							data: { ...ctaData, type: 'SUBSCRIPTION' },
						} )
				).toThrow( 'data.type is not supported.' );
			} );

			it( 'should validate the config via the CTA type handler', () => {
				expect( () =>
					registry
						.dispatch( MODULES_READER_REVENUE_MANAGER )
						.createCTA( {
							...createArgs,
							data: { type: ctaData.type },
						} )
				).toThrow( 'config is required and must be an object.' );

				expect( () =>
					registry
						.dispatch( MODULES_READER_REVENUE_MANAGER )
						.createCTA( {
							...createArgs,
							data: {
								...ctaData,
								config: { unknownSetting: 'value' },
							},
						} )
				).toThrow( 'config contains unsupported fields.' );

				expect( () =>
					registry
						.dispatch( MODULES_READER_REVENUE_MANAGER )
						.createCTA( {
							...createArgs,
							data: { ...ctaData, config: { title: 123 } },
						} )
				).toThrow( 'config.title must be a string.' );
			} );

			it( 'should validate the display name', () => {
				expect( () =>
					registry
						.dispatch( MODULES_READER_REVENUE_MANAGER )
						.createCTA( {
							...createArgs,
							data: { ...ctaData, displayName: 123 },
						} )
				).toThrow( 'data.displayName must be a string.' );
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

				expect( fetchMock ).toHaveFetched( ctasEndpoint, {
					query: params,
				} );
				expect(
					registry
						.select( MODULES_READER_REVENUE_MANAGER )
						.getCTAs( params )
				).toEqual( [ cta ] );
				expect(
					registry
						.select( MODULES_READER_REVENUE_MANAGER )
						.getSettings().configuredCTAs
				).toEqual( {
					'9d2418415-ab3a': EXPRESS_SETUP_CTAS.NEWSLETTER_SIGNUP,
				} );
				expect(
					registry
						.select( MODULES_READER_REVENUE_MANAGER )
						.haveSettingsChanged()
				).toBe( false );
			} );

			it( 'should not synchronize configured CTAs when the feature is disabled', () => {
				enabledFeatures.delete( 'rrmExpressSetup' );
				registry
					.dispatch( MODULES_READER_REVENUE_MANAGER )
					.receiveGetSettings( {
						...params,
						configuredCTAs: {
							existing: EXPRESS_SETUP_CTAS.NEWSLETTER_SIGNUP,
						},
					} );

				registry
					.dispatch( MODULES_READER_REVENUE_MANAGER )
					.receiveGetCTAs( { ctas: [ cta ], params } );

				expect(
					registry
						.select( MODULES_READER_REVENUE_MANAGER )
						.getSettings().configuredCTAs
				).toEqual( {
					existing: EXPRESS_SETUP_CTAS.NEWSLETTER_SIGNUP,
				} );
			} );

			it( 'should skip CTAs with unsupported types when synchronizing configured CTAs', () => {
				registry
					.dispatch( MODULES_READER_REVENUE_MANAGER )
					.receiveGetCTAs( {
						ctas: [
							cta,
							{
								name: 'organizations/ABCD1234/publications/ABCD_123-4/ctas/unknown-type',
								type: 'UNKNOWN_TYPE',
							},
						],
						params,
					} );

				expect(
					registry
						.select( MODULES_READER_REVENUE_MANAGER )
						.getSettings().configuredCTAs
				).toEqual( {
					'9d2418415-ab3a': EXPRESS_SETUP_CTAS.NEWSLETTER_SIGNUP,
				} );
			} );

			it( 'should fetch the CTAs when called with no params', async () => {
				fetchMock.getOnce( ctasEndpoint, {
					body: [ cta ],
					status: 200,
				} );

				expect(
					registry.select( MODULES_READER_REVENUE_MANAGER ).getCTAs()
				).toBeUndefined();

				await untilResolved(
					registry,
					MODULES_READER_REVENUE_MANAGER
				).getCTAs();

				expect( fetchMock ).toHaveFetchedTimes( 1 );
				expect(
					registry.select( MODULES_READER_REVENUE_MANAGER ).getCTAs()
				).toEqual( [ cta ] );
			} );

			it( 'should not fetch CTAs when no publication ID is available', async () => {
				registry
					.dispatch( MODULES_READER_REVENUE_MANAGER )
					.setPublicationID( '' );

				expect(
					registry.select( MODULES_READER_REVENUE_MANAGER ).getCTAs()
				).toBeUndefined();

				await untilResolved(
					registry,
					MODULES_READER_REVENUE_MANAGER
				).getCTAs();

				expect( fetchMock ).not.toHaveFetched( ctasEndpoint );
				expect(
					registry.select( MODULES_READER_REVENUE_MANAGER ).getCTAs()
				).toBeUndefined();
			} );

			it( 'should not fetch CTAs that are already loaded', async () => {
				registry
					.dispatch( MODULES_READER_REVENUE_MANAGER )
					.receiveGetCTAs( { ctas: [ cta ], params } );

				expect(
					registry.select( MODULES_READER_REVENUE_MANAGER ).getCTAs()
				).toEqual( [ cta ] );

				await untilResolved(
					registry,
					MODULES_READER_REVENUE_MANAGER
				).getCTAs();

				expect( fetchMock ).not.toHaveFetched( ctasEndpoint );
			} );

			it( 'should not fetch CTAs when an empty list is already loaded', async () => {
				registry
					.dispatch( MODULES_READER_REVENUE_MANAGER )
					.receiveGetCTAs( { ctas: [], params } );

				expect(
					registry.select( MODULES_READER_REVENUE_MANAGER ).getCTAs()
				).toEqual( [] );

				await untilResolved(
					registry,
					MODULES_READER_REVENUE_MANAGER
				).getCTAs();

				expect( fetchMock ).not.toHaveFetched( ctasEndpoint );
			} );

			it( 'should keep CTA lists for different publications separate', () => {
				registry
					.dispatch( MODULES_READER_REVENUE_MANAGER )
					.receiveGetCTAs( { ctas: [ cta ], params } );
				registry
					.dispatch( MODULES_READER_REVENUE_MANAGER )
					.receiveGetCTAs( {
						ctas: [ otherCTA ],
						params: otherParams,
					} );

				expect(
					registry.select( MODULES_READER_REVENUE_MANAGER ).getCTAs()
				).toEqual( [ cta ] );
				expect(
					registry
						.select( MODULES_READER_REVENUE_MANAGER )
						.getCTAs( otherParams )
				).toEqual( [ otherCTA ] );
			} );
		} );
	} );
} );
