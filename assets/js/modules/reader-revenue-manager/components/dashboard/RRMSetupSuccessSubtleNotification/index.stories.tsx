/**
 * RRMSetupSuccessSubtleNotification Component Stories.
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
import { ElementType, ReactNode } from 'react';

/**
 * Internal dependencies
 */
import { withQuery } from '@storybook/addon-queryparams';
import {
	provideModuleRegistrations,
	provideModules,
} from '../../../../../../../tests/js/utils';
import WithRegistrySetup from '../../../../../../../tests/js/WithRegistrySetup';
import RRMSetupSuccessSubtleNotification from '.';
import {
	MODULES_READER_REVENUE_MANAGER,
	PUBLICATION_ONBOARDING_STATES,
	CONTENT_POLICY_STATES,
} from '@/js/modules/reader-revenue-manager/datastore/constants';
import { MODULE_SLUG_READER_REVENUE_MANAGER } from '@/js/modules/reader-revenue-manager/constants';
import { withNotificationComponentProps } from '@/js/googlesitekit/notifications/util/component-props';

// eslint-disable-next-line @typescript-eslint/no-explicit-any -- `@wordpress/data` is not typed yet.
type Registry = any;

type Decorator = {
	(
		Story: ElementType,
		// eslint-disable-next-line @typescript-eslint/no-explicit-any -- `@storybook/react` is not typed yet.
		{ args, parameters }: { args: any; parameters: any }
	): ReactNode;
};

const NotificationWithComponentProps = withNotificationComponentProps(
	'setup-success-notification-rrm'
)( RRMSetupSuccessSubtleNotification );

function Template() {
	return <NotificationWithComponentProps />;
}

export const PendingVerification = Template.bind( {} );
PendingVerification.storyName = 'Pending Verification';
PendingVerification.parameters = {
	query: {
		notification: 'authentication_success',
		slug: MODULE_SLUG_READER_REVENUE_MANAGER,
	},
	publicationOnboardingState:
		PUBLICATION_ONBOARDING_STATES.PENDING_VERIFICATION,
};
PendingVerification.scenario = {};

export const OnboardingActionRequired = Template.bind( {} );
OnboardingActionRequired.storyName = 'Onboarding Action Required';
OnboardingActionRequired.parameters = {
	query: {
		notification: 'authentication_success',
		slug: MODULE_SLUG_READER_REVENUE_MANAGER,
	},
	publicationOnboardingState:
		PUBLICATION_ONBOARDING_STATES.ONBOARDING_ACTION_REQUIRED,
};
OnboardingActionRequired.scenario = {};

export const OnboardingCompleteWithSubscriptionAndProductID = Template.bind(
	{}
);
OnboardingCompleteWithSubscriptionAndProductID.storyName =
	'Onboarding Complete - With Subscription and Product ID';
OnboardingCompleteWithSubscriptionAndProductID.parameters = {
	query: {
		notification: 'authentication_success',
		slug: MODULE_SLUG_READER_REVENUE_MANAGER,
	},
	publicationOnboardingState:
		PUBLICATION_ONBOARDING_STATES.ONBOARDING_COMPLETE,
};
OnboardingCompleteWithSubscriptionAndProductID.args = {
	setupRegistry: ( registry: Registry ) => {
		registry
			.dispatch( MODULES_READER_REVENUE_MANAGER )
			.setPaymentOption( 'subscriptions' );
		registry
			.dispatch( MODULES_READER_REVENUE_MANAGER )
			.setProductID( 'product-1' );
	},
};
OnboardingCompleteWithSubscriptionAndProductID.scenario = {};

export const OnboardingCompleteWithSubscriptionAndNoProductID = Template.bind(
	{}
);
OnboardingCompleteWithSubscriptionAndNoProductID.storyName =
	'Onboarding Complete - With Subscription and No Product ID';
OnboardingCompleteWithSubscriptionAndNoProductID.parameters = {
	query: {
		notification: 'authentication_success',
		slug: MODULE_SLUG_READER_REVENUE_MANAGER,
	},
	publicationOnboardingState:
		PUBLICATION_ONBOARDING_STATES.ONBOARDING_COMPLETE,
};
OnboardingCompleteWithSubscriptionAndNoProductID.args = {
	setupRegistry: ( registry: Registry ) => {
		registry
			.dispatch( MODULES_READER_REVENUE_MANAGER )
			.setPaymentOption( 'subscriptions' );
		registry
			.dispatch( MODULES_READER_REVENUE_MANAGER )
			.setProductID( 'openaccess' );
	},
};
OnboardingCompleteWithSubscriptionAndNoProductID.scenario = {};

