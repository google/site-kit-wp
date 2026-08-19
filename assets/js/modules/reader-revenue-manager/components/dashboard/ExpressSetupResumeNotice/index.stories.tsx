/**
 * ExpressSetupResumeNotice component stories.
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
import ExpressSetupResumeNotice, {
	ExpressSetupResumeNoticeProps,
} from '@/js/modules/reader-revenue-manager/components/dashboard/ExpressSetupResumeNotice';
import {
	createTestRegistry,
	provideSiteInfo,
	provideUserAuthentication,
} from '@tests/js/utils';
import WithRegistrySetup from '@tests/js/WithRegistrySetup';

type Registry = ReturnType< typeof createTestRegistry >;

function Template( args: ExpressSetupResumeNoticeProps ) {
	return <ExpressSetupResumeNotice { ...args } />;
}

export const Default = Template.bind( {} );
Default.storyName = 'ExpressSetupResumeNotice';
Default.args = {
	description:
		"It looks like you haven't finished setting up your newsletter sign-up form. Resume the setup to complete it and publish it to your site.",
	notificationID: 'notification-id',
	setupCTA: 'newsletter-signup',
	title: 'You’re just a few steps away from collecting reader emails!',
};
Default.parameters = {
	features: [ 'rrmExpressSetup' ],
};

export default {
	title: 'Modules/ReaderRevenueManager/Components/Dashboard/ExpressSetupResumeNotice',
	component: ExpressSetupResumeNotice,
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
