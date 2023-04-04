/**
 * SwitchedToGA4Banner Component Stories.
 *
 * Site Kit by Google, Copyright 2023 Google LLC
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
import SwitchedToGA4Banner from './SwitchedToGA4Banner';
import WithRegistrySetup from '../../../../tests/js/WithRegistrySetup';
import { provideModules } from '../../../../tests/js/utils';
import {
	DASHBOARD_VIEW_UA,
	MODULES_ANALYTICS,
} from '../../modules/analytics/datastore/constants';

function Template() {
	return <SwitchedToGA4Banner />;
}

export const Default = Template.bind( {} );
Default.storyName = 'Default';
Default.scenario = {
	label: 'Global/SwitchedToGA4Banner/Default',
};

export default {
	title: 'Components/SwitchedToGA4Banner',
	decorators: [
		( Story ) => {
			const setupRegistry = ( registry ) => {
				provideModules( registry, [
					{
						active: true,
						connected: true,
						slug: 'analytics',
					},
					{
						active: true,
						connected: true,
						slug: 'analytics-4',
					},
				] );

				registry
					.dispatch( MODULES_ANALYTICS )
					.setDashboardView( DASHBOARD_VIEW_UA );
			};

			return (
				<WithRegistrySetup func={ setupRegistry }>
					<Story />
				</WithRegistrySetup>
			);
		},
	],
};
