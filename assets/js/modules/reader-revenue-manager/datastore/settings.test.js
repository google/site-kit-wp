/**
 * `modules/reader-revenue-manager` data store: settings tests.
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
 * Internal dependencies
 */
import { setUsingCache } from 'googlesitekit-api';
import { enabledFeatures } from '@/js/features';
import { createTestRegistry } from '@tests/js/utils';
import { MODULES_READER_REVENUE_MANAGER } from './constants';
import {
	INVARIANT_INVALID_CONFIGURED_CTAS,
	INVARIANT_INVALID_CONTENT_POLICY_STATE,
	INVARIANT_INVALID_ORGANIZATION_ID,
	INVARIANT_INVALID_PAYMENT_OPTION,
	INVARIANT_INVALID_POLICY_INFO_LINK,
	INVARIANT_INVALID_POST_TYPES,
	INVARIANT_INVALID_PRODUCT_ID,
	INVARIANT_INVALID_PRODUCT_IDS,
	INVARIANT_INVALID_PUBLICATION_ID,
	INVARIANT_INVALID_PUBLICATION_ONBOARDING_STATE,
	INVARIANT_INVALID_SNIPPET_MODE,
	validateCanSubmitChanges,
} from './settings';

describe( 'modules/reader-revenue-manager settings', () => {
	let registry;

	const settingsEndpoint = new RegExp(
		'^/google-site-kit/v1/modules/reader-revenue-manager/data/settings'
	);

	const validSettings = {
		publicationID: 'ABCDEFGH',
		publicationOnboardingState: 'ONBOARDING_ACTION_REQUIRED',
		publicationOnboardingStateChanged: false,
		contentPolicyState: '',
		policyInfoLink: '',
		snippetMode: 'post_types',
		postTypes: [ 'post' ],
		productID: 'valid-id',
		productIDs: [ 'valid' ],
		paymentOption: 'valid-option',
	};

	const validExpressSetupSettings = {
		...validSettings,
		organizationID: 'ABCD1234',
		configuredCTAs: {
			'cta-id': 'newsletter-signup',
		},
	};

	beforeAll( () => {
		setUsingCache( false );
	} );

	afterAll( () => {
		setUsingCache( true );
	} );

	beforeEach( () => {
		registry = createTestRegistry();
	} );

	describe( 'validateCanSubmitChanges', () => {
		it( 'should throw invariant error for invalid publication ID of type number', () => {
			const settings = {
				...validSettings,
				publicationID: 12345,
			};

			registry
				.dispatch( MODULES_READER_REVENUE_MANAGER )
				.setSettings( settings );

			expect( () => validateCanSubmitChanges( registry.select ) ).toThrow(
				INVARIANT_INVALID_PUBLICATION_ID
			);
		} );

		it( 'should throw invariant error for invalid publication ID with special chars', () => {
			const settings = {
				...validSettings,
				publicationID: 'ABCD&*12345',
			};

			registry
				.dispatch( MODULES_READER_REVENUE_MANAGER )
				.setSettings( settings );

			expect( () => validateCanSubmitChanges( registry.select ) ).toThrow(
				INVARIANT_INVALID_PUBLICATION_ID
			);
		} );

		it( 'should throw invariant error for invalid publication onboarding state', () => {
			const settings = {
				...validSettings,
				publicationOnboardingState: 'invalid_state',
			};

			registry
				.dispatch( MODULES_READER_REVENUE_MANAGER )
				.setSettings( settings );

			expect( () => validateCanSubmitChanges( registry.select ) ).toThrow(
				INVARIANT_INVALID_PUBLICATION_ONBOARDING_STATE
			);
		} );

		it( 'should throw invariant error for invalid snippet mode', () => {
			const settings = {
				...validSettings,
				snippetMode: 'invalid-mode',
			};

			registry
				.dispatch( MODULES_READER_REVENUE_MANAGER )
				.setSettings( settings );

			expect( () => validateCanSubmitChanges( registry.select ) ).toThrow(
				INVARIANT_INVALID_SNIPPET_MODE
			);
		} );

		it( 'should throw invariant error for invalid post types', () => {
			const settings = {
				...validSettings,
				postTypes: 'not-an-array',
			};

			registry
				.dispatch( MODULES_READER_REVENUE_MANAGER )
				.setSettings( settings );

			expect( () => validateCanSubmitChanges( registry.select ) ).toThrow(
				INVARIANT_INVALID_POST_TYPES
			);
		} );

		it( 'should throw invariant error for post types with non-string elements', () => {
			const settings = {
				...validSettings,
				postTypes: [ 'post', 123, true ],
			};

			registry
				.dispatch( MODULES_READER_REVENUE_MANAGER )
				.setSettings( settings );

			expect( () => validateCanSubmitChanges( registry.select ) ).toThrow(
				INVARIANT_INVALID_POST_TYPES
			);
		} );

		it( 'should throw invariant error if at least 1 post type is not selected', () => {
			const settings = {
				...validSettings,
				postTypes: [],
			};

			registry
				.dispatch( MODULES_READER_REVENUE_MANAGER )
				.setSettings( settings );

			expect( () => validateCanSubmitChanges( registry.select ) ).toThrow(
				INVARIANT_INVALID_POST_TYPES
			);
		} );

		it( 'should not throw invariant error if no post types are selected and the snippet mode is different', () => {
			const settings = {
				...validSettings,
				postTypes: [],
				snippetMode: 'per_post',
			};

			registry
				.dispatch( MODULES_READER_REVENUE_MANAGER )
				.setSettings( settings );

			expect( () =>
				validateCanSubmitChanges( registry.select )
			).not.toThrow( INVARIANT_INVALID_POST_TYPES );
		} );

		it( 'should throw invariant error for invalid product ID', () => {
			const settings = {
				...validSettings,
				productID: [ 'not-a-string' ],
			};

			registry
				.dispatch( MODULES_READER_REVENUE_MANAGER )
				.setSettings( settings );

			expect( () => validateCanSubmitChanges( registry.select ) ).toThrow(
				INVARIANT_INVALID_PRODUCT_ID
			);
		} );

		it( 'should throw invariant error for invalid product IDs', () => {
			const settings = {
				...validSettings,
				productIDs: 'not-an-array',
			};

			registry
				.dispatch( MODULES_READER_REVENUE_MANAGER )
				.setSettings( settings );

			expect( () => validateCanSubmitChanges( registry.select ) ).toThrow(
				INVARIANT_INVALID_PRODUCT_IDS
			);
		} );

		it( 'should throw invariant error for product IDs with non-string elements', () => {
			const settings = {
				...validSettings,
				productIDs: [ 'valid', 123, true ],
			};

			registry
				.dispatch( MODULES_READER_REVENUE_MANAGER )
				.setSettings( settings );

			expect( () => validateCanSubmitChanges( registry.select ) ).toThrow(
				INVARIANT_INVALID_PRODUCT_IDS
			);
		} );

		it( 'should throw invariant error for invalid payment option', () => {
			const settings = {
				...validSettings,
				paymentOption: [ 'not-a-string' ],
			};

			registry
				.dispatch( MODULES_READER_REVENUE_MANAGER )
				.setSettings( settings );

			expect( () => validateCanSubmitChanges( registry.select ) ).toThrow(
				INVARIANT_INVALID_PAYMENT_OPTION
			);
		} );

		it( 'should throw invariant error for invalid content policy state', () => {
			const settings = {
				...validSettings,
				contentPolicyState: 123,
			};

			registry
				.dispatch( MODULES_READER_REVENUE_MANAGER )
				.setSettings( settings );

			expect( () => validateCanSubmitChanges( registry.select ) ).toThrow(
				INVARIANT_INVALID_CONTENT_POLICY_STATE
			);
		} );

		it( 'should throw invariant error for invalid policy info link', () => {
			const settings = {
				...validSettings,
				contentPolicyState: '',
				policyInfoLink: 123,
			};

			registry
				.dispatch( MODULES_READER_REVENUE_MANAGER )
				.setSettings( settings );

			expect( () => validateCanSubmitChanges( registry.select ) ).toThrow(
				INVARIANT_INVALID_POLICY_INFO_LINK
			);
		} );

		it( 'should throw invariant error for an invalid organization ID', () => {
			enabledFeatures.add( 'rrmExpressSetup' );

			registry.dispatch( MODULES_READER_REVENUE_MANAGER ).setSettings( {
				...validExpressSetupSettings,
				organizationID: 123,
			} );

			expect( () => validateCanSubmitChanges( registry.select ) ).toThrow(
				INVARIANT_INVALID_ORGANIZATION_ID
			);
		} );

		it.each( [
			[ 'not-an-object', 'not-an-object' ],
			[ 'an array', [] ],
			[ 'a non-string CTA type', { 'cta-id': 123 } ],
		] )(
			'should throw invariant error when configured CTAs is %s',
			( _, configuredCTAs ) => {
				enabledFeatures.add( 'rrmExpressSetup' );

				registry
					.dispatch( MODULES_READER_REVENUE_MANAGER )
					.setSettings( {
						...validExpressSetupSettings,
						configuredCTAs,
					} );

				expect( () =>
					validateCanSubmitChanges( registry.select )
				).toThrow( INVARIANT_INVALID_CONFIGURED_CTAS );
			}
		);

		it( 'should not throw invariant errors for valid express setup settings', () => {
			enabledFeatures.add( 'rrmExpressSetup' );

			registry
				.dispatch( MODULES_READER_REVENUE_MANAGER )
				.setSettings( validExpressSetupSettings );

			expect( () =>
				validateCanSubmitChanges( registry.select )
			).not.toThrow();
		} );
	} );

	describe( 'submitChanges', () => {
		it( 'should dispatch saveSettings', async () => {
			registry
				.dispatch( MODULES_READER_REVENUE_MANAGER )
				.setSettings( validSettings );

			fetchMock.postOnce( settingsEndpoint, {
				body: validSettings,
				status: 200,
			} );

			await registry
				.dispatch( MODULES_READER_REVENUE_MANAGER )
				.submitChanges();

			expect( fetchMock ).toHaveFetched( settingsEndpoint, {
				body: { data: validSettings },
			} );

			expect(
				registry
					.select( MODULES_READER_REVENUE_MANAGER )
					.haveSettingsChanged()
			).toBe( false );
		} );

		it( 'should save the organization ID when the `rrmExpressSetup` feature flag is enabled', async () => {
			enabledFeatures.add( 'rrmExpressSetup' );

			registry
				.dispatch( MODULES_READER_REVENUE_MANAGER )
				.setSettings( validExpressSetupSettings );

			fetchMock.postOnce( settingsEndpoint, {
				body: validExpressSetupSettings,
				status: 200,
			} );

			await registry
				.dispatch( MODULES_READER_REVENUE_MANAGER )
				.submitChanges();

			expect( fetchMock ).toHaveFetched( settingsEndpoint, {
				body: { data: validExpressSetupSettings },
			} );
		} );

		it( 'should save selected post types', async () => {
			fetchMock.post( settingsEndpoint, {
				body: {
					...validSettings,
					snippetMode: 'post_types',
					postTypes: [ 'post', 'page' ],
				},
				status: 200,
			} );

			registry.dispatch( MODULES_READER_REVENUE_MANAGER ).setSettings( {
				...validSettings,
				snippetMode: 'post_types',
				postTypes: [ 'post', 'page' ],
			} );

			await registry
				.dispatch( MODULES_READER_REVENUE_MANAGER )
				.submitChanges();

			expect(
				registry.select( MODULES_READER_REVENUE_MANAGER ).getPostTypes()
			).toEqual( [ 'post', 'page' ] );
		} );

		it( 'should not save selected post types for a different snippet mode', async () => {
			registry
				.dispatch( MODULES_READER_REVENUE_MANAGER )
				.receiveGetSettings( {
					...validSettings,
					snippetMode: 'post_types',
					postTypes: [ 'post', 'page' ],
				} );

			fetchMock.post( settingsEndpoint, ( url, { body } ) => {
				const { data } = JSON.parse( body );

				return { body: data };
			} );

			registry.dispatch( MODULES_READER_REVENUE_MANAGER ).setSettings( {
				snippetMode: 'per_post',
				postTypes: [ 'page' ],
			} );

			await registry
				.dispatch( MODULES_READER_REVENUE_MANAGER )
				.submitChanges();

			expect(
				registry.select( MODULES_READER_REVENUE_MANAGER ).getPostTypes()
			).toEqual( [ 'post', 'page' ] );

			// Verify that the snippet mode is saved as expected.
			expect(
				registry
					.select( MODULES_READER_REVENUE_MANAGER )
					.getSnippetMode()
			).toEqual( 'per_post' );
		} );
	} );
} );
