/**
 * SettingsModules stories.
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
import { MemoryRouter } from 'react-router-dom';

/**
 * Internal dependencies
 */
import WithRegistrySetup from '../../../../tests/js/WithRegistrySetup';
import { CORE_MODULES } from '../../googlesitekit/modules/datastore/constants';
import { MODULE_SLUG_ADS } from '@/js/modules/ads/constants';
import { MODULE_SLUG_ADSENSE } from '@/js/modules/adsense/constants';
import { MODULE_SLUG_ANALYTICS_4 } from '@/js/modules/analytics-4/constants';
import { MODULE_SLUG_PAGESPEED_INSIGHTS } from '../../modules/pagespeed-insights/datastore/constants';
import { MODULE_SLUG_SEARCH_CONSOLE } from '../../modules/search-console/datastore/constants';
import { MODULE_SLUG_SIGN_IN_WITH_GOOGLE } from '../../modules/sign-in-with-google/datastore/constants';
import {
	provideModuleRegistrations,
	provideModules,
	untilResolved,
} from './../../../../tests/js/utils';
import SettingsModules from './SettingsModules';

function Template( { setupRegistry, route = '/connected-services' } ) {
	return (
		<MemoryRouter initialEntries={ [ route ] }>
			<WithRegistrySetup func={ setupRegistry }>
				<SettingsModules />
			</WithRegistrySetup>
		</MemoryRouter>
	);
}

export const ConnectedServices = Template.bind( {} );
ConnectedServices.args = {
	setupRegistry: ( registry ) => {
		provideModules(
			registry,
			[
				MODULE_SLUG_ADS,
				MODULE_SLUG_ADSENSE,
				MODULE_SLUG_ANALYTICS_4,
				MODULE_SLUG_PAGESPEED_INSIGHTS,
				MODULE_SLUG_SEARCH_CONSOLE,
				MODULE_SLUG_SIGN_IN_WITH_GOOGLE,
			].map( ( slug ) => ( {
				slug,
				active: true,
				connected: true,
			} ) )
		);
		provideModuleRegistrations( registry );
	},
};
ConnectedServices.scenario = {};

export const ConnectMoreServices = Template.bind( {} );
ConnectMoreServices.args = {
	setupRegistry: async ( registry ) => {
		provideModules(
			registry,
			[
				MODULE_SLUG_ADS,
				MODULE_SLUG_ADSENSE,
				MODULE_SLUG_PAGESPEED_INSIGHTS,
				MODULE_SLUG_SEARCH_CONSOLE,
			].map( ( slug ) => ( {
				slug,
				active: true,
				connected: true,
			} ) )
		);
		provideModuleRegistrations( registry );
		registry.select( CORE_MODULES ).getModule( MODULE_SLUG_ADSENSE );
		await untilResolved( registry, CORE_MODULES ).getModules();
	},
	route: '/connect-more-services',
};
ConnectMoreServices.scenario = {};

export default {
	title: 'Components/SettingsModules',
	component: SettingsModules,
};
