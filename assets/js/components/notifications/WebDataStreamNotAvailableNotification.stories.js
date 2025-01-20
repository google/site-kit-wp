/**
 * AuthError Component Stories.
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
import WithRegistrySetup from '../../../../tests/js/WithRegistrySetup';
import WebDataStreamNotAvailableNotification from './WebDataStreamNotAvailableNotification';
import { withNotificationComponentProps } from '../../googlesitekit/notifications/util/component-props';
import { MODULES_ANALYTICS_4 } from '../../modules/analytics-4/datastore/constants';

const NotificationWithComponentProps = withNotificationComponentProps(
	'web-data-stream-not-available-notification'
)( WebDataStreamNotAvailableNotification );

function Template() {
	return <NotificationWithComponentProps />;
}

export const AuthenticationError = Template.bind( {} );
AuthenticationError.storyName = 'WebDataStreamNotAvailableNotification';
AuthenticationError.args = {
	label: 'Components/Notifications/Banners/WebDataStreamNotAvailableNotification',
};

export default {
	title: 'Components/Notifications/Banners',
	decorators: [
		( Story ) => {
			const setupRegistry = ( registry ) => {
				const currentMeasurementID = 'G-2B7M8YQ1K6';
				const currentAnalyticsSettingsMock = {
					ownerID: 0,
					propertyID: '1000',
					webDataStreamID: '2000',
					measurementID: currentMeasurementID,
					googleTagID: 'GT-12345',
					googleTagLastSyncedAtMs: 0,
				};

				registry
					.dispatch( MODULES_ANALYTICS_4 )
					.setSettings( currentAnalyticsSettingsMock );
			};

			return (
				<WithRegistrySetup func={ setupRegistry }>
					<Story />
				</WithRegistrySetup>
			);
		},
	],
};
