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
 * Internal dependencies
 */
import WithRegistrySetup from '../../../../tests/js/WithRegistrySetup';
import { CORE_MODULES } from '../../googlesitekit/modules/datastore/constants';
import {
	provideModuleRegistrations,
	provideModules,
	untilResolved,
} from './../../../../tests/js/utils';
import SettingsModules from './SettingsModules';

function Template( { setupRegistry } ) {
	return (
		<WithRegistrySetup func={ setupRegistry }>
			<SettingsModules />
		</WithRegistrySetup>
	);
}

export const ConnectedServices = Template.bind( {} );
ConnectedServices.args = {
	setupRegistry: ( registry ) => {
		provideModules(
			registry,
			[
				'ads',
				'adsense',
				'analytics-4',
				'pagespeed-insights',
				'search-console',
				'sign-in-with-google',
			].map( ( slug ) => ( {
				slug,
				active: true,
				connected: true,
			} ) )
		);
		provideModuleRegistrations( registry );
	},
};

export const ConnectMoreServices = Template.bind( {} );
ConnectMoreServices.args = {
	setupRegistry: async ( registry ) => {
		provideModules(
			registry,
			[ 'ads', 'adsense', 'pagespeed-insights', 'search-console' ].map(
				( slug ) => ( {
					slug,
					active: true,
					connected: true,
				} )
			)
		);
		provideModuleRegistrations( registry );
		registry.select( CORE_MODULES ).getModule( 'adsense' );
		await untilResolved( registry, CORE_MODULES ).getModules();
	},
};
// TODO: find out how to configure react-router-dom with this story format.
// ConnectMoreServices.scenario = {
// 	label: 'Settings/SettingsModules/ConnectMoreServices',
// 	route: '/connected-services',
// };

export default {
	title: 'Components/SettingsModules',
	component: SettingsModules,
};
