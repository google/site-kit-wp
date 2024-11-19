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
import AudienceSegmentationSetupSuccessSubtleNotification from './AudienceSegmentationSetupSuccessSubtleNotification';
import { withNotificationComponentProps } from '../../../../../googlesitekit/notifications/util/component-props';
import WithRegistrySetup from '../../../../../../../tests/js/WithRegistrySetup';
import { CORE_USER } from '../../../../../googlesitekit/datastore/user/constants';

const NotificationWithComponentProps = withNotificationComponentProps(
	'setup-success-notification-audiences'
)( AudienceSegmentationSetupSuccessSubtleNotification );

function Template() {
	return <NotificationWithComponentProps />;
}
export const Default = Template.bind( {} );
Default.storyName = 'AudienceSegmentationSetupSuccessSubtleNotification';
Default.scenario = {
	label: 'Modules/Analytics4/Components/AudienceSegmentation/Dashboard/AudienceSegmentationSetupSuccessSubtleNotification',
};

export default {
	title: 'Modules/Analytics4/Components/AudienceSegmentation/Dashboard/AudienceSegmentationSetupSuccessSubtleNotification',
	decorators: [
		( Story ) => {
			const setupRegistry = ( registry ) => {
				registry.dispatch( CORE_USER ).receiveGetAudienceSettings( {
					isAudienceSegmentationWidgetHidden: false,
					configuredAudiences: null,
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
