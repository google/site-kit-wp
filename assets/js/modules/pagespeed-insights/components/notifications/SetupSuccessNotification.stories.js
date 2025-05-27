/**
 * SetupSuccessNotification Component Stories.
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
import { provideModules } from '../../../../../../tests/js/utils';
import WithRegistrySetup from '../../../../../../tests/js/WithRegistrySetup';
import SetupSuccessNotification from './SetupSuccessNotification';
import { withNotificationComponentProps } from '../../../../googlesitekit/notifications/util/component-props';
import { MODULE_SLUG_PAGESPEED_INSIGHTS } from '../../datastore/constants';

const NotificationWithComponentProps = withNotificationComponentProps(
	'setup-success-notification-site-kit'
)( SetupSuccessNotification );

function Template() {
	return <NotificationWithComponentProps />;
}

export const Default = Template.bind();
Default.storyName = 'SetupSuccessNotification';
Default.parameters = {
	query: {
		notification: 'authentication_success',
		slug: MODULE_SLUG_PAGESPEED_INSIGHTS,
	},
};
Default.scenario = {};

export default {
	title: 'Modules/PageSpeed Insights/Notifications/SetupSuccessNotification',
	decorators: [
		withQuery,
		( Story ) => {
			const setupRegistry = ( registry ) => {
				provideModules( registry );
			};

			return (
				<WithRegistrySetup func={ setupRegistry }>
					<Story />
				</WithRegistrySetup>
			);
		},
	],
};
