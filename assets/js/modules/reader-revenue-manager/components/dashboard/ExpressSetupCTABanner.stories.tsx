/**
 * ExpressSetupCTABanner component stories.
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
import { ComponentProps, ReactElement } from 'react';

/**
 * WordPress dependencies
 */
import { WPDataRegistry } from '@wordpress/data/build-types/registry';

/**
 * Internal dependencies
 */
import { CORE_USER } from '@/js/googlesitekit/datastore/user/constants';
import { MODULE_SLUG_READER_REVENUE_MANAGER } from '@/js/modules/reader-revenue-manager/constants';
import { EXPRESS_SETUP_CTAS } from '@/js/modules/reader-revenue-manager/datastore/constants';
import { Story } from '@/js/types/Story';
import svgDesktopBanner from '@/svg/graphics/banner-rrm-survey-setup-cta-desktop.svg?url';
import svgMobileBanner from '@/svg/graphics/banner-rrm-survey-setup-cta-mobile.svg?url';
import svgTabletBanner from '@/svg/graphics/banner-rrm-survey-setup-cta-tablet.svg?url';
import {
	provideModuleRegistrations,
	provideModules,
	provideSiteInfo,
	provideUserAuthentication,
	provideUserCapabilities,
} from '@tests/js/utils';
import WithRegistrySetup from '@tests/js/WithRegistrySetup';
import ExpressSetupCTABanner from './ExpressSetupCTABanner';

function Template( args: ComponentProps< typeof ExpressSetupCTABanner > ) {
	return <ExpressSetupCTABanner { ...args } />;
}

export const Survey = Template.bind( {} ) as Story<
	ComponentProps< typeof ExpressSetupCTABanner >
>;
Survey.args = {
	ctaButtonLabel: 'Set up a survey',
	ctaType: EXPRESS_SETUP_CTAS.SURVEY,
	description:
		'Add a short survey to your site and get to know who’s reading: their interests, habits, and what brings them back.',
	notificationID: 'rrm-express-setup-notification_survey',
	svg: {
		desktop: svgDesktopBanner,
		mobile: svgMobileBanner,
		tablet: svgTabletBanner,
	},
	title: 'Learn more about your readers',
};

export default {
	title: 'Modules/ReaderRevenueManager/Components/Dashboard/ExpressSetupCTABanner',
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
