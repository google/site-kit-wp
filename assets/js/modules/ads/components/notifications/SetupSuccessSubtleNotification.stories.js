/**
 * SetupSuccessSubtleNotification Component Stories.
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
import { withQuery } from '@storybook/addon-queryparams';

/**
 * Internal dependencies
 */
import SetupSuccessSubtleNotification from './SetupSuccessSubtleNotification';
import { WithTestRegistry } from '../../../../../../tests/js/utils';
import { withNotificationComponentProps } from '../../../../googlesitekit/notifications/util/component-props';

const NotificationWithComponentProps = withNotificationComponentProps(
	'setup-success-notification-ads'
)( SetupSuccessSubtleNotification );

function Template( { ...args } ) {
	return <NotificationWithComponentProps { ...args } />;
}

export const Ads = Template.bind( {} );
Ads.storyName = 'SetupSuccessSubtleNotification';
Ads.parameters = {
	query: {
		notification: 'authentication_success',
		slug: 'ads',
	},
};
Ads.scenario = {
	label: 'SetupSuccessSubtleNotification',
};

export default {
	title: 'Modules/Ads/Notifications/SetupSuccessSubtleNotification',
	component: SetupSuccessSubtleNotification,
	decorators: [
		withQuery,
		( Story, { parameters } ) => {
			return (
				<WithTestRegistry features={ parameters.features || [] }>
					<Story />
				</WithTestRegistry>
			);
		},
	],
};
