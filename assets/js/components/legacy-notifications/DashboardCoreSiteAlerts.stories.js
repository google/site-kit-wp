/**
 * DashboardCoreSiteAlerts Component Stories.
 *
 * Site Kit by Google, Copyright 2021 Google LLC
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
import WithRegistrySetup from '../../../../tests/js/WithRegistrySetup';
import DashboardCoreSiteAlerts from './DashboardCoreSiteAlerts';
import { CORE_SITE } from '../../googlesitekit/datastore/site/constants';
import { CORE_USER } from '../../googlesitekit/datastore/user/constants';

const Template = ( { setupRegistry } ) => (
	<WithRegistrySetup func={ setupRegistry }>
		<DashboardCoreSiteAlerts />
	</WithRegistrySetup>
);

const notification1 = {
	id: 'test-notification',
	title: 'test-title',
	content: 'test-content',
	ctaURL: 'test-cta-url',
	ctaLabel: 'test-cta-label',
	ctaTarget: 'test-cta-target',
	learnMoreURL: 'test-learn-more-url',
	learnMoreLabel: 'test-learn-more-label',
	dismissible: true,
	dismissLabel: 'test-dismiss-label',
};

export const NotificationCTA = Template.bind( {} );
NotificationCTA.storyName = 'Has Notifications - Displayed';
NotificationCTA.args = {
	setupRegistry: ( registry ) => {
		registry.dispatch( CORE_SITE ).receiveGetNotifications( [ notification1 ], {} );
	},
};

export const NoNotifications = Template.bind( {} );
NoNotifications.storyName = 'Has No Notifications - Not Displayed';
NoNotifications.args = {
	setupRegistry: ( registry ) => {
		registry.dispatch( CORE_SITE ).receiveGetNotifications( [], {} );
	},
};

export const NotificationCTAWithSurvey = Template.bind( {} );
NotificationCTAWithSurvey.storyName = 'Has Notifications, and Survey - Not Displayed';
NotificationCTAWithSurvey.args = {
	setupRegistry: ( registry ) => {
		registry.dispatch( CORE_SITE ).receiveGetNotifications( [ notification1 ], {} );
		registry.dispatch( CORE_USER ).receiveTriggerSurvey( { survey_payload: { ab2: true }, session: {} }, { triggerID: 'storybook' } );
	},
};

export const NotificationCTAWithSurveyShortDelay = Template.bind( {} );
NotificationCTAWithSurveyShortDelay.storyName = 'Has Notifications, with Survey in three seconds - Not Displayed';
NotificationCTAWithSurveyShortDelay.args = {
	setupRegistry: ( registry ) => {
		registry.dispatch( CORE_SITE ).receiveGetNotifications( [ notification1 ], {} );
		setTimeout( () => {
			// Remote triggered survey arrives after three seconds, so the notification WILL NOT be displayed.
			registry.dispatch( CORE_USER ).receiveTriggerSurvey( { survey_payload: { ab2: true }, session: {} }, { triggerID: 'storybook' } );
		}, 3 * 1000 );
	},
};

export const NotificationCTAWithSurveyLongerDelay = Template.bind( {} );
NotificationCTAWithSurveyLongerDelay.storyName = 'Has Notifications, with Survey in six seconds - Displayed';
NotificationCTAWithSurveyLongerDelay.args = {
	setupRegistry: ( registry ) => {
		registry.dispatch( CORE_SITE ).receiveGetNotifications( [ notification1 ], {} );
		setTimeout( () => {
			// Remote triggered survey arrives after six seconds, so the notification WILL be displayed.
			registry.dispatch( CORE_USER ).receiveTriggerSurvey( { survey_payload: { ab2: true }, session: {} }, { triggerID: 'storybook' } );
		}, 6 * 1000 );
	},
};

export default {
	title: 'Components/DashboardCoreSiteAlerts',
	decorators: [
		( Story ) => (
			<div className="googlesitekit-widget">
				<div className="googlesitekit-widget__body">
					<Story />
				</div>
			</div>
		),
		( Story, { args } ) => {
			const setupRegistry = ( registry ) => {
				// Call story-specific setup.
				args.setupRegistry( registry );
			};

			return (
				<WithRegistrySetup func={ setupRegistry }>
					<Story />
				</WithRegistrySetup>
			);
		},
	],
};
