/* eslint-disable sitekit/acronym-case */
/**
 * `modules/reader-revenue-manager` data store: publications tests.
 *
 * Site Kit by Google, Copyright 2024 Google LLC
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
import { cloneDeep } from 'lodash';

/**
 * WordPress dependencies
 */
import { WPDataRegistry } from '@wordpress/data/build-types/registry';

/**
 * Internal dependencies
 */
import { setUsingCache } from 'googlesitekit-api';
import { enabledFeatures } from '@/js/features';
import { CORE_USER } from '@/js/googlesitekit/datastore/user/constants';
import { MODULE_SLUG_READER_REVENUE_MANAGER } from '@/js/modules/reader-revenue-manager/constants';
import { providePublication } from '@/js/modules/reader-revenue-manager/utils/test-utils';
import { createTestRegistryWithFeatures } from '@tests/js/feature-flag-utils';
import {
	createTestRegistry,
	freezeFetch,
	muteFetch,
	provideModuleRegistrations,
	provideModules,
	provideUserInfo,
	untilResolved,
	waitForDefaultTimeouts,
} from '@tests/js/utils';
import * as fixtures from './__fixtures__';
import {
	MODULES_READER_REVENUE_MANAGER,
	PUBLICATION_ONBOARDING_STATES,
} from './constants';

