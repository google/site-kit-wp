/**
 * ProductIDContributionsNotification component tests.
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
	provideSiteInfo,
	render,
} from '../../../../../../tests/js/test-utils';
import { CORE_USER } from '../../../../googlesitekit/datastore/user/constants';
import { VIEW_CONTEXT_MAIN_DASHBOARD } from '../../../../googlesitekit/constants';
import {
	RRM_PRODUCT_ID_CONTRIBUTIONS_NOTIFICATION_ID,
	MODULE_SLUG_READER_REVENUE_MANAGER,
} from '../../constants';
import {
	MODULES_READER_REVENUE_MANAGER,
	PUBLICATION_ONBOARDING_STATES,
} from '../../datastore/constants';
import { NOTIFICATIONS } from '../..';
import { withNotificationComponentProps } from '../../../../googlesitekit/notifications/util/component-props';
import ProductIDContributionsNotification from './ProductIDContributionsNotification';

describe( 'ProductIDContributionsNotification', () => {
	let registry;

	const notification =
		NOTIFICATIONS[ RRM_PRODUCT_ID_CONTRIBUTIONS_NOTIFICATION_ID ];

	const NotificationWithComponentProps = withNotificationComponentProps(
		RRM_PRODUCT_ID_CONTRIBUTIONS_NOTIFICATION_ID
	)( ProductIDContributionsNotification );

	beforeEach( () => {
		registry = createTestRegistry();

		provideSiteInfo( registry );
		provideModules( registry, [
			{
				slug: MODULE_SLUG_READER_REVENUE_MANAGER,
				active: true,
				connected: true,
			},
		] );

		registry.dispatch( CORE_USER ).receiveGetDismissedItems( [] );
	} );

	afterEach( () => {
		jest.clearAllMocks();
	} );

	it( 'should render correctly', () => {
		registry
			.dispatch( MODULES_READER_REVENUE_MANAGER )
			.receiveGetSettings( {
				paymentOption: 'contributions',
				productIDs: [],
				productID: 'openaccess',
				publicationOnboardingState:
					PUBLICATION_ONBOARDING_STATES.ONBOARDING_COMPLETE,
			} );

		const { container, getByText } = render(
			<NotificationWithComponentProps />,
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

	describe( 'checkRequirements', () => {
		it( 'is active when all required conditions are met', async () => {
			registry
				.dispatch( MODULES_READER_REVENUE_MANAGER )
				.receiveGetSettings( {
					paymentOption: 'contributions',
					productIDs: [ '123', '456' ],
					productID: 'openaccess',
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
				productID: 'openaccess',
				publicationOnboardingState:
					PUBLICATION_ONBOARDING_STATES.ONBOARDING_ACTION_REQUIRED,
			},
		],
		[
			'productIDs is empty',
			{
				paymentOption: 'contributions',
				productIDs: [],
				productID: 'openaccess',
				publicationOnboardingState:
					PUBLICATION_ONBOARDING_STATES.ONBOARDING_COMPLETE,
			},
		],
		[
			'productID is not `openaccess`',
			{
				paymentOption: 'contributions',
				productIDs: [ '123', '456' ],
				productID: '123',
				publicationOnboardingState:
					PUBLICATION_ONBOARDING_STATES.ONBOARDING_COMPLETE,
			},
		],
		[
			'paymentOption is not `contributions`',
			{
				paymentOption: 'subscriptions',
				productIDs: [ '123', '456' ],
				productID: 'openaccess',
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
