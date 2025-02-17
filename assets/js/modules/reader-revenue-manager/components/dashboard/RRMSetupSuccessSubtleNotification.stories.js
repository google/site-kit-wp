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
 * Internal dependencies
 */
import { withQuery } from '@storybook/addon-queryparams';
import {
	provideModuleRegistrations,
	provideModules,
	WithTestRegistry,
} from '../../../../../../tests/js/utils';
import RRMSetupSuccessSubtleNotification from './RRMSetupSuccessSubtleNotification';
import {
	MODULES_READER_REVENUE_MANAGER,
	PUBLICATION_ONBOARDING_STATES,
	READER_REVENUE_MANAGER_MODULE_SLUG,
} from '../../datastore/constants';
import { withNotificationComponentProps } from '../../../../googlesitekit/notifications/util/component-props';

const NotificationWithComponentProps = withNotificationComponentProps(
	'setup-success-notification-rrm'
)( RRMSetupSuccessSubtleNotification );

function Template() {
	return <NotificationWithComponentProps />;
}

export const OnboardingComplete = Template.bind( {} );
OnboardingComplete.storyName = 'Onboarding Complete';
OnboardingComplete.parameters = {
	query: {
		notification: 'authentication_success',
		slug: READER_REVENUE_MANAGER_MODULE_SLUG,
	},
	publicationOnboardingState:
		PUBLICATION_ONBOARDING_STATES.ONBOARDING_COMPLETE,
};
OnboardingComplete.scenario = {};

export const PendingVerification = Template.bind( {} );
PendingVerification.storyName = 'Pending Verification';
PendingVerification.parameters = {
	query: {
		notification: 'authentication_success',
		slug: READER_REVENUE_MANAGER_MODULE_SLUG,
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
		slug: READER_REVENUE_MANAGER_MODULE_SLUG,
	},
	publicationOnboardingState:
		PUBLICATION_ONBOARDING_STATES.ONBOARDING_ACTION_REQUIRED,
};
OnboardingActionRequired.scenario = {};

export const WithSubscriptionsAndProductID = Template.bind( {} );
WithSubscriptionsAndProductID.storyName = 'With Subscriptions and Product ID';
WithSubscriptionsAndProductID.parameters = {
	query: {
		notification: 'authentication_success',
		slug: READER_REVENUE_MANAGER_MODULE_SLUG,
	},
	publicationOnboardingState:
		PUBLICATION_ONBOARDING_STATES.ONBOARDING_COMPLETE,
};
WithSubscriptionsAndProductID.args = {
	features: [ 'rrmModuleV2' ],
	setupRegistry: ( registry ) => {
		registry
			.dispatch( MODULES_READER_REVENUE_MANAGER )
			.setPaymentOption( 'subscriptions' );
		registry
			.dispatch( MODULES_READER_REVENUE_MANAGER )
			.setProductID( 'product-1' );
	},
};
WithSubscriptionsAndProductID.scenario = {};

export const WithContributionsAndProductID = Template.bind( {} );
WithContributionsAndProductID.storyName = 'With Contributions and Product ID';
WithContributionsAndProductID.parameters = {
	query: {
		notification: 'authentication_success',
		slug: READER_REVENUE_MANAGER_MODULE_SLUG,
	},
	publicationOnboardingState:
		PUBLICATION_ONBOARDING_STATES.ONBOARDING_COMPLETE,
};
WithContributionsAndProductID.args = {
	features: [ 'rrmModuleV2' ],
	setupRegistry: ( registry ) => {
		registry
			.dispatch( MODULES_READER_REVENUE_MANAGER )
			.setPaymentOption( 'contributions' );
		registry
			.dispatch( MODULES_READER_REVENUE_MANAGER )
			.setProductID( 'product-1' );
	},
};
WithContributionsAndProductID.scenario = {};

export const WithContributionsAndNoProductID = Template.bind( {} );
WithContributionsAndNoProductID.storyName =
	'With Contributions and No Product ID';
WithContributionsAndNoProductID.parameters = {
	query: {
		notification: 'authentication_success',
		slug: READER_REVENUE_MANAGER_MODULE_SLUG,
	},
	publicationOnboardingState:
		PUBLICATION_ONBOARDING_STATES.ONBOARDING_COMPLETE,
};
WithContributionsAndNoProductID.args = {
	features: [ 'rrmModuleV2' ],
	setupRegistry: ( registry ) => {
		registry
			.dispatch( MODULES_READER_REVENUE_MANAGER )
			.setPaymentOption( 'contributions' );
	},
};
WithContributionsAndNoProductID.scenario = {};

export const WithNoPaymentOption = Template.bind( {} );
WithNoPaymentOption.storyName = 'With No Payment Option';
WithNoPaymentOption.parameters = {
	query: {
		notification: 'authentication_success',
		slug: READER_REVENUE_MANAGER_MODULE_SLUG,
	},
	publicationOnboardingState:
		PUBLICATION_ONBOARDING_STATES.ONBOARDING_COMPLETE,
};
WithNoPaymentOption.args = {
	features: [ 'rrmModuleV2' ],
	setupRegistry: ( registry ) => {
		registry
			.dispatch( MODULES_READER_REVENUE_MANAGER )
			.setPaymentOption( 'noPayment' );
	},
};
WithNoPaymentOption.scenario = {};

export default {
	title: 'Modules/ReaderRevenueManager/Components/Dashboard/RRMSetupSuccessSubtleNotification',
	component: RRMSetupSuccessSubtleNotification,
	decorators: [
		withQuery,
		( Story, { args, parameters } ) => {
			const setupRegistry = ( registry ) => {
				provideModules( registry, [
					{
						slug: READER_REVENUE_MANAGER_MODULE_SLUG,
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
					} );

				args?.setupRegistry?.( registry );
			};

			return (
				<WithTestRegistry
					callback={ setupRegistry }
					features={ args?.features || [] }
				>
					<Story />
				</WithTestRegistry>
			);
		},
	],
};