describe( 'modules/reader-revenue-manager publications', () => {
	let registry: WPDataRegistry;

	const getModulesEndpoint = new RegExp(
		'^/google-site-kit/v1/core/modules/data/list'
	);

	const publicationsEndpoint = new RegExp(
		'^/google-site-kit/v1/modules/reader-revenue-manager/data/publications'
	);

	const createPublicationEndpoint = new RegExp(
		'^/google-site-kit/v1/modules/reader-revenue-manager/data/create-publication'
	);

	const publicationEndpoint = new RegExp(
		'^/google-site-kit/v1/modules/reader-revenue-manager/data/publication(?:\\?|$)'
	);

	const syncOnboardingStateEndpoint = new RegExp(
		'^/google-site-kit/v1/modules/reader-revenue-manager/data/sync-publication-onboarding-state'
	);

	const settingsEndpoint = new RegExp(
		'^/google-site-kit/v1/modules/reader-revenue-manager/data/settings'
	);

	beforeAll( () => {
		setUsingCache( false );
	} );

	beforeEach( () => {
		registry = createTestRegistry();
		provideUserInfo( registry );
	} );

	/**
	 * Connects a publication by receiving it as the module settings.
	 *
	 * @since 1.193.0
	 * @private
	 *
	 * @param {Object} settings Settings to receive.
	 * @return {void}
	 */
	function connectPublication( settings: Record< string, unknown > ) {
		registry
			.dispatch( MODULES_READER_REVENUE_MANAGER )
			.receiveGetSettings( settings );
	}

	describe( 'actions', () => {
		beforeEach( () => {
			// Make sure the RRM module is active and connected.
			const extraData = [
				{
					slug: MODULE_SLUG_READER_REVENUE_MANAGER,
					active: true,
					connected: true,
				},
			];
			provideModules( registry, extraData );
			provideModuleRegistrations( registry, extraData );
		} );

		describe( 'createPublication', () => {
			const params = {
				displayName: 'Example Publication',
				languageCode: 'en',
				regionCode: 'US',
			};

			it( 'should require publication details', () => {
				expect( () =>
					registry
						.dispatch( MODULES_READER_REVENUE_MANAGER )
						.createPublication()
				).toThrow( 'params must be an object.' );

				expect( () =>
					registry
						.dispatch( MODULES_READER_REVENUE_MANAGER )
						.createPublication( {
							...params,
							displayName: '',
						} )
				).toThrow( 'displayName is required and must be a string.' );
			} );

			it( 'should call the create publication endpoint', async () => {
				const publication = {
					displayName: params.displayName,
					publicationId: 'publication-1',
				};
				fetchMock.postOnce( createPublicationEndpoint, {
					body: publication,
					status: 200,
				} );

				const { response, error } = await registry
					.dispatch( MODULES_READER_REVENUE_MANAGER )
					.createPublication( params );

				expect( error ).toBeUndefined();
				expect( response ).toEqual( publication );
				expect( fetchMock ).toHaveFetched( createPublicationEndpoint, {
					body: { data: params },
				} );
			} );
		} );

		describe( 'created publication state', () => {
			const params = {
				displayName: 'Example Publication',
				languageCode: 'en',
				regionCode: 'US',
			};

			const publication = fixtures.publications[ 3 ];

			it( 'should not need additional requests for publications after creating and selecting a first publication', async () => {
				enabledFeatures.add( 'rrmExpressSetup' );

				const dispatch = registry.dispatch(
					MODULES_READER_REVENUE_MANAGER
				);

				const select = registry.select(
					MODULES_READER_REVENUE_MANAGER
				);

				dispatch.receiveGetSettings( {
					publicationID: '',
					organizationID: '',
					snippetMode: 'per_post',
					postTypes: [],
					configuredCTAs: {},
				} );

				dispatch.receiveGetPublications( [] );

				select.getPublication();

				await waitForDefaultTimeouts();

				expect( select.getPublication() ).toBeUndefined();

				expect( fetchMock ).not.toHaveFetched( publicationEndpoint );

				fetchMock.postOnce( createPublicationEndpoint, {
					body: publication,
				} );

				fetchMock.postOnce( settingsEndpoint, ( url, { body } ) => ( {
					body: JSON.parse( body as string ).data,
				} ) );

				const { response } = await dispatch.createPublication( params );

				await dispatch.selectPublication( response );

				expect( await dispatch.submitChanges() ).toEqual( {} );

				select.getPublication();

				await untilResolved(
					registry,
					MODULES_READER_REVENUE_MANAGER
				).getPublicationByID(
					// eslint-disable-next-line sitekit/acronym-case
					publication.organizationId,
					// eslint-disable-next-line sitekit/acronym-case
					publication.publicationId
				);

				expect( select.getPublication() ).toEqual( publication );
				expect( fetchMock ).not.toHaveFetched( publicationEndpoint );
			} );

			it( 'should add created publications to state and return it without an additional request', async () => {
				const existing = fixtures.publications[ 0 ];

				registry
					.dispatch( MODULES_READER_REVENUE_MANAGER )
					.receiveGetPublications( [ existing ] );

				fetchMock.postOnce( createPublicationEndpoint, {
					body: publication,
				} );

				await registry
					.dispatch( MODULES_READER_REVENUE_MANAGER )
					.createPublication( params );

				expect(
					registry
						.select( MODULES_READER_REVENUE_MANAGER )
						.getPublications()
				).toEqual( [ existing, publication ] );

				connectPublication( {
					organizationID: publication.organizationId,
					publicationID: publication.publicationId,
				} );

				expect(
					registry
						.select( MODULES_READER_REVENUE_MANAGER )
						.getPublication()
				).toEqual( publication );

				await untilResolved(
					registry,
					MODULES_READER_REVENUE_MANAGER
				).getPublicationByID(
					// eslint-disable-next-line sitekit/acronym-case
					publication.organizationId,
					// eslint-disable-next-line sitekit/acronym-case
					publication.publicationId
				);

				expect( fetchMock ).not.toHaveFetched( publicationEndpoint );
			} );

			it( 'should preserve publications state when creation fails', async () => {
				registry
					.dispatch( MODULES_READER_REVENUE_MANAGER )
					.receiveGetPublications( [ publication ] );

				fetchMock.postOnce( createPublicationEndpoint, {
					body: {
						code: 'internal_server_error',
						message: 'Creation failed',
						data: { status: 500 },
					},
					status: 500,
				} );

				await registry
					.dispatch( MODULES_READER_REVENUE_MANAGER )
					.createPublication( params );

				expect(
					registry
						.select( MODULES_READER_REVENUE_MANAGER )
						.getPublications()
				).toEqual( [ publication ] );

				expect( console ).toHaveErrored();
			} );
		} );

		describe( 'refreshPublication', () => {
			const publication = fixtures.publications[ 0 ];

			it( 'should request the publication in the settings again', async () => {
				providePublication( registry, publication );

				fetchMock.getOnce( publicationEndpoint, {
					body: publication,
					status: 200,
				} );

				const { error } = await registry
					.dispatch( MODULES_READER_REVENUE_MANAGER )
					.refreshPublication();

				expect( error ).toBeUndefined();
				expect( fetchMock ).toHaveFetched( publicationEndpoint, {
					query: {
						organizationID: publication.organizationId,
						publicationID: publication.publicationId,
						_locale: 'user',
					},
				} );
			} );

			it( 'should send no request when no publication is connected', async () => {
				connectPublication( { publicationID: '' } );

				expect(
					await registry
						.dispatch( MODULES_READER_REVENUE_MANAGER )
						.refreshPublication()
				).toEqual( {} );

				expect( fetchMock ).not.toHaveFetched( publicationEndpoint );
			} );
		} );

		describe( 'updatePublication', () => {
			const params = {
				organizationID: 'organization-1',
				publicationID: 'publication-1',
				data: {
					rrmProduct: {
						tosAcceptance: {
							userAccepted: true,
						},
					},
				},
			};
			it( 'should require fields to update', () => {
				expect( () =>
					registry
						.dispatch( MODULES_READER_REVENUE_MANAGER )
						.updatePublication()
				).toThrow( 'params must be an object.' );

				expect( () =>
					registry
						.dispatch( MODULES_READER_REVENUE_MANAGER )
						.updatePublication( {} )
				).toThrow( 'data is required and must be a non-empty object.' );
			} );

			it( 'should call the update publication endpoint', async () => {
				const publication = {
					publicationId: params.publicationID,
					rrmProduct: params.data.rrmProduct,
				};
				fetchMock.postOnce( publicationEndpoint, {
					body: publication,
					status: 200,
				} );

				connectPublication( {
					organizationID: params.organizationID,
					publicationID: params.publicationID,
				} );

				const { response, error } = await registry
					.dispatch( MODULES_READER_REVENUE_MANAGER )
					.updatePublication( { data: params.data } );

				expect( error ).toBeUndefined();
				expect( response ).toEqual( publication );

				// The identifiers come from the settings rather than the caller.
				expect( fetchMock ).toHaveFetched( publicationEndpoint, {
					body: { data: params },
				} );
				expect(
					registry
						.select( MODULES_READER_REVENUE_MANAGER )
						.getPublication()
				).toEqual( publication );
			} );

			it( 'should refresh the publication in the publications list', async () => {
				// The listed publication has yet to accept the terms.
				const publication = {
					...fixtures.publications[ 0 ],
					publicationId: params.publicationID,
					rrmProduct: { tosAcceptance: { userAccepted: false } },
				};

				const updatedPublication = {
					...publication,
					rrmProduct: params.data.rrmProduct,
				};

				fetchMock.postOnce( publicationEndpoint, {
					body: updatedPublication,
					status: 200,
				} );

				connectPublication( {
					organizationID: params.organizationID,
					publicationID: params.publicationID,
				} );

				registry
					.dispatch( MODULES_READER_REVENUE_MANAGER )
					.receiveGetPublications( [ publication ] );

				await registry
					.dispatch( MODULES_READER_REVENUE_MANAGER )
					.updatePublication( { data: params.data } );

				expect(
					registry
						.select( MODULES_READER_REVENUE_MANAGER )
						.getPublications()
				).toEqual( [ updatedPublication ] );
			} );
		} );

		describe( 'syncPublicationOnboardingState', () => {
			it( 'should return `undefined` when no publication ID is present', async () => {
				registry
					.dispatch( MODULES_READER_REVENUE_MANAGER )
					.receiveGetPublications( fixtures.publications );

				registry
					.dispatch( MODULES_READER_REVENUE_MANAGER )
					.receiveGetSettings( {} );

				const syncStatus = await registry
					.dispatch( MODULES_READER_REVENUE_MANAGER )
					.syncPublicationOnboardingState();

				expect( syncStatus ).toEqual( {} );
			} );

			it( 'should call the `sync-publication-onboarding-state` endpoint and update the settings in state', async () => {
				const publication = fixtures.publications[ 0 ];

				const settings = {
					publicationID: publication.publicationId,
					publicationOnboardingState:
						PUBLICATION_ONBOARDING_STATES.PENDING_VERIFICATION,
				};

				fetchMock.postOnce( syncOnboardingStateEndpoint, {
					body: {
						publicationID: publication.publicationId,
						publicationOnboardingState:
							PUBLICATION_ONBOARDING_STATES.UNSPECIFIED,
					},
					status: 200,
				} );

				registry
					.dispatch( MODULES_READER_REVENUE_MANAGER )
					.receiveGetSettings( settings );

				await registry
					.dispatch( MODULES_READER_REVENUE_MANAGER )
					.syncPublicationOnboardingState();

				// Set expectations for settings endpoint.
				expect( fetchMock ).toHaveFetched(
					syncOnboardingStateEndpoint
				);

				// Set expectations for publication ID.
				expect(
					registry
						.select( MODULES_READER_REVENUE_MANAGER )
						.getPublicationID()
				).toEqual( 'ABCDEFGH' );

				// Set expectations for publication onboarding state.
				expect(
					registry
						.select( MODULES_READER_REVENUE_MANAGER )
						.getPublicationOnboardingState()
				).toEqual( PUBLICATION_ONBOARDING_STATES.UNSPECIFIED );
			} );

			it( 'should update the stored publication when it is not in the publications list', async () => {
				const publication = {
					...fixtures.publications[ 0 ],
					onboardingState:
						PUBLICATION_ONBOARDING_STATES.PENDING_VERIFICATION,
				};

				fetchMock.postOnce( syncOnboardingStateEndpoint, {
					body: {
						publicationID: publication.publicationId,
						publicationOnboardingState:
							PUBLICATION_ONBOARDING_STATES.ONBOARDING_COMPLETE,
					},
					status: 200,
				} );

				const params = {
					organizationID: publication.organizationId,
					publicationID: publication.publicationId,
				};

				connectPublication( params );

				registry
					.dispatch( MODULES_READER_REVENUE_MANAGER )
					.receiveGetPublicationByID( publication, params );

				await registry
					.dispatch( MODULES_READER_REVENUE_MANAGER )
					.syncPublicationOnboardingState();

				expect(
					registry
						.select( MODULES_READER_REVENUE_MANAGER )
						.getPublicationByID(
							params.organizationID,
							params.publicationID
						)?.onboardingState
				).toEqual( PUBLICATION_ONBOARDING_STATES.ONBOARDING_COMPLETE );
			} );
		} );

		describe( 'findMatchedPublication', () => {
			it( 'should return `null` if there are no publications', async () => {
				registry
					.dispatch( MODULES_READER_REVENUE_MANAGER )
					.receiveGetPublications( [] );

				const publication = await registry
					.dispatch( MODULES_READER_REVENUE_MANAGER )
					.findMatchedPublication();

				expect( publication ).toBeNull();
			} );

			it( 'should return the publication if that is the only one in the list', async () => {
				registry
					.dispatch( MODULES_READER_REVENUE_MANAGER )
					.receiveGetPublications( [ fixtures.publications[ 0 ] ] );

				const publication = await registry
					.dispatch( MODULES_READER_REVENUE_MANAGER )
					.findMatchedPublication();

				expect( publication ).toEqual( fixtures.publications[ 0 ] );
			} );

			it( 'should return the publication with ONBOARDING_COMPLETE if more than one publication exists', async () => {
				const completedOnboardingPublication =
					fixtures.publications.find(
						( publication ) =>
							publication.onboardingState ===
							PUBLICATION_ONBOARDING_STATES.ONBOARDING_COMPLETE
					);

				registry
					.dispatch( MODULES_READER_REVENUE_MANAGER )
					.receiveGetPublications( fixtures.publications );

				const publication = await registry
					.dispatch( MODULES_READER_REVENUE_MANAGER )
					.findMatchedPublication();

				expect( publication ).toEqual( completedOnboardingPublication );
			} );

			it( 'should return the first publication if none have ONBOARDING_COMPLETE', async () => {
				const publications = fixtures.publications.map(
					( publication ) => ( {
						...publication,
						onboardingState:
							PUBLICATION_ONBOARDING_STATES.PENDING_VERIFICATION,
					} )
				);

				registry
					.dispatch( MODULES_READER_REVENUE_MANAGER )
					.receiveGetPublications( publications );

				const publication = await registry
					.dispatch( MODULES_READER_REVENUE_MANAGER )
					.findMatchedPublication();

				expect( publication ).toEqual( publications[ 0 ] );
			} );
		} );

		describe( 'resetPublications', () => {
			it( 'should reset the publications data in the store', async () => {
				const response = fixtures.publications.slice( 0, 2 );
				fetchMock.getOnce( publicationsEndpoint, {
					body: response,
					status: 200,
				} );

				registry
					.dispatch( MODULES_READER_REVENUE_MANAGER )
					.receiveGetPublications( fixtures.publications );

				registry
					.dispatch( MODULES_READER_REVENUE_MANAGER )
					.receiveGetSettings( {} );

				await registry
					.dispatch( MODULES_READER_REVENUE_MANAGER )
					.resetPublications();

				registry
					.select( MODULES_READER_REVENUE_MANAGER )
					.getPublications();

				await untilResolved(
					registry,
					MODULES_READER_REVENUE_MANAGER
				).getPublications();

				expect( fetchMock ).toHaveFetched();

				expect(
					registry
						.select( MODULES_READER_REVENUE_MANAGER )
						.getPublications()
				).toEqual( response );
			} );
		} );

		describe( 'selectPublication', () => {
			it( 'should throw an error if a publication object is not provided', () => {
				expect( () =>
					registry
						.dispatch( MODULES_READER_REVENUE_MANAGER )
						.selectPublication()
				).toThrow( 'A valid publication object is required.' );
			} );

			it.each( [ 'publicationId', 'onboardingState' ] )(
				'should throw an error if the publication object does not contain %s',
				( key ) => {
					const publication: Record< string, unknown > = {
						publicationPredicates: {},
						verifiedDomains: [],
					};

					switch ( key ) {
						case 'publicationId':
							publication.onboardingState = '';
							break;
						case 'onboardingState':
							publication.publicationId = '';
							break;
					}

					expect( () =>
						registry
							.dispatch( MODULES_READER_REVENUE_MANAGER )
							.selectPublication( publication )
					).toThrow( `The publication object must contain ${ key }` );
				}
			);

			it( 'should set the given publication in state', () => {
				expect(
					registry
						.select( MODULES_READER_REVENUE_MANAGER )
						.getPublicationID()
				).toBeUndefined();
				expect(
					registry
						.select( MODULES_READER_REVENUE_MANAGER )
						.getPublicationOnboardingState()
				).toBeUndefined();

				const [ publicationId, onboardingState ] = [
					'publication-id',
					'onboarding-state',
				];

				registry
					.dispatch( MODULES_READER_REVENUE_MANAGER )
					.selectPublication( {
						publicationId,
						onboardingState,
					} );

				expect(
					registry
						.select( MODULES_READER_REVENUE_MANAGER )
						.getPublicationID()
				).toEqual( publicationId );
				expect(
					registry
						.select( MODULES_READER_REVENUE_MANAGER )
						.getPublicationOnboardingState()
				).toEqual( onboardingState );

				expect(
					registry
						.select( MODULES_READER_REVENUE_MANAGER )
						.getPublicationOnboardingStateChanged()
				).toEqual( false );
			} );

			it( 'should set the organization ID when the `rrmExpressSetup` feature flag is enabled', () => {
				enabledFeatures.add( 'rrmExpressSetup' );

				registry
					.dispatch( MODULES_READER_REVENUE_MANAGER )
					.selectPublication( {
						publicationId: 'publication-id',
						organizationId: 'organization-id',
						onboardingState: 'onboarding-state',
					} );

				expect(
					registry
						.select( MODULES_READER_REVENUE_MANAGER )
						.getSettings()
				).toMatchObject( {
					organizationID: 'organization-id',
				} );
			} );

			it( 'should set the organization ID to an empty string when the publication has no organization ID and the `rrmExpressSetup` feature flag is enabled', () => {
				enabledFeatures.add( 'rrmExpressSetup' );

				registry
					.dispatch( MODULES_READER_REVENUE_MANAGER )
					.selectPublication( {
						publicationId: 'publication-id',
						onboardingState: 'onboarding-state',
					} );

				expect(
					registry
						.select( MODULES_READER_REVENUE_MANAGER )
						.getSettings()
				).toMatchObject( {
					organizationID: '',
				} );
			} );

			it( 'should not set the organization ID when the `rrmExpressSetup` feature flag is disabled', () => {
				registry
					.dispatch( MODULES_READER_REVENUE_MANAGER )
					.selectPublication( {
						publicationId: 'publication-id',
						organizationId: 'organization-id',
						onboardingState: 'onboarding-state',
					} );

				expect(
					registry
						.select( MODULES_READER_REVENUE_MANAGER )
						.getSettings()
				).not.toHaveProperty( 'organizationID' );
			} );

			it( 'should set the product IDs in state when products are provided', () => {
				const products = [
					{ name: 'ABC:product-1' },
					{ name: 'DEF:product-2' },
				];
				registry
					.dispatch( MODULES_READER_REVENUE_MANAGER )
					.selectPublication( {
						publicationId: 'publication-id',
						onboardingState: 'onboarding-state',
						products,
					} );

				expect(
					registry
						.select( MODULES_READER_REVENUE_MANAGER )
						.getProductIDs()
				).toEqual( [ 'ABC:product-1', 'DEF:product-2' ] );
			} );

			it( 'should set an empty product IDs array when products array is empty', () => {
				registry
					.dispatch( MODULES_READER_REVENUE_MANAGER )
					.selectPublication( {
						publicationId: 'publication-id',
						onboardingState: 'onboarding-state',
						products: [],
					} );

				expect(
					registry
						.select( MODULES_READER_REVENUE_MANAGER )
						.getProductIDs()
				).toEqual( [] );
			} );

			it( 'should handle products with a missing name property', () => {
				const products = [
					{ name: 'ABC:product-1' },
					{}, // Missing name
					{ name: 'DEF:product-2' },
				];
				registry
					.dispatch( MODULES_READER_REVENUE_MANAGER )
					.selectPublication( {
						publicationId: 'publication-id',
						onboardingState: 'onboarding-state',
						products,
					} );

				expect(
					registry
						.select( MODULES_READER_REVENUE_MANAGER )
						.getProductIDs()
				).toEqual( [ 'ABC:product-1', 'DEF:product-2' ] );
			} );

			it( 'should set the payment option in state when a payment option is provided', () => {
				registry
					.dispatch( MODULES_READER_REVENUE_MANAGER )
					.selectPublication( {
						publicationId: 'publication-id',
						onboardingState: 'onboarding-state',
						paymentOptions: {
							contributions: null,
							subscriptions: true,
							noPayment: null,
							thankStickers: null,
						},
					} );

				expect(
					registry
						.select( MODULES_READER_REVENUE_MANAGER )
						.getPaymentOption()
				).toEqual( 'subscriptions' );
			} );

			it( 'should set the first true payment option when multiple options are provided', () => {
				const paymentOptions = {
					subscriptions: null,
					contributions: true,
					noPayment: true,
					thankStickers: null,
				};
				registry
					.dispatch( MODULES_READER_REVENUE_MANAGER )
					.selectPublication( {
						publicationId: 'publication-id',
						onboardingState: 'onboarding-state',
						paymentOptions,
					} );

				expect(
					registry
						.select( MODULES_READER_REVENUE_MANAGER )
						.getPaymentOption()
				).toEqual( 'contributions' );
			} );

			it( 'should default to an empty string when all payment options are null', () => {
				const paymentOptions = {
					subscriptions: null,
					contributions: null,
					noPayment: null,
					thankStickers: null,
				};

				registry
					.dispatch( MODULES_READER_REVENUE_MANAGER )
					.selectPublication( {
						publicationId: 'publication-id',
						onboardingState: 'onboarding-state',
						paymentOptions,
					} );

				expect(
					registry
						.select( MODULES_READER_REVENUE_MANAGER )
						.getPaymentOption()
				).toEqual( '' );
			} );

			it( 'should default to an empty string when the payment options object is empty', () => {
				const paymentOptions = {};

				registry
					.dispatch( MODULES_READER_REVENUE_MANAGER )
					.selectPublication( {
						publicationId: 'publication-id',
						onboardingState: 'onboarding-state',
						paymentOptions,
					} );

				expect(
					registry
						.select( MODULES_READER_REVENUE_MANAGER )
						.getPaymentOption()
				).toEqual( '' );
			} );

			it( 'should set productID to "openaccess" when different publication is selected', () => {
				const products = [
					{ name: 'ABC:product-1' },
					{ name: 'DEF:product-2' },
				];
				registry
					.dispatch( MODULES_READER_REVENUE_MANAGER )
					.selectPublication( {
						publicationId: 'publication-id',
						onboardingState: 'onboarding-state',
						products,
					} );

				expect(
					registry
						.select( MODULES_READER_REVENUE_MANAGER )
						.getProductID()
				).toEqual( 'openaccess' );
			} );

			it( 'should set `contentPolicyState` and `policyInfoLink` in state when `contentPolicyStatus` is provided', () => {
				const contentPolicyStatus = {
					contentPolicyState: 'CONTENT_POLICY_VIOLATION_ACTIVE',
					policyInfoLink: 'https://example.com/policy-info',
				};

				registry
					.dispatch( MODULES_READER_REVENUE_MANAGER )
					.selectPublication( {
						publicationId: 'publication-id',
						onboardingState: 'onboarding-state',
						contentPolicyStatus,
					} );

				expect(
					registry
						.select( MODULES_READER_REVENUE_MANAGER )
						.getSettings()
				).toMatchObject( {
					contentPolicyState: 'CONTENT_POLICY_VIOLATION_ACTIVE',
					policyInfoLink: 'https://example.com/policy-info',
				} );
			} );

			it( 'should not set `contentPolicyState` or `policyInfoLink` when `contentPolicyStatus` is not provided', () => {
				registry
					.dispatch( MODULES_READER_REVENUE_MANAGER )
					.selectPublication( {
						publicationId: 'publication-id',
						onboardingState: 'onboarding-state',
					} );

				const settings = registry
					.select( MODULES_READER_REVENUE_MANAGER )
					.getSettings();

				expect( settings ).not.toHaveProperty( 'contentPolicyState' );
				expect( settings ).not.toHaveProperty( 'policyInfoLink' );
			} );
		} );
	} );

	describe( 'fetchGetPublications settings synchronization', () => {
		beforeEach( () => {
			enabledFeatures.add( 'rrmExpressSetup' );

			const extraData = [
				{
					slug: MODULE_SLUG_READER_REVENUE_MANAGER,
					active: true,
					connected: true,
				},
			];
			provideModules( registry, extraData );
			provideModuleRegistrations( registry, extraData );
		} );

		it( 'should update settings in state when publications are fetched', async () => {
			const publication = {
				...fixtures.publications[ 0 ],
				organizationId: 'organization-1',
			};

			registry
				.dispatch( MODULES_READER_REVENUE_MANAGER )
				.receiveGetSettings( {
					publicationID: publication.publicationId,
					publicationOnboardingState:
						PUBLICATION_ONBOARDING_STATES.PENDING_VERIFICATION,
					productIDs: [],
					paymentOption: '',
				} );

			fetchMock.getOnce( publicationsEndpoint, {
				body: [ publication ],
				status: 200,
			} );

			registry.select( MODULES_READER_REVENUE_MANAGER ).getPublications();

			await untilResolved(
				registry,
				MODULES_READER_REVENUE_MANAGER
			).getPublications();

			const settings = registry
				.select( MODULES_READER_REVENUE_MANAGER )
				.getSettings();

			expect( settings.publicationOnboardingState ).toEqual(
				publication.onboardingState
			);
			expect( settings.productIDs ).toEqual( [ 'basic' ] );
			expect( settings.paymentOption ).toEqual( 'subscriptions' );
			expect( settings.organizationID ).toEqual(
				publication.organizationId
			);
			expect( settings.contentPolicyState ).toEqual(
				'CONTENT_POLICY_STATE_OK'
			);
			expect( settings.policyInfoLink ).toEqual(
				`https://publishercenter.google.com/reader-revenue-manager/settings/policy?publication=${ publication.publicationId }`
			);
		} );

		it( 'should update savedSettings in state when publications are fetched', async () => {
			const publication = fixtures.publications[ 0 ];

			registry
				.dispatch( MODULES_READER_REVENUE_MANAGER )
				.receiveGetSettings( {
					publicationID: publication.publicationId,
					publicationOnboardingState:
						PUBLICATION_ONBOARDING_STATES.PENDING_VERIFICATION,
					productIDs: [],
					paymentOption: '',
				} );

			fetchMock.getOnce( publicationsEndpoint, {
				body: fixtures.publications,
				status: 200,
			} );

			registry.select( MODULES_READER_REVENUE_MANAGER ).getPublications();

			await untilResolved(
				registry,
				MODULES_READER_REVENUE_MANAGER
			).getPublications();

			expect(
				registry
					.select( MODULES_READER_REVENUE_MANAGER )
					.haveSettingsChanged()
			).toBe( false );
		} );

		it( 'should not update settings when no matching publication exists', async () => {
			registry
				.dispatch( MODULES_READER_REVENUE_MANAGER )
				.receiveGetSettings( {
					publicationID: 'NON_EXISTENT',
					publicationOnboardingState:
						PUBLICATION_ONBOARDING_STATES.PENDING_VERIFICATION,
					productIDs: [],
					paymentOption: '',
				} );

			fetchMock.getOnce( publicationsEndpoint, {
				body: fixtures.publications,
				status: 200,
			} );

			registry.select( MODULES_READER_REVENUE_MANAGER ).getPublications();

			await untilResolved(
				registry,
				MODULES_READER_REVENUE_MANAGER
			).getPublications();

			const settings = registry
				.select( MODULES_READER_REVENUE_MANAGER )
				.getSettings();

			expect( settings.publicationOnboardingState ).toEqual(
				PUBLICATION_ONBOARDING_STATES.PENDING_VERIFICATION
			);
			expect( settings.productIDs ).toEqual( [] );
			expect( settings.paymentOption ).toEqual( '' );
		} );
	} );

	describe( 'fetchGetPublicationByID settings synchronization', () => {
		beforeEach( () => {
			enabledFeatures.add( 'rrmExpressSetup' );
		} );

		it( 'should update settings and savedSettings when a publication is fetched', async () => {
			const publication = {
				...fixtures.publications[ 0 ],
				organizationId: 'organization-1',
			};
			const params = {
				organizationID: publication.organizationId,
				publicationID: publication.publicationId,
			};

			registry
				.dispatch( MODULES_READER_REVENUE_MANAGER )
				.receiveGetSettings( {
					publicationID: publication.publicationId,
					publicationOnboardingState:
						PUBLICATION_ONBOARDING_STATES.PENDING_VERIFICATION,
					productIDs: [],
					paymentOption: '',
					organizationID: params.organizationID,
				} );

			fetchMock.getOnce( publicationEndpoint, {
				body: publication,
				status: 200,
			} );

			registry.select( MODULES_READER_REVENUE_MANAGER ).getPublication();

			await untilResolved(
				registry,
				MODULES_READER_REVENUE_MANAGER
			).getPublicationByID( params.organizationID, params.publicationID );

			const settings = registry
				.select( MODULES_READER_REVENUE_MANAGER )
				.getSettings();

			expect( settings ).toMatchObject( {
				publicationOnboardingState: publication.onboardingState,
				productIDs: [ 'basic' ],
				paymentOption: 'subscriptions',
				organizationID: publication.organizationId,
				contentPolicyState: 'CONTENT_POLICY_STATE_OK',
			} );
			expect(
				registry
					.select( MODULES_READER_REVENUE_MANAGER )
					.haveSettingsChanged()
			).toBe( false );
		} );
	} );

	describe( 'selectors', () => {
		describe( 'getPublicationParams', () => {
			const publication = fixtures.publications[ 0 ];

			const organizationID = publication.organizationId;
			const publicationID = publication.publicationId;

			it( 'should return the identifiers in the settings', () => {
				connectPublication( { organizationID, publicationID } );

				expect(
					registry
						.select( MODULES_READER_REVENUE_MANAGER )
						.getPublicationParams()
				).toEqual( { organizationID, publicationID } );
			} );

			it( 'should read the organization from the publications list when the settings have none', async () => {
				connectPublication( {
					organizationID: '',
					publicationID,
				} );

				fetchMock.getOnce( publicationsEndpoint, {
					body: [ publication ],
					status: 200,
				} );

				expect(
					registry
						.select( MODULES_READER_REVENUE_MANAGER )
						.getPublicationParams()
				).toBeUndefined();

				await untilResolved(
					registry,
					MODULES_READER_REVENUE_MANAGER
				).getPublications();

				expect(
					registry
						.select( MODULES_READER_REVENUE_MANAGER )
						.getPublicationParams()
				).toEqual( { organizationID, publicationID } );
			} );

			it( 'should return `null` when no publication is connected', () => {
				connectPublication( { publicationID: '' } );

				expect(
					registry
						.select( MODULES_READER_REVENUE_MANAGER )
						.getPublicationParams()
				).toBeNull();
			} );
		} );

		describe( 'getPublicationByID', () => {
			const publication = fixtures.publications[ 0 ];

			it( 'should return the publication stored under the given ID', () => {
				providePublication( registry, publication );

				expect(
					registry
						.select( MODULES_READER_REVENUE_MANAGER )
						.getPublicationByID(
							publication.organizationId,
							publication.publicationId
						)
				).toEqual( publication );
			} );

			it( 'should return `undefined` for a publication that is not loaded', async () => {
				providePublication( registry, publication );

				// Reading an unloaded publication requests it.
				muteFetch( publicationEndpoint );

				expect(
					registry
						.select( MODULES_READER_REVENUE_MANAGER )
						.getPublicationByID(
							'other-organization',
							'other-publication'
						)
				).toBeUndefined();

				await untilResolved(
					registry,
					MODULES_READER_REVENUE_MANAGER
				).getPublicationByID(
					'other-organization',
					'other-publication'
				);
			} );

			it( 'should keep a fetched publication out of the publications list', async () => {
				const otherPublication = {
					...publication,
					organizationId: 'other-organization',
					publicationId: 'other-publication',
				};

				registry
					.dispatch( MODULES_READER_REVENUE_MANAGER )
					.receiveGetPublications( fixtures.publications );

				fetchMock.getOnce( publicationEndpoint, {
					body: otherPublication,
					status: 200,
				} );

				registry
					.select( MODULES_READER_REVENUE_MANAGER )
					.getPublicationByID(
						otherPublication.organizationId,
						otherPublication.publicationId
					);

				await untilResolved(
					registry,
					MODULES_READER_REVENUE_MANAGER
				).getPublicationByID(
					otherPublication.organizationId,
					otherPublication.publicationId
				);

				expect(
					registry
						.select( MODULES_READER_REVENUE_MANAGER )
						.getPublicationByID(
							otherPublication.organizationId,
							otherPublication.publicationId
						)
				).toEqual( otherPublication );

				// The list only holds the publications it returned.
				expect(
					registry
						.select( MODULES_READER_REVENUE_MANAGER )
						.getPublications()
				).toEqual( fixtures.publications );
			} );
		} );

		describe( 'hasResolvedPublication', () => {
			const publication = fixtures.publications[ 0 ];

			it( 'should return `false` while the settings are loading', () => {
				freezeFetch( settingsEndpoint );

				expect(
					registry
						.select( MODULES_READER_REVENUE_MANAGER )
						.hasResolvedPublication()
				).toBe( false );
			} );

			it( 'should return `true` when no publication is connected', () => {
				connectPublication( { publicationID: '' } );

				expect(
					registry
						.select( MODULES_READER_REVENUE_MANAGER )
						.hasResolvedPublication()
				).toBe( true );
			} );

			it( 'should return `true` once the publication has resolved', () => {
				providePublication( registry, publication );

				expect(
					registry
						.select( MODULES_READER_REVENUE_MANAGER )
						.hasResolvedPublication()
				).toBe( true );
			} );
		} );

		beforeEach( () => {
			provideModules( registry );
			provideModuleRegistrations( registry );
		} );

		describe( 'getPublications', () => {
			it( 'should use a resolver to make a network request', async () => {
				fetchMock.get( publicationsEndpoint, {
					body: fixtures.publications,
					status: 200,
				} );

				fetchMock.get( getModulesEndpoint, {
					body: undefined,
					status: 200,
				} );

				const initialPublications = registry
					.select( MODULES_READER_REVENUE_MANAGER )
					.getPublications();
				expect( initialPublications ).toBeUndefined();

				await untilResolved(
					registry,
					MODULES_READER_REVENUE_MANAGER
				).getPublications();
				expect( fetchMock ).toHaveFetched( publicationsEndpoint );

				const publications = registry
					.select( MODULES_READER_REVENUE_MANAGER )
					.getPublications();
				expect( fetchMock ).toHaveFetchedTimes( 1 );
				expect( publications ).toEqual( fixtures.publications );
				expect( publications ).toHaveLength(
					fixtures.publications.length
				);
			} );

			it( 'should not make a network request if publications are already present', async () => {
				registry
					.dispatch( MODULES_READER_REVENUE_MANAGER )
					.receiveGetPublications( fixtures.publications );

				const publications = registry
					.select( MODULES_READER_REVENUE_MANAGER )
					.getPublications();
				await untilResolved(
					registry,
					MODULES_READER_REVENUE_MANAGER
				).getPublications();

				expect( fetchMock ).not.toHaveFetched( publicationsEndpoint );
				expect( publications ).toEqual( fixtures.publications );
				expect( publications ).toHaveLength(
					fixtures.publications.length
				);
			} );

			it( 'should dispatch an error if the request fails', async () => {
				const response = {
					code: 'internal_server_error',
					message: 'Internal server error',
					data: { status: 500 },
				};

				fetchMock.getOnce( publicationsEndpoint, {
					body: response,
					status: 500,
				} );

				registry
					.select( MODULES_READER_REVENUE_MANAGER )
					.getPublications();
				await untilResolved(
					registry,
					MODULES_READER_REVENUE_MANAGER
				).getPublications();
				expect( fetchMock ).toHaveFetchedTimes( 1 );

				const publications = registry
					.select( MODULES_READER_REVENUE_MANAGER )
					.getPublications();
				expect( publications ).toBeUndefined();
				expect( console ).toHaveErrored();
			} );
		} );

		describe( 'getPublication', () => {
			const params = {
				organizationID: 'organization-1',
				publicationID: 'publication-1',
			};

			it( 'should use a resolver to fetch a publication', async () => {
				const publication = {
					displayName: 'Example Publication',
					publicationId: params.publicationID,
				};
				fetchMock.getOnce( publicationEndpoint, {
					body: publication,
					status: 200,
				} );

				connectPublication( params );

				expect(
					registry
						.select( MODULES_READER_REVENUE_MANAGER )
						.getPublication()
				).toBeUndefined();

				await untilResolved(
					registry,
					MODULES_READER_REVENUE_MANAGER
				).getPublicationByID(
					params.organizationID,
					params.publicationID
				);

				expect(
					registry
						.select( MODULES_READER_REVENUE_MANAGER )
						.getPublication()
				).toEqual( publication );
				expect( fetchMock ).toHaveFetched( publicationEndpoint, {
					query: {
						...params,
						_locale: 'user',
					},
				} );
			} );

			it( 'should associate a publication fetch error with the request identifiers', async () => {
				const response = {
					code: 'internal_server_error',
					message: 'Internal server error',
					data: { status: 500 },
				};

				fetchMock.getOnce( publicationEndpoint, {
					body: response,
					status: 500,
				} );

				connectPublication( params );

				registry
					.select( MODULES_READER_REVENUE_MANAGER )
					.getPublication();

				await untilResolved(
					registry,
					MODULES_READER_REVENUE_MANAGER
				).getPublicationByID(
					params.organizationID,
					params.publicationID
				);

				const select = registry.select(
					MODULES_READER_REVENUE_MANAGER
				);

				expect(
					select.getErrorForSelector( 'getPublicationByID', [
						params.organizationID,
						params.publicationID,
					] )
				).toMatchObject( response );

				expect( console ).toHaveErrored();
			} );

			it( 'should resolve the settings before fetching a publication', async () => {
				const publication = {
					displayName: 'Example Publication',
					publicationId: params.publicationID,
				};
				fetchMock.getOnce( settingsEndpoint, {
					body: params,
					status: 200,
				} );
				fetchMock.getOnce( publicationEndpoint, {
					body: publication,
					status: 200,
				} );

				expect(
					registry
						.select( MODULES_READER_REVENUE_MANAGER )
						.getPublication()
				).toBeUndefined();

				// Reading the publication requests the settings, which name the
				// publication to request. A component re-reads once they
				// arrive; here that has to be done by hand.
				await untilResolved(
					registry,
					MODULES_READER_REVENUE_MANAGER
				).getSettings();

				registry
					.select( MODULES_READER_REVENUE_MANAGER )
					.getPublication();

				await untilResolved(
					registry,
					MODULES_READER_REVENUE_MANAGER
				).getPublicationByID(
					params.organizationID,
					params.publicationID
				);

				expect( fetchMock ).toHaveFetched( settingsEndpoint );
				expect( fetchMock ).toHaveFetched( publicationEndpoint, {
					query: {
						...params,
						_locale: 'user',
					},
				} );
				expect(
					registry
						.select( MODULES_READER_REVENUE_MANAGER )
						.getPublication()
				).toEqual( publication );
			} );

			it( 'should not fetch a publication when no publication ID is available', async () => {
				connectPublication( { publicationID: '' } );

				expect(
					registry
						.select( MODULES_READER_REVENUE_MANAGER )
						.getPublication()
				).toBeUndefined();

				await waitForDefaultTimeouts();

				expect( fetchMock ).not.toHaveFetched( publicationEndpoint );
				expect(
					registry
						.select( MODULES_READER_REVENUE_MANAGER )
						.getPublication()
				).toBeUndefined();
			} );

			describe( 'with the rrmExpressSetup feature flag enabled', () => {
				beforeEach( () => {
					registry = createTestRegistryWithFeatures( [
						'rrmExpressSetup',
					] );
					provideUserInfo( registry );
				} );

				describe( 'with legacy settings missing an organization ID', () => {
					const legacySettings = {
						publicationID: params.publicationID,
						organizationID: '',
					};

					it( 'should fetch publications before requesting the publication and not request it when it is then available', async () => {
						const publication = {
							...fixtures.publications[ 0 ],
							publicationId: params.publicationID,
						};
						fetchMock.getOnce( publicationsEndpoint, {
							body: [ publication ],
							status: 200,
						} );

						connectPublication( legacySettings );

						registry
							.select( MODULES_READER_REVENUE_MANAGER )
							.getPublication();

						await waitForDefaultTimeouts();

						expect( fetchMock ).toHaveFetchedTimes(
							1,
							publicationsEndpoint
						);
						expect( fetchMock ).not.toHaveFetched(
							publicationEndpoint
						);
						expect(
							registry
								.select( MODULES_READER_REVENUE_MANAGER )
								.getPublication()
						).toMatchObject( publication );
					} );

					it( 'should not request the publication when it is missing from the publications list', async () => {
						fetchMock.getOnce( publicationsEndpoint, {
							body: [],
							status: 200,
						} );

						connectPublication( legacySettings );

						registry
							.select( MODULES_READER_REVENUE_MANAGER )
							.getPublication();

						await waitForDefaultTimeouts();

						expect( fetchMock ).toHaveFetched(
							publicationsEndpoint
						);

						// The request is addressed by organization, so there
						// is nothing to ask for without one.
						expect( fetchMock ).not.toHaveFetched(
							publicationEndpoint
						);
					} );
				} );

				it( 'should request the publication without fetching publications when the organization ID is in settings', async () => {
					fetchMock.getOnce( publicationEndpoint, {
						body: { publicationId: params.publicationID },
						status: 200,
					} );

					connectPublication( params );

					registry
						.select( MODULES_READER_REVENUE_MANAGER )
						.getPublication();

					await untilResolved(
						registry,
						MODULES_READER_REVENUE_MANAGER
					).getPublicationByID(
						params.organizationID,
						params.publicationID
					);

					expect( fetchMock ).not.toHaveFetched(
						publicationsEndpoint
					);
					expect( fetchMock ).toHaveFetched( publicationEndpoint );
				} );
			} );

			it( 'should not fetch a publication already in state', async () => {
				const publication = {
					publicationId: params.publicationID,
				};
				connectPublication( params );

				registry
					.dispatch( MODULES_READER_REVENUE_MANAGER )
					.receiveGetPublicationByID( publication, params );

				registry
					.select( MODULES_READER_REVENUE_MANAGER )
					.getPublication();

				await untilResolved(
					registry,
					MODULES_READER_REVENUE_MANAGER
				).getPublicationByID(
					params.organizationID,
					params.publicationID
				);

				expect( fetchMock ).not.toHaveFetched( publicationEndpoint );
			} );
		} );

		describe( 'getCurrentProductIDs', () => {
			it( 'should return `undefined` if publications are not loaded', async () => {
				muteFetch( publicationsEndpoint );

				const productIDs = registry
					.select( MODULES_READER_REVENUE_MANAGER )
					.getCurrentProductIDs();
				expect( productIDs ).toBeUndefined();

				await untilResolved(
					registry,
					MODULES_READER_REVENUE_MANAGER
				).getPublications();
			} );

			it( 'should return empty array if no publications are not available', () => {
				registry
					.dispatch( MODULES_READER_REVENUE_MANAGER )
					.setSettings( {
						publicationID: '',
						publicationOnboardingState: '',
					} );

				registry
					.dispatch( MODULES_READER_REVENUE_MANAGER )
					.receiveGetPublications( [] );

				const productIDs = registry
					.select( MODULES_READER_REVENUE_MANAGER )
					.getCurrentProductIDs();
				expect( productIDs ).toEqual( [] );
			} );

			it( 'should return products for the current publication', () => {
				const publications = cloneDeep( fixtures.publications );
				publications[ 0 ].products = [
					{ name: 'ABC:product-1' },
					{ name: 'DEF:product-2' },
					{ name: 'GHI:product-3' },
				];
				publications[ 1 ].products = [
					{ name: 'JKL:product-4' },
					{ name: 'MNO:product-5' },
				];

				registry
					.dispatch( MODULES_READER_REVENUE_MANAGER )
					.setSettings( {
						publicationID: publications[ 0 ].publicationId,
						publicationOnboardingState: 'onboarding-state',
					} );

				registry
					.dispatch( MODULES_READER_REVENUE_MANAGER )
					.receiveGetPublications( publications );

				const productIDs = registry
					.select( MODULES_READER_REVENUE_MANAGER )
					.getCurrentProductIDs();
				expect( productIDs ).toEqual( [
					'ABC:product-1',
					'DEF:product-2',
					'GHI:product-3',
				] );
			} );
		} );

		describe( 'getContentPolicyState', () => {
			it( 'should return `undefined` if settings are not loaded', () => {
				muteFetch( settingsEndpoint );

				const contentPolicyState = registry
					.select( MODULES_READER_REVENUE_MANAGER )
					.getContentPolicyState();

				expect( contentPolicyState ).toBeUndefined();
			} );

			it( 'should return `undefined` if `contentPolicyState` is not in settings', () => {
				registry
					.dispatch( MODULES_READER_REVENUE_MANAGER )
					.receiveGetSettings( {
						publicationID: 'publication-id',
						publicationOnboardingState: 'onboarding-state',
					} );

				const contentPolicyState = registry
					.select( MODULES_READER_REVENUE_MANAGER )
					.getContentPolicyState();

				expect( contentPolicyState ).toBeUndefined();
			} );

			it( 'should return the `contentPolicyState` setting value', () => {
				registry
					.dispatch( MODULES_READER_REVENUE_MANAGER )
					.receiveGetSettings( {
						publicationID: 'publication-id',
						publicationOnboardingState: 'onboarding-state',
						contentPolicyState: 'CONTENT_POLICY_VIOLATION_ACTIVE',
					} );

				const contentPolicyState = registry
					.select( MODULES_READER_REVENUE_MANAGER )
					.getContentPolicyState();

				expect( contentPolicyState ).toBe(
					'CONTENT_POLICY_VIOLATION_ACTIVE'
				);
			} );
		} );

		describe( 'getPolicyInfoURL', () => {
			it( 'should return `undefined` if settings are not loaded', () => {
				muteFetch( settingsEndpoint );

				const policyInfoURL = registry
					.select( MODULES_READER_REVENUE_MANAGER )
					.getPolicyInfoURL();

				expect( policyInfoURL ).toBeUndefined();
			} );

			it( 'should return `undefined` if `policyInfoLink` is not in settings', () => {
				registry
					.dispatch( MODULES_READER_REVENUE_MANAGER )
					.receiveGetSettings( {
						publicationID: 'publication-id',
						publicationOnboardingState: 'onboarding-state',
					} );

				const policyInfoURL = registry
					.select( MODULES_READER_REVENUE_MANAGER )
					.getPolicyInfoURL();

				expect( policyInfoURL ).toBeUndefined();
			} );

			it( 'should return `null` if `policyInfoLink` is empty', () => {
				registry
					.dispatch( MODULES_READER_REVENUE_MANAGER )
					.receiveGetSettings( {
						publicationID: 'publication-id',
						publicationOnboardingState: 'onboarding-state',
						policyInfoLink: '',
					} );

				const policyInfoURL = registry
					.select( MODULES_READER_REVENUE_MANAGER )
					.getPolicyInfoURL();

				expect( policyInfoURL ).toBeNull();
			} );

			it( 'should return the `policyInfoLink` setting wrapped with account chooser URL', () => {
				const testEmail = 'test@example.com';
				const testPolicyInfoLink = 'https://example.com/policy-info';

				registry.dispatch( CORE_USER ).receiveUserInfo( {
					email: testEmail,
				} );

				registry
					.dispatch( MODULES_READER_REVENUE_MANAGER )
					.receiveGetSettings( {
						publicationID: 'publication-id',
						publicationOnboardingState: 'onboarding-state',
						policyInfoLink: testPolicyInfoLink,
					} );

				const policyInfoURL = registry
					.select( MODULES_READER_REVENUE_MANAGER )
					.getPolicyInfoURL();

				// Verify the URL is wrapped with the account chooser.
				expect( policyInfoURL ).toContain( 'accountchooser' );
				expect( policyInfoURL ).toContain(
					encodeURIComponent( testPolicyInfoLink )
				);
				expect( policyInfoURL ).toContain(
					encodeURIComponent( testEmail )
				);

				expect( policyInfoURL ).toBe(
					registry
						.select( CORE_USER )
						.getAccountChooserURL( testPolicyInfoLink )
				);
			} );
		} );
	} );
} );