export const OnboardingCompleteWithContributionAndProductID = Template.bind(
	{}
);
OnboardingCompleteWithContributionAndProductID.storyName =
	'Onboarding Complete - With Contribution and Product ID';
OnboardingCompleteWithContributionAndProductID.parameters = {
	query: {
		notification: 'authentication_success',
		slug: MODULE_SLUG_READER_REVENUE_MANAGER,
	},
	publicationOnboardingState:
		PUBLICATION_ONBOARDING_STATES.ONBOARDING_COMPLETE,
};
OnboardingCompleteWithContributionAndProductID.args = {
	setupRegistry: ( registry: Registry ) => {
		registry
			.dispatch( MODULES_READER_REVENUE_MANAGER )
			.setPaymentOption( 'contributions' );
		registry
			.dispatch( MODULES_READER_REVENUE_MANAGER )
			.setProductID( 'product-1' );
	},
};
OnboardingCompleteWithContributionAndProductID.scenario = {};

export const OnboardingCompleteWithContributionAndNoProductID = Template.bind(
	{}
);
OnboardingCompleteWithContributionAndNoProductID.storyName =
	'Onboarding Complete - With Contribution and No Product ID';
OnboardingCompleteWithContributionAndNoProductID.parameters = {
	query: {
		notification: 'authentication_success',
		slug: MODULE_SLUG_READER_REVENUE_MANAGER,
	},
	publicationOnboardingState:
		PUBLICATION_ONBOARDING_STATES.ONBOARDING_COMPLETE,
};
OnboardingCompleteWithContributionAndNoProductID.args = {
	setupRegistry: ( registry: Registry ) => {
		registry
			.dispatch( MODULES_READER_REVENUE_MANAGER )
			.setPaymentOption( 'contributions' );
		registry
			.dispatch( MODULES_READER_REVENUE_MANAGER )
			.setProductID( 'openaccess' );
	},
};
OnboardingCompleteWithContributionAndNoProductID.scenario = {};

export const OnboardingCompleteWithNoMonetization = Template.bind( {} );
OnboardingCompleteWithNoMonetization.storyName =
	'Onboarding Complete - With No Monetization';
OnboardingCompleteWithNoMonetization.parameters = {
	query: {
		notification: 'authentication_success',
		slug: MODULE_SLUG_READER_REVENUE_MANAGER,
	},
	publicationOnboardingState:
		PUBLICATION_ONBOARDING_STATES.ONBOARDING_COMPLETE,
};
OnboardingCompleteWithNoMonetization.args = {
	setupRegistry: ( registry: Registry ) => {
		registry
			.dispatch( MODULES_READER_REVENUE_MANAGER )
			.setPaymentOption( 'noPayment' );
	},
};
OnboardingCompleteWithNoMonetization.scenario = {};

export const PolicyViolationPending = Template.bind( {} );
PolicyViolationPending.storyName = 'Policy Violation - Pending';
PolicyViolationPending.parameters = {
	query: {
		notification: 'authentication_success',
		slug: MODULE_SLUG_READER_REVENUE_MANAGER,
	},
	publicationOnboardingState:
		PUBLICATION_ONBOARDING_STATES.PENDING_VERIFICATION,
	contentPolicyState:
		CONTENT_POLICY_STATES.CONTENT_POLICY_VIOLATION_GRACE_PERIOD,
};
PolicyViolationPending.scenario = {};

export const PolicyViolationActive = Template.bind( {} );
PolicyViolationActive.storyName = 'Policy Violation - Active';
PolicyViolationActive.parameters = {
	query: {
		notification: 'authentication_success',
		slug: MODULE_SLUG_READER_REVENUE_MANAGER,
	},
	publicationOnboardingState:
		PUBLICATION_ONBOARDING_STATES.PENDING_VERIFICATION,
	contentPolicyState: CONTENT_POLICY_STATES.CONTENT_POLICY_VIOLATION_ACTIVE,
};
PolicyViolationActive.scenario = {};

export default {
	title: 'Modules/ReaderRevenueManager/Components/Dashboard/RRMSetupSuccessSubtleNotification',
	component: RRMSetupSuccessSubtleNotification,
	decorators: [
		withQuery,
		( ( Story, { args, parameters } ) => {
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
							parameters.publicationOnboardingState,
						productIDs: [ 'product-a', 'product-b' ],
						contentPolicyStatus: parameters.contentPolicyState
							? {
									contentPolicyState:
										parameters.contentPolicyState,
									policyInfoLink:
										'https://example.com/policy-info',
							  }
							: undefined,
					} );

				args?.setupRegistry?.( registry );
			}

			return (
				<WithRegistrySetup func={ setupRegistry }>
					<Story />
				</WithRegistrySetup>
			);
		} ) as Decorator,
	],
};
