/**
 * ExpressSetupResumeNewsletterNotification component stories.
 *
 * Site Kit by Google, Copyright 2026 Google LLC
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
import { ElementType } from 'react';

/**
 * Internal dependencies
 */
import { withNotificationComponentProps } from '@/js/googlesitekit/notifications/util/component-props';
import { RRM_EXPRESS_SETUP_RESUME_NEWSLETTER_NOTIFICATION_ID } from '@/js/modules/reader-revenue-manager/constants';
import {
	createTestRegistry,
	provideSiteInfo,
	provideUserAuthentication,
} from '@tests/js/utils';
import WithRegistrySetup from '@tests/js/WithRegistrySetup';
import ExpressSetupResumeNewsletterNotification from '.';

type Registry = ReturnType< typeof createTestRegistry >;

const NotificationWithComponentProps = withNotificationComponentProps(
	RRM_EXPRESS_SETUP_RESUME_NEWSLETTER_NOTIFICATION_ID
)( ExpressSetupResumeNewsletterNotification );

function Template() {
	return <NotificationWithComponentProps />;
}

export const Default = Template.bind( {} );
Default.storyName = 'ExpressSetupResumeNewsletterNotification';
Default.parameters = {
	features: [ 'rrmExpressSetup' ],
};
Default.scenario = {};

export default {
	title: 'Modules/ReaderRevenueManager/Components/Dashboard/ExpressSetupResumeNewsletterNotification',
	component: ExpressSetupResumeNewsletterNotification,
	decorators: [
		( Story: ElementType ) => {
			function setupRegistry( registry: Registry ) {
				provideSiteInfo( registry );
				provideUserAuthentication( registry );
			}

			return (
				<WithRegistrySetup func={ setupRegistry }>
					<Story />
				</WithRegistrySetup>
			);
		},
	],
};
