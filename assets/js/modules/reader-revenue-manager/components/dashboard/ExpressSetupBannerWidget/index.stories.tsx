/**
 * RRM ExpressSetupBannerWidget stories.
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
import { withWidgetComponentProps } from '@/js/googlesitekit/widgets/util';
import {
	MODULE_SLUG_READER_REVENUE_MANAGER,
	RRM_EXPRESS_SETUP_TRAFFIC_CTA_WIDGET_SLUG,
} from '@/js/modules/reader-revenue-manager/constants';
import { Story } from '@/js/types/Story';
import {
	provideModuleRegistrations,
	provideModules,
	provideSiteInfo,
	provideUserCapabilities,
} from '@tests/js/utils';
import WithRegistrySetup from '@tests/js/WithRegistrySetup';
import ExpressSetupBannerWidget from '.';

const WidgetWithComponentProps = withWidgetComponentProps(
	RRM_EXPRESS_SETUP_TRAFFIC_CTA_WIDGET_SLUG
)( ExpressSetupBannerWidget );

function Template() {
	return <WidgetWithComponentProps />;
}

export const Default = Template.bind( {} ) as Story;
Default.storyName = 'ExpressSetupBannerWidget';
Default.scenario = {};

export default {
	title: 'Modules/ReaderRevenueManager/Components/Dashboard/ExpressSetupBannerWidget',
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
				provideUserCapabilities( registry );
				registry.dispatch( CORE_USER ).receiveGetDismissedItems( [] );
				registry
					.dispatch( CORE_USER )
					.finishResolution( 'getDismissedItems', [] );
			}

			return (
				<WithRegistrySetup func={ setupRegistry }>
					<StoryComponent />
				</WithRegistrySetup>
			);
		},
	],
};
