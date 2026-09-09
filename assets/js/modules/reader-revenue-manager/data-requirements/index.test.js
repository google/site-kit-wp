/**
 * Reader Revenue Manager module data requirements tests.
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
 * Internal dependencies
 */
import {
	CONTENT_POLICY_STATES,
	MODULES_READER_REVENUE_MANAGER,
	POLICY_VIOLATION_STATES,
	PUBLICATION_ONBOARDING_STATES,
} from '@/js/modules/reader-revenue-manager/datastore/constants';
import { createTestRegistry } from '@tests/js/test-utils';
import {
	requireContentPolicyState,
	requirePaymentOption,
	requireProductID,
	requireProductIDs,
	requirePublicationOnboardingState,
} from './index';

describe( 'Reader Revenue Manager data requirements', () => {
	let registry;

	beforeEach( () => {
		registry = createTestRegistry();
	} );

	describe( 'requirePublicationOnboardingState', () => {
		it( 'should return true when the onboarding state matches', async () => {
			registry
				.dispatch( MODULES_READER_REVENUE_MANAGER )
				.receiveGetSettings( {
					publicationOnboardingState:
						PUBLICATION_ONBOARDING_STATES.ONBOARDING_COMPLETE,
				} );

			expect(
				await requirePublicationOnboardingState(
					PUBLICATION_ONBOARDING_STATES.ONBOARDING_COMPLETE
				)( registry )
			).toBe( true );
		} );

		it( 'should return false when the onboarding state does not match', async () => {
			registry
				.dispatch( MODULES_READER_REVENUE_MANAGER )
				.receiveGetSettings( {
					publicationOnboardingState:
						PUBLICATION_ONBOARDING_STATES.PENDING_VERIFICATION,
				} );

			expect(
				await requirePublicationOnboardingState(
					PUBLICATION_ONBOARDING_STATES.ONBOARDING_COMPLETE
				)( registry )
			).toBe( false );
		} );

		it( 'should return true when matching against an undefined onboarding state', async () => {
			registry
				.dispatch( MODULES_READER_REVENUE_MANAGER )
				.receiveGetSettings( {} );

			expect(
				await requirePublicationOnboardingState( undefined )( registry )
			).toBe( true );
		} );
	} );
	describe( 'requirePaymentOption', () => {
		it( 'should return true when the payment option matches', async () => {
			registry
				.dispatch( MODULES_READER_REVENUE_MANAGER )
				.receiveGetSettings( { paymentOption: 'subscriptions' } );

			expect(
				await requirePaymentOption( 'subscriptions' )( registry )
			).toBe( true );
		} );

		it( 'should return false when the payment option does not match', async () => {
			registry
				.dispatch( MODULES_READER_REVENUE_MANAGER )
				.receiveGetSettings( { paymentOption: 'contributions' } );

			expect(
				await requirePaymentOption( 'subscriptions' )( registry )
			).toBe( false );
		} );

		it( 'should return true when matching against an empty payment option', async () => {
			registry
				.dispatch( MODULES_READER_REVENUE_MANAGER )
				.receiveGetSettings( { paymentOption: '' } );

			expect( await requirePaymentOption( '' )( registry ) ).toBe( true );
		} );
	} );
	describe( 'requireProductIDs', () => {
		it( 'should return true when the publication has at least one product ID', async () => {
			registry
				.dispatch( MODULES_READER_REVENUE_MANAGER )
				.receiveGetSettings( { productIDs: [ 'basic' ] } );

			expect( await requireProductIDs()( registry ) ).toBe( true );
		} );

		it( 'should return false when the publication has no product IDs', async () => {
			registry
				.dispatch( MODULES_READER_REVENUE_MANAGER )
				.receiveGetSettings( { productIDs: [] } );

			expect( await requireProductIDs()( registry ) ).toBe( false );
		} );

		it( 'should return false when the product IDs are not available', async () => {
			registry
				.dispatch( MODULES_READER_REVENUE_MANAGER )
				.receiveGetSettings( {} );

			expect( await requireProductIDs()( registry ) ).toBe( false );
		} );
	} );
	describe( 'requireProductID', () => {
		it( 'should return true when the product ID matches', async () => {
			registry
				.dispatch( MODULES_READER_REVENUE_MANAGER )
				.receiveGetSettings( { productID: 'openaccess' } );

			expect( await requireProductID( 'openaccess' )( registry ) ).toBe(
				true
			);
		} );

		it( 'should return false when the product ID does not match', async () => {
			registry
				.dispatch( MODULES_READER_REVENUE_MANAGER )
				.receiveGetSettings( { productID: 'basic' } );

			expect( await requireProductID( 'openaccess' )( registry ) ).toBe(
				false
			);
		} );
	} );
	describe( 'requireContentPolicyState', () => {
		it( 'should return true when the content policy state is one of the given states', async () => {
			registry
				.dispatch( MODULES_READER_REVENUE_MANAGER )
				.receiveGetSettings( {
					contentPolicyState:
						CONTENT_POLICY_STATES.CONTENT_POLICY_VIOLATION_ACTIVE,
				} );

			expect(
				await requireContentPolicyState( POLICY_VIOLATION_STATES )(
					registry
				)
			).toBe( true );
		} );

		it( 'should return false when the content policy state is not one of the given states', async () => {
			registry
				.dispatch( MODULES_READER_REVENUE_MANAGER )
				.receiveGetSettings( {
					contentPolicyState:
						CONTENT_POLICY_STATES.CONTENT_POLICY_STATE_OK,
				} );

			expect(
				await requireContentPolicyState( POLICY_VIOLATION_STATES )(
					registry
				)
			).toBe( false );
		} );

		it( 'should return false when the content policy state is not available', async () => {
			registry
				.dispatch( MODULES_READER_REVENUE_MANAGER )
				.receiveGetSettings( {} );

			expect(
				await requireContentPolicyState( POLICY_VIOLATION_STATES )(
					registry
				)
			).toBe( false );
		} );
	} );
} );
