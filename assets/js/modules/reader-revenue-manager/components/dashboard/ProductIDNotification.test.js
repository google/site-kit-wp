/**
 * ProductIDNotification component tests.
 *
 * Site Kit by Google, Copyright 2025 Google LLC
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

/**
 * Internal dependencies
 */
import {
	createTestRegistry,
	provideModules,
	render,
} from '../../../../../../tests/js/test-utils';
import { CORE_USER } from '../../../../googlesitekit/datastore/user/constants';
import { VIEW_CONTEXT_MAIN_DASHBOARD } from '../../../../googlesitekit/constants';
import { RRM_PRODUCT_ID_NOTIFICATION_ID } from '../../constants';
import {
	MODULES_READER_REVENUE_MANAGER,
	PUBLICATION_ONBOARDING_STATES,
} from '../../datastore/constants';
import { NOTIFICATIONS } from '../..';
import { withNotificationComponentProps } from '../../../../googlesitekit/notifications/util/component-props';
import ProductIDNotification from './ProductIDNotification';

describe( 'ProductIDNotification', () => {
	let registry;

	const notification = NOTIFICATIONS[ RRM_PRODUCT_ID_NOTIFICATION_ID ];

	const ProductIDNotificationComponent = withNotificationComponentProps(
		RRM_PRODUCT_ID_NOTIFICATION_ID
	)( ProductIDNotification );

	beforeEach( () => {
		registry = createTestRegistry();

		provideModules( registry, [
			{
				slug: 'reader-revenue-manager',
				active: true,
				connected: true,
			},
		] );

		registry.dispatch( CORE_USER ).receiveGetDismissedItems( [] );
	} );

	afterEach( () => {
		jest.clearAllMocks();
	} );

	it( 'should render correctly when payment option is `contributions`', () => {
		registry
			.dispatch( MODULES_READER_REVENUE_MANAGER )
			.receiveGetSettings( {
				paymentOption: 'contributions',
				productIDs: [],
				productID: null, // TODO: Check what to do about the default value of 'openaccess'.
				publicationOnboardingState:
					PUBLICATION_ONBOARDING_STATES.ONBOARDING_COMPLETE,
			} );

		const { container, getByText } = render(
			<ProductIDNotificationComponent />,
			{
				registry,
				viewContext: VIEW_CONTEXT_MAIN_DASHBOARD,
			}
		);

		expect(
			getByText(
				'New! You can now select product IDs to use with your Reader Revenue Manager snippet'
			)
		).toBeInTheDocument();

		expect( container ).toMatchSnapshot();
	} );

	it( 'should render correctly when payment option is `subscriptions`', () => {
		registry
			.dispatch( MODULES_READER_REVENUE_MANAGER )
			.receiveGetSettings( {
				paymentOption: 'subscriptions',
				productIDs: [],
				productID: null, // TODO: Check what to do about the default value of 'openaccess'.
				publicationOnboardingState:
					PUBLICATION_ONBOARDING_STATES.ONBOARDING_COMPLETE,
			} );

		const { container, getByText } = render(
			<ProductIDNotificationComponent />,
			{
				registry,
				viewContext: VIEW_CONTEXT_MAIN_DASHBOARD,
			}
		);

		expect(
			getByText(
				'To complete your Reader Revenue Manager paywall setup, add your product IDs in settings'
			)
		).toBeInTheDocument();

		expect( container ).toMatchSnapshot();
	} );

	describe( 'checkRequirements', () => {
		it( 'is active when all required conditions are met', async () => {
			registry
				.dispatch( MODULES_READER_REVENUE_MANAGER )
				.receiveGetSettings( {
					paymentOption: 'subscriptions',
					productIDs: [ '123', '456' ],
					productID: null, // TODO: Check what to do about the default value of 'openaccess'.
					publicationOnboardingState:
						PUBLICATION_ONBOARDING_STATES.ONBOARDING_COMPLETE,
				} );

			const isActive = await notification.checkRequirements(
				registry,
				VIEW_CONTEXT_MAIN_DASHBOARD
			);

			expect( isActive ).toBe( true );
		} );
	} );

	it.each( [
		[
			'publicationOnboardingState is not ONBOARDING_COMPLETE',
			{
				paymentOption: 'contributions',
				productIDs: [ '123', '456' ],
				productID: null,
				publicationOnboardingState:
					PUBLICATION_ONBOARDING_STATES.ONBOARDING_ACTION_REQUIRED,
			},
		],
		[
			'productIDs is empty',
			{
				paymentOption: 'contributions',
				productIDs: [],
				productID: null,
				publicationOnboardingState:
					PUBLICATION_ONBOARDING_STATES.ONBOARDING_COMPLETE,
			},
		],
		[
			'productID is not null',
			{
				paymentOption: 'contributions',
				productIDs: [ '123', '456' ],
				productID: '123',
				publicationOnboardingState:
					PUBLICATION_ONBOARDING_STATES.ONBOARDING_COMPLETE,
			},
		],
		[
			'paymentOption is not `contributions` or `subscriptions`',
			{
				paymentOption: 'openaccess',
				productIDs: [ '123', '456' ],
				productID: null,
				publicationOnboardingState:
					PUBLICATION_ONBOARDING_STATES.ONBOARDING_COMPLETE,
			},
		],
	] )( 'should not be active when %s', async ( _, settings ) => {
		registry
			.dispatch( MODULES_READER_REVENUE_MANAGER )
			.receiveGetSettings( settings );

		const isActive = await notification.checkRequirements(
			registry,
			VIEW_CONTEXT_MAIN_DASHBOARD
		);

		expect( isActive ).toBe( false );
	} );
} );
