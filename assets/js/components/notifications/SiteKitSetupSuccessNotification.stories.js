/**
 * SiteKitSetupSuccessNotification Component Stories.
 *
 * Site Kit by Google, Copyright 2025 Google LLC
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
import { withQuery } from '@storybook/addon-queryparams';

/**
 * Internal dependencies
 */
import SiteKitSetupSuccessNotification from './SiteKitSetupSuccessNotification';
import { withNotificationComponentProps } from '../../googlesitekit/notifications/util/component-props';

const NotificationWithComponentProps = withNotificationComponentProps(
	'setup-success-notification-site-kit'
)( SiteKitSetupSuccessNotification );

function Template() {
	return <NotificationWithComponentProps />;
}

export const Default = Template.bind();
Default.storyName = 'SiteKitSetupSuccessNotification';
Default.parameters = {
	query: {
		notification: 'authentication_success',
		slug: undefined,
	},
};
Default.scenario = {};

export default {
	title: 'Components/Notifications/Banners/SiteKitSetupSuccessNotification',
	decorators: [ withQuery ],
};
