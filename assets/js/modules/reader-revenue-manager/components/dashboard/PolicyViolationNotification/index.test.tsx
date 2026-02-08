/**
 * PolicyViolationNotification component tests.
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
	createTestRegistry,
	provideModules,
	provideSiteInfo,
	provideUserAuthentication,
	provideUserInfo,
	render,
} from '../../../../../../../tests/js/test-utils';
import { CORE_USER } from '@/js/googlesitekit/datastore/user/constants';
import { VIEW_CONTEXT_MAIN_DASHBOARD } from '@/js/googlesitekit/constants';
import {
	RRM_POLICY_VIOLATION_MODERATE_HIGH_NOTIFICATION_ID,
	RRM_POLICY_VIOLATION_EXTREME_NOTIFICATION_ID,
	MODULE_SLUG_READER_REVENUE_MANAGER,
} from '@/js/modules/reader-revenue-manager/constants';
import {
	MODULES_READER_REVENUE_MANAGER,
	CONTENT_POLICY_STATES,
	PUBLICATION_ONBOARDING_STATES,
} from '@/js/modules/reader-revenue-manager/datastore/constants';
import { NOTIFICATIONS } from '@/js/modules/reader-revenue-manager';
import { withNotificationComponentProps } from '@/js/googlesitekit/notifications/util/component-props';
import PolicyViolationNotification from './';

const {
	CONTENT_POLICY_STATE_OK,
	CONTENT_POLICY_VIOLATION_GRACE_PERIOD,
	CONTENT_POLICY_ORGANIZATION_VIOLATION_GRACE_PERIOD,
	CONTENT_POLICY_VIOLATION_ACTIVE,
	CONTENT_POLICY_ORGANIZATION_VIOLATION_ACTIVE,
	CONTENT_POLICY_ORGANIZATION_VIOLATION_ACTIVE_IMMEDIATE,
} = CONTENT_POLICY_STATES;

const POLICY_INFO_URL = 'https://example.com/policy-info';

interface NotificationWithCheckRequirements {
	checkRequirements: (
		registry: ReturnType< typeof createTestRegistry >
	) => Promise< boolean >;
}

describe( 'PolicyViolationNotification', () => {
	let registry: ReturnType< typeof createTestRegistry >;

	const moderateHighNotification = NOTIFICATIONS[
		RRM_POLICY_VIOLATION_MODERATE_HIGH_NOTIFICATION_ID
	] as NotificationWithCheckRequirements;

	const extremeNotification = NOTIFICATIONS[
		RRM_POLICY_VIOLATION_EXTREME_NOTIFICATION_ID
	] as NotificationWithCheckRequirements;

	const ModerateHighNotificationWithComponentProps =
		withNotificationComponentProps(
			RRM_POLICY_VIOLATION_MODERATE_HIGH_NOTIFICATION_ID
		)( PolicyViolationNotification );

	const ExtremeNotificationWithComponentProps =
		withNotificationComponentProps(
			RRM_POLICY_VIOLATION_EXTREME_NOTIFICATION_ID
		)( PolicyViolationNotification );

	function setupRegistry(
		contentPolicyState = CONTENT_POLICY_VIOLATION_GRACE_PERIOD
	) {
		registry
			.dispatch( MODULES_READER_REVENUE_MANAGER )
			.receiveGetSettings( {
				publicationOnboardingState:
					PUBLICATION_ONBOARDING_STATES.ONBOARDING_COMPLETE,
				contentPolicyStatus: {
					contentPolicyState,
					policyInfoLink:
						contentPolicyState === CONTENT_POLICY_STATE_OK
							? null
							: POLICY_INFO_URL,
				},
			} );
	}

	beforeEach( () => {
		registry = createTestRegistry();

		provideSiteInfo( registry );
		provideUserInfo( registry );
		provideUserAuthentication( registry );
		provideModules( registry, [
			{
				slug: MODULE_SLUG_READER_REVENUE_MANAGER,
				active: true,
				connected: true,
			},
		] );

		registry.dispatch( CORE_USER ).receiveGetDismissedItems( [] );
	} );

	it( 'should render warning notification for pending grace period violation', () => {
		setupRegistry( CONTENT_POLICY_VIOLATION_GRACE_PERIOD );

		const { container, getByText, getByRole } = render(
			<ModerateHighNotificationWithComponentProps />,
			{
				registry,
				viewContext: VIEW_CONTEXT_MAIN_DASHBOARD,
			}
		);

		expect(
			getByText(
				'Action needed: fix a policy issue with Reader Revenue Manager'
			)
		).toBeInTheDocument();

		expect(
			getByText(
				'Your site has content that breaks the rules for Reader Revenue Manager. To keep your account active and CTAs public, you must resolve all policy violations.'
			)
		).toBeInTheDocument();

		expect(
			getByRole( 'button', { name: /View violations/ } )
		).toBeInTheDocument();

		expect( container ).toMatchSnapshot();
	} );

	it( 'should render warning notification for organization pending grace period violation', () => {
		setupRegistry( CONTENT_POLICY_ORGANIZATION_VIOLATION_GRACE_PERIOD );

		const { getByText, getByRole } = render(
			<ModerateHighNotificationWithComponentProps />,
			{
				registry,
				viewContext: VIEW_CONTEXT_MAIN_DASHBOARD,
			}
		);

		expect(
			getByText(
				'Action needed: fix a policy issue with Reader Revenue Manager'
			)
		).toBeInTheDocument();

		expect(
			getByRole( 'button', { name: /View violations/ } )
		).toBeInTheDocument();
	} );

	it( 'should render warning notification for active violation', () => {
		setupRegistry( CONTENT_POLICY_VIOLATION_ACTIVE );

		const { getByText, getByRole } = render(
			<ModerateHighNotificationWithComponentProps />,
			{
				registry,
				viewContext: VIEW_CONTEXT_MAIN_DASHBOARD,
			}
		);

		expect(
			getByText(
				'Action needed: Your Reader Revenue Manager account is restricted'
			)
		).toBeInTheDocument();

		expect(
			getByText(
				'Your site has content that doesn’t follow the rules. To see more details and resolve the violation, please visit Publisher Center.'
			)
		).toBeInTheDocument();

		expect(
			getByRole( 'button', { name: /View violations/ } )
		).toBeInTheDocument();
	} );

	it( 'should render warning notification for organization active violation', () => {
		setupRegistry( CONTENT_POLICY_ORGANIZATION_VIOLATION_ACTIVE );

		const { getByText, getByRole } = render(
			<ModerateHighNotificationWithComponentProps />,
			{
				registry,
				viewContext: VIEW_CONTEXT_MAIN_DASHBOARD,
			}
		);

		expect(
			getByText(
				'Action needed: Your Reader Revenue Manager account is restricted'
			)
		).toBeInTheDocument();

		expect(
			getByRole( 'button', { name: /View violations/ } )
		).toBeInTheDocument();
	} );

	it( 'should render error notification for immediate organization violation', () => {
		setupRegistry( CONTENT_POLICY_ORGANIZATION_VIOLATION_ACTIVE_IMMEDIATE );

		const { container, getByText, getByRole } = render(
			<ExtremeNotificationWithComponentProps />,
			{
				registry,
				viewContext: VIEW_CONTEXT_MAIN_DASHBOARD,
			}
		);

		expect(
			getByText(
				'Action needed: Your Reader Revenue Manager account is terminated'
			)
		).toBeInTheDocument();

		expect(
			getByText(
				'Your account is terminated because your site content doesn’t follow the rules. Visit Publisher Center for more information.'
			)
		).toBeInTheDocument();

		// Extreme severity should show "Learn more" instead of "View violations".
		expect(
			getByRole( 'button', { name: /Learn more/ } )
		).toBeInTheDocument();

		expect( container ).toMatchSnapshot();
	} );

	it.each( [
		CONTENT_POLICY_VIOLATION_GRACE_PERIOD,
		CONTENT_POLICY_ORGANIZATION_VIOLATION_GRACE_PERIOD,
		CONTENT_POLICY_VIOLATION_ACTIVE,
		CONTENT_POLICY_ORGANIZATION_VIOLATION_ACTIVE,
	] )(
		'moderateHighNotification.checkRequirements should return true for content policy state %s',
		async ( contentPolicyState ) => {
			setupRegistry( contentPolicyState );

			const isActive = await moderateHighNotification.checkRequirements(
				registry
			);

			expect( isActive ).toBe( true );
		}
	);

	it.each( [
		CONTENT_POLICY_STATE_OK,
		CONTENT_POLICY_ORGANIZATION_VIOLATION_ACTIVE_IMMEDIATE,
	] )(
		'moderateHighNotification.checkRequirements should return false for content policy state %s',
		async ( contentPolicyState ) => {
			setupRegistry( contentPolicyState );

			const isActive = await moderateHighNotification.checkRequirements(
				registry
			);

			expect( isActive ).toBe( false );
		}
	);

	it( 'moderateHighNotification.checkRequirements should return false when RRM is not connected', async () => {
		provideModules( registry, [
			{
				slug: MODULE_SLUG_READER_REVENUE_MANAGER,
				active: false,
				connected: false,
			},
		] );

		const isActive = await moderateHighNotification.checkRequirements(
			registry
		);

		expect( isActive ).toBe( false );
	} );

	it( 'extremeNotification.checkRequirements should return true for `CONTENT_POLICY_ORGANIZATION_VIOLATION_ACTIVE_IMMEDIATE`', async () => {
		setupRegistry( CONTENT_POLICY_ORGANIZATION_VIOLATION_ACTIVE_IMMEDIATE );

		const isActive = await extremeNotification.checkRequirements(
			registry
		);

		expect( isActive ).toBe( true );
	} );

	it.each( [ CONTENT_POLICY_STATE_OK, CONTENT_POLICY_VIOLATION_ACTIVE ] )(
		'extremeNotification.checkRequirements should return false for content policy state %s',
		async ( contentPolicyState ) => {
			setupRegistry( contentPolicyState );

			const isActive = await extremeNotification.checkRequirements(
				registry
			);

			expect( isActive ).toBe( false );
		}
	);

	it( 'extremeNotification.checkRequirements should return false when RRM is not connected', async () => {
		provideModules( registry, [
			{
				slug: MODULE_SLUG_READER_REVENUE_MANAGER,
				active: false,
				connected: false,
			},
		] );

		const isActive = await extremeNotification.checkRequirements(
			registry
		);

		expect( isActive ).toBe( false );
	} );
} );
