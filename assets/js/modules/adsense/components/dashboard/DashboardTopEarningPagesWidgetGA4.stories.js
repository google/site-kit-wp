/**
 * AdBlockerWarningWidget Component Stories.
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
import { provideModules } from '../../../../../../tests/js/utils';
import WithRegistrySetup from '../../../../../../tests/js/WithRegistrySetup';
import DashboardTopEarningPagesWidgetGA4 from './DashboardTopEarningPagesWidgetGA4';
import Widget from '../../../../googlesitekit/widgets/components/Widget';

function Template() {
	return <DashboardTopEarningPagesWidgetGA4 Widget={ Widget } />;
}

export const Ready = Template.bind( {} );
Ready.storyName = 'Ready';

export default {
	title: 'Modules/AdSense/Widgets/DashboardTopEarningPagesWidgetGA4',
	decorators: [
		( Story ) => {
			const setupRegistry = ( registry ) => {
				provideModules( registry, [
					{
						active: true,
						connected: true,
						slug: 'adsense',
					},
					{
						active: true,
						connected: true,
						slug: 'analytics-4',
					},
				] );
			};

			return (
				<WithRegistrySetup func={ setupRegistry }>
					<Story />
				</WithRegistrySetup>
			);
		},
	],
};
