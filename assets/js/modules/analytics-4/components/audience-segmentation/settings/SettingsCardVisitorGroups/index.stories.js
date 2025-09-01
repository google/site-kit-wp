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
import { CORE_UI } from '@/js/googlesitekit/datastore/ui/constants';
import { CORE_USER } from '@/js/googlesitekit/datastore/user/constants';
import { MODULES_ANALYTICS_4 } from '@/js/modules/analytics-4/datastore/constants';
import { SHOW_SETTINGS_VISITOR_GROUPS_SUCCESS_NOTIFICATION } from './SetupSuccess';
import WithRegistrySetup from '../../../../../../../../tests/js/WithRegistrySetup';
import SettingsCardVisitorGroups from './';

function Template() {
	return <SettingsCardVisitorGroups />;
}

export const Default = Template.bind( {} );
Default.storyName = 'Default';
Default.scenario = {};

export const WithSetupCTA = Template.bind( {} );
WithSetupCTA.storyName = 'With setup CTA';
WithSetupCTA.args = {
	setupRegistry: ( registry ) => {
		registry.dispatch( CORE_USER ).receiveGetUserAudienceSettings( {
			configuredAudiences: null,
			isAudienceSegmentationWidgetHidden: false,
		} );
	},
};
WithSetupCTA.scenario = {};

export const WithSetupSuccessNotification = Template.bind( {} );
WithSetupSuccessNotification.storyName = 'With setup success notification';
WithSetupSuccessNotification.args = {
	setupRegistry: ( registry ) => {
		registry
			.dispatch( CORE_UI )
			.setValue(
				SHOW_SETTINGS_VISITOR_GROUPS_SUCCESS_NOTIFICATION,
				true
			);
	},
};
WithSetupSuccessNotification.scenario = {};

export default {
	title: 'Modules/Analytics4/Components/AudienceSegmentation/Settings/SettingsCardVisitorGroups',
	decorators: [
		( Story, { args } ) => {
			function setupRegistry( registry ) {
				registry.dispatch( CORE_USER ).receiveGetUserAudienceSettings( {
					configuredAudiences: [ 'audienceA', 'audienceB' ],
					isAudienceSegmentationWidgetHidden: false,
				} );

				registry
					.dispatch( MODULES_ANALYTICS_4 )
					.receiveGetAudienceSettings( {
						audienceSegmentationSetupCompletedBy: null,
					} );

				// Mock the audience-settings endpoint to allow toggling the switch.
				fetchMock.post(
					RegExp(
						'google-site-kit/v1/core/user/data/audience-settings'
					),
					( url, { body } ) => {
						const { data } = JSON.parse( body );

						return { body: data.settings };
					}
				);

				if ( args.setupRegistry ) {
					args.setupRegistry( registry );
				}
			}

			return (
				<WithRegistrySetup func={ setupRegistry }>
					<Story />
				</WithRegistrySetup>
			);
		},
	],
};
