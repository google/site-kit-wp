/**
 * SettingsUACutoffWarning Component Stories.
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
import SettingsUACutoffWarning from './SettingsUACutoffWarning';

const Template = () => <SettingsUACutoffWarning />;

export const Default = Template.bind( {} );
Default.storyName = 'Default';
Default.parameters = {
	features: [ 'ga4Reporting' ],
};
Default.args = {
	setupRegistry: ( registry ) => {
		registry.dispatch( CORE_USER ).setReferenceDate( '2023-05-01' );
	},
};
Default.scenario = {
	label: 'Modules/Analytics/Components/UACutoffWarning/Default',
};

export const PostUACutoffDate = Template.bind( {} );
PostUACutoffDate.storyName = 'Post UA Cutoff Date';
PostUACutoffDate.parameters = {
	features: [ 'ga4Reporting' ],
};
PostUACutoffDate.args = {
	setupRegistry: ( registry ) => {
		registry.dispatch( CORE_USER ).setReferenceDate( UA_CUTOFF_DATE );
	},
};
PostUACutoffDate.scenario = {
	label: 'Modules/Analytics/Components/UACutoffWarning/PostUACutoffDate',
};

export default {
	title: 'Modules/Analytics/Components/SettingsUACutoffWarning',
	decorators: [
		( Story, { args } ) => {
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

				// Call story-specific setup.
				args.setupRegistry?.( registry );
			};

			return (
				<WithRegistrySetup func={ setupRegistry }>
					<Story />
				</WithRegistrySetup>
			);
		},
	],
};
