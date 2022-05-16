/**
 * DashboardSharingSettings Component Stories.
 *
 * Site Kit by Google, Copyright 2022 Google LLC
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
import { CORE_MODULES } from '../../../googlesitekit/modules/datastore/constants';
import { withConnected } from '../../../googlesitekit/modules/datastore/__fixtures__';
import {
	provideModuleRegistrations,
	provideSiteConnection,
} from '../../../../../tests/js/utils';
import WithRegistrySetup from '../../../../../tests/js/WithRegistrySetup';
import DashboardSharingSettings from './index';

const Template = ( { setupRegistry = () => {}, ...args } ) => (
	<WithRegistrySetup func={ setupRegistry }>
		<DashboardSharingSettings { ...args } />
	</WithRegistrySetup>
);

export const DefaultDashboardSharingSettings = Template.bind( {} );
DefaultDashboardSharingSettings.storyName = 'Default';
DefaultDashboardSharingSettings.args = {
	setupRegistry: ( registry ) => {
		registry
			.dispatch( CORE_MODULES )
			.receiveGetModules(
				withConnected(
					'adsense',
					'analytics',
					'pagespeed-insights',
					'search-console'
				)
			);
		provideModuleRegistrations( registry );
	},
};

export const MultipleAdminsDashboardSharingSettings = Template.bind( {} );
MultipleAdminsDashboardSharingSettings.storyName = 'Multiple Admins';
MultipleAdminsDashboardSharingSettings.args = {
	setupRegistry: ( registry ) => {
		registry
			.dispatch( CORE_MODULES )
			.receiveGetModules(
				withConnected(
					'adsense',
					'analytics',
					'pagespeed-insights',
					'search-console'
				)
			);
		provideModuleRegistrations( registry );
		provideSiteConnection( registry, {
			hasMultipleAdmins: true,
		} );
	},
};

export default {
	title: 'Components/DashboardSharingSettings',
	component: DashboardSharingSettings,
};
