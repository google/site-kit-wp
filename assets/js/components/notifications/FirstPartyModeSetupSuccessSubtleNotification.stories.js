/**
 * AudienceSegmentationSetupSuccessSubtleNotification Component Stories.
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
import { provideModules } from '../../../../tests/js/utils';
import WithRegistrySetup from '../../../../tests/js/WithRegistrySetup';
import { CORE_SITE } from '../../googlesitekit/datastore/site/constants';
import { withNotificationComponentProps } from '../../googlesitekit/notifications/util/component-props';
import FirstPartyModeSetupSuccessSubtleNotification from './FirstPartyModeSetupSuccessSubtleNotification';

const NotificationWithComponentProps = withNotificationComponentProps(
	'setup-success-notification-fpm'
)( FirstPartyModeSetupSuccessSubtleNotification );

function Template() {
	return <NotificationWithComponentProps />;
}

export const WithAdsAndAnalytics = Template.bind( {} );
WithAdsAndAnalytics.storyName = 'With Ads and Analytics';
WithAdsAndAnalytics.args = {
	modules: [ 'ads', 'analytics-4' ],
};
WithAdsAndAnalytics.scenario = {};

export const WithAds = Template.bind( {} );
WithAds.storyName = 'With Ads';
WithAds.args = {
	modules: [ 'ads' ],
};

export const WithAnalytics = Template.bind( {} );
WithAnalytics.storyName = 'With Analytics';
WithAnalytics.args = {
	modules: [ 'analytics-4' ],
};

export default {
	title: 'Modules/FirstPartyMode/Dashboard/FirstPartyModeSetupSuccessSubtleNotification',
	decorators: [
		( Story, { args } ) => {
			const setupRegistry = ( registry ) => {
				provideModules(
					registry,
					args.modules.map( ( slug ) => ( {
						slug,
						active: true,
						connected: true,
					} ) )
				);

				registry
					.dispatch( CORE_SITE )
					.receiveGetFirstPartyModeSettings( {
						isEnabled: true,
					} );
			};

			return (
				<WithRegistrySetup func={ setupRegistry }>
					<Story />
				</WithRegistrySetup>
			);
		},
	],
};
