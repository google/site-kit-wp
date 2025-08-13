/**
 * PublicationApprovedOverlayNotification component stories.
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
import PublicationApprovedOverlayNotification, {
	RRM_PUBLICATION_APPROVED_OVERLAY_NOTIFICATION,
} from './PublicationApprovedOverlayNotification';
import { withNotificationComponentProps } from '../../../../googlesitekit/notifications/util/component-props';
import { MODULES_READER_REVENUE_MANAGER } from '../../datastore/constants';
import WithRegistrySetup from '../../../../../../tests/js/WithRegistrySetup';

const NotificationWithComponentProps = withNotificationComponentProps(
	RRM_PUBLICATION_APPROVED_OVERLAY_NOTIFICATION
)( PublicationApprovedOverlayNotification );

function Template() {
	return <NotificationWithComponentProps />;
}

export const Default = Template.bind( {} );
Default.storyName = 'PublicationApprovedOverlayNotification';
Default.scenario = {};

export default {
	title: 'Modules/ReaderRevenueManager/Components/Dashboard/PublicationApprovedOverlayNotification',
	decorators: [
		( Story ) => {
			function setupRegistry( registry ) {
				registry
					.dispatch( MODULES_READER_REVENUE_MANAGER )
					.receiveGetSettings( {
						publicationID: '1234567',
					} );
			}

			return (
				<WithRegistrySetup func={ setupRegistry }>
					<Story />
				</WithRegistrySetup>
			);
		},
	],
};
