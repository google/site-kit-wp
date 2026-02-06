/**
 * PolicyViolationNotification Component Stories.
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
import { ElementType, ReactNode } from 'react';

/**
 * Internal dependencies
 */
import {
	createTestRegistry,
	provideModuleRegistrations,
	provideModules,
} from '../../../../../../../tests/js/utils';
import WithRegistrySetup from '../../../../../../../tests/js/WithRegistrySetup';
import {
	MODULES_READER_REVENUE_MANAGER,
	CONTENT_POLICY_STATES,
	PUBLICATION_ONBOARDING_STATES,
} from '@/js/modules/reader-revenue-manager/datastore/constants';
import {
	RRM_POLICY_VIOLATION_MODERATE_HIGH_NOTIFICATION_ID,
	RRM_POLICY_VIOLATION_EXTREME_NOTIFICATION_ID,
	MODULE_SLUG_READER_REVENUE_MANAGER,
} from '@/js/modules/reader-revenue-manager/constants';
import { withNotificationComponentProps } from '@/js/googlesitekit/notifications/util/component-props';
import PolicyViolationNotification from './';

const {
	CONTENT_POLICY_VIOLATION_GRACE_PERIOD,
	CONTENT_POLICY_ORGANIZATION_VIOLATION_GRACE_PERIOD,
	CONTENT_POLICY_VIOLATION_ACTIVE,
	CONTENT_POLICY_ORGANIZATION_VIOLATION_ACTIVE,
	CONTENT_POLICY_ORGANIZATION_VIOLATION_ACTIVE_IMMEDIATE,
} = CONTENT_POLICY_STATES;

const POLICY_INFO_URL = 'https://publishercenter.google.com/policy';

type Registry = ReturnType< typeof createTestRegistry >;

type Decorator = {
	(
		Story: ElementType,
		// eslint-disable-next-line @typescript-eslint/no-explicit-any -- `@storybook/react` is not typed yet.
		{ parameters }: { parameters: any }
	): ReactNode;
};

const ModerateHighNotificationWithComponentProps =
	withNotificationComponentProps(
		RRM_POLICY_VIOLATION_MODERATE_HIGH_NOTIFICATION_ID
	)( PolicyViolationNotification );

const ExtremeNotificationWithComponentProps = withNotificationComponentProps(
	RRM_POLICY_VIOLATION_EXTREME_NOTIFICATION_ID
)( PolicyViolationNotification );

function Template() {
	return <ModerateHighNotificationWithComponentProps />;
}

function ExtremeTemplate() {
	return <ExtremeNotificationWithComponentProps />;
}

export const PendingGracePeriodViolation = Template.bind( {} );
PendingGracePeriodViolation.storyName = 'Pending Grace Period Violation';
PendingGracePeriodViolation.parameters = {
	contentPolicyState: CONTENT_POLICY_VIOLATION_GRACE_PERIOD,
};
PendingGracePeriodViolation.scenario = {};

export const OrganizationPendingGracePeriodViolation = Template.bind( {} );
OrganizationPendingGracePeriodViolation.storyName =
	'Organization Pending Grace Period Violation';
OrganizationPendingGracePeriodViolation.parameters = {
	contentPolicyState: CONTENT_POLICY_ORGANIZATION_VIOLATION_GRACE_PERIOD,
};
OrganizationPendingGracePeriodViolation.scenario = {};

export const ActiveViolation = Template.bind( {} );
ActiveViolation.storyName = 'Active Violation';
ActiveViolation.parameters = {
	contentPolicyState: CONTENT_POLICY_VIOLATION_ACTIVE,
};
ActiveViolation.scenario = {};

export const OrganizationActiveViolation = Template.bind( {} );
OrganizationActiveViolation.storyName = 'Organization Active Violation';
OrganizationActiveViolation.parameters = {
	contentPolicyState: CONTENT_POLICY_ORGANIZATION_VIOLATION_ACTIVE,
};
OrganizationActiveViolation.scenario = {};

export const ExtremeViolation = ExtremeTemplate.bind( {} );
ExtremeViolation.storyName = 'Extreme Violation (Terminated)';
ExtremeViolation.parameters = {
	contentPolicyState: CONTENT_POLICY_ORGANIZATION_VIOLATION_ACTIVE_IMMEDIATE,
};
ExtremeViolation.scenario = {};

export default {
	title: 'Modules/ReaderRevenueManager/Components/Dashboard/PolicyViolationNotification',
	component: PolicyViolationNotification,
	decorators: [
		( ( Story, { parameters } ) => {
			function setupRegistry( registry: Registry ) {
				provideModules( registry, [
					{
						slug: MODULE_SLUG_READER_REVENUE_MANAGER,
						active: true,
						connected: true,
					},
				] );

				provideModuleRegistrations( registry );

				registry
					.dispatch( MODULES_READER_REVENUE_MANAGER )
					.receiveGetSettings( {
						publicationID: '1234',
						publicationOnboardingState:
							PUBLICATION_ONBOARDING_STATES.ONBOARDING_COMPLETE,
						contentPolicyStatus: {
							contentPolicyState: parameters.contentPolicyState,
							policyInfoLink: POLICY_INFO_URL,
						},
					} );
			}

			return (
				<WithRegistrySetup func={ setupRegistry }>
					<Story />
				</WithRegistrySetup>
			);
		} ) as Decorator,
	],
};
