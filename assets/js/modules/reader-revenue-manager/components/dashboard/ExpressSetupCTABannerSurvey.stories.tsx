/**
 * ExpressSetupCTABannerSurvey component stories.
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
import { ReactElement } from 'react';

/**
 * WordPress dependencies
 */
import { WPDataRegistry } from '@wordpress/data/build-types/registry';

/**
 * Internal dependencies
 */
import { CORE_USER } from '@/js/googlesitekit/datastore/user/constants';
import { withNotificationComponentProps } from '@/js/googlesitekit/notifications/util/component-props';
import {
	MODULE_SLUG_READER_REVENUE_MANAGER,
	RRM_EXPRESS_SETUP_NOTIFICATION_IDS,
} from '@/js/modules/reader-revenue-manager/constants';
import { EXPRESS_SETUP_CTAS } from '@/js/modules/reader-revenue-manager/datastore/constants';
import { Story } from '@/js/types/Story';
import {
	provideModuleRegistrations,
	provideModules,
	provideSiteInfo,
	provideUserAuthentication,
	provideUserCapabilities,
} from '@tests/js/utils';
import WithRegistrySetup from '@tests/js/WithRegistrySetup';
import ExpressSetupCTABannerSurvey from './ExpressSetupCTABannerSurvey';

const NotificationWithComponentProps = withNotificationComponentProps(
	RRM_EXPRESS_SETUP_NOTIFICATION_IDS[ EXPRESS_SETUP_CTAS.SURVEY ]
)( ExpressSetupCTABannerSurvey );

function Template() {
	return <NotificationWithComponentProps />;
}

export const Default = Template.bind( {} ) as Story;
Default.storyName = 'ExpressSetupCTABannerSurvey';
Default.scenario = {};

export default {
	title: 'Modules/ReaderRevenueManager/Components/Dashboard/ExpressSetupCTABannerSurvey',
	decorators: [
		( StoryComponent: () => ReactElement ) => {
			function setupRegistry( registry: WPDataRegistry ) {
				provideModules( registry, [
					{
						slug: MODULE_SLUG_READER_REVENUE_MANAGER,
						active: false,
						connected: false,
					},
				] );

				provideModuleRegistrations( registry );
				provideSiteInfo( registry );
				provideUserAuthentication( registry );
				provideUserCapabilities( registry );

				registry.dispatch( CORE_USER ).receiveGetDismissedItems( [] );
			}

			return (
				<WithRegistrySetup func={ setupRegistry }>
					<StoryComponent />
				</WithRegistrySetup>
			);
		},
	],
};
