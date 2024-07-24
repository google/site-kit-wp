/**
 * SettingsCardVisitorGroups component stories.
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
import fetchMock from 'fetch-mock';

/**
 * Internal dependencies
 */
import { CORE_USER } from '../../../../../../googlesitekit/datastore/user/constants';
import { MODULES_ANALYTICS_4 } from '../../../../datastore/constants';
import { SETTINGS_VISITOR_GROUPS_SETUP_SUCCESS_NOTIFICATION } from './SetupSuccess';
import WithRegistrySetup from '../../../../../../../../tests/js/WithRegistrySetup';
import SettingsCardVisitorGroups from './';

function Template() {
	return <SettingsCardVisitorGroups />;
}

export const Default = Template.bind( {} );
Default.storyName = 'Default';
Default.scenario = {
	label: 'Modules/Analytics4/Components/AudienceSegmentation/Settings/SettingsCardVisitorGroups/Default',
};

export const WithSetupCTA = Template.bind( {} );
WithSetupCTA.storyName = 'With setup CTA';
WithSetupCTA.args = {
	setupRegistry: ( registry ) => {
		registry.dispatch( MODULES_ANALYTICS_4 ).receiveGetAudienceSettings( {
			configuredAudiences: [],
			isAudienceSegmentationWidgetHidden: false,
		} );
	},
};
WithSetupCTA.scenario = {
	label: 'Modules/Analytics4/Components/AudienceSegmentation/Settings/SettingsCardVisitorGroups/WithSetupCTA',
};

export const WithSetupSuccessNotification = Template.bind( {} );
WithSetupSuccessNotification.storyName = 'With setup success notification';
WithSetupSuccessNotification.args = {
	setupRegistry: ( registry ) => {
		registry.dispatch( CORE_USER ).receiveGetDismissedItems( [] );
	},
};
WithSetupSuccessNotification.scenario = {
	label: 'Modules/Analytics4/Components/AudienceSegmentation/Settings/SettingsCardVisitorGroups/WithSetupSuccessNotification',
};

export default {
	title: 'Modules/Analytics4/Components/AudienceSegmentation/Settings/SettingsCardVisitorGroups',
	decorators: [
		( Story, { args } ) => {
			const setupRegistry = ( registry ) => {
				registry
					.dispatch( CORE_USER )
					.receiveGetDismissedItems( [
						SETTINGS_VISITOR_GROUPS_SETUP_SUCCESS_NOTIFICATION,
					] );

				registry
					.dispatch( MODULES_ANALYTICS_4 )
					.receiveGetAudienceSettings( {
						configuredAudiences: [ 'audienceA', 'audienceB' ],
						isAudienceSegmentationWidgetHidden: false,
					} );

				// Mock the audience-settings endpoint to allow toggling the switch.
				fetchMock.post(
					RegExp(
						'google-site-kit/v1/modules/analytics-4/data/audience-settings'
					),
					( url, { body } ) => {
						const { data } = JSON.parse( body );

						return { body: data.settings };
					}
				);

				if ( args.setupRegistry ) {
					args.setupRegistry( registry );
				}
			};

			return (
				<WithRegistrySetup func={ setupRegistry }>
					<Story />
				</WithRegistrySetup>
			);
		},
	],
};
