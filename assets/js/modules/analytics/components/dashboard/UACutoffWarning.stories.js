/**
 * UACutoffWarning Component Stories.
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
import { CORE_USER } from '../../../../googlesitekit/datastore/user/constants';
import { UA_CUTOFF_DATE } from '../../../../modules/analytics/constants';
import { provideModules } from '../../../../../../tests/js/utils';
import WithRegistrySetup from '../../../../../../tests/js/WithRegistrySetup';
import UACutoffWarning from './UACutoffWarning';

const Template = () => <UACutoffWarning />;

export const Default = Template.bind( {} );
Default.storyName = 'Default';
Default.parameters = {
	features: [ 'ga4Reporting' ],
};
Default.scenario = {
	label: 'Modules/Analytics/Components/UACutoffWarning',
};

export default {
	title: 'Modules/Analytics/Components/UACutoffWarning',
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
						connected: false,
						slug: 'analytics-4',
					},
				] );

				registry
					.dispatch( CORE_USER )
					.setReferenceDate( UA_CUTOFF_DATE );
			};

			return (
				<WithRegistrySetup func={ setupRegistry }>
					<Story />
				</WithRegistrySetup>
			);
		},
	],
};
