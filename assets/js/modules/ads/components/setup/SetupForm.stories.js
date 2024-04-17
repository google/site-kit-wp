/**
 * SetupForm component stories.
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
import { MODULES_ADS } from '../../datastore/constants';
import { CORE_USER } from '../../../../googlesitekit/datastore/user/constants';
import {
	provideModuleRegistrations,
	provideSiteInfo,
	provideModules,
} from '../../../../../../tests/js/utils';
import ModuleSetup from '../../../../components/setup/ModuleSetup';
import WithRegistrySetup from '../../../../../../tests/js/WithRegistrySetup';

function Template( { setupRegistry = () => {} } ) {
	return (
		<WithRegistrySetup func={ setupRegistry }>
			<ModuleSetup moduleSlug="ads" />
		</WithRegistrySetup>
	);
}

export const Default = Template.bind( {} );
Default.storyName = 'Default';
Default.scenario = {
	label: 'Modules/Ads/Setup/SetupForm/Default',
};

export const AdBlocker = Template.bind( {} );
AdBlocker.storyName = 'AdBlocker Active';
AdBlocker.args = {
	setupRegistry: ( registry ) => {
		provideModules( registry, [
			{
				slug: 'ads',
				active: false,
				connected: false,
			},
		] );
		registry.dispatch( CORE_USER ).receiveIsAdBlockerActive( true );
	},
};
AdBlocker.scenario = {
	label: 'Modules/Ads/Setup/SetupForm/AdBlocker',
};

export const Empty = Template.bind( {} );
Empty.storyName = 'Empty';
Empty.args = {
	setupRegistry: ( registry ) => {
		provideModules( registry, [
			{
				slug: 'ads',
				active: true,
				connected: true,
			},
		] );

		provideSiteInfo( registry );
		provideModuleRegistrations( registry );

		registry.dispatch( MODULES_ADS ).setSettings( { conversionID: '' } );
	},
};
Empty.scenario = {
	label: 'Modules/Ads/Setup/SetupForm/Empty',
};

export const Invalid = Template.bind( {} );
Invalid.storyName = 'Invalid';
Invalid.args = {
	setupRegistry: ( registry ) => {
		provideModules( registry, [
			{
				slug: 'ads',
				active: true,
				connected: true,
			},
		] );

		provideSiteInfo( registry );
		provideModuleRegistrations( registry );

		registry
			.dispatch( MODULES_ADS )
			.setSettings( { conversionID: 'AW-123456789' } );
		registry
			.dispatch( MODULES_ADS )
			.setSettings( { conversionID: 'AW-ABCDEFGHIJ' } );
	},
};
Invalid.scenario = {
	label: 'Modules/Ads/Setup/SetupForm/Invalid',
};

export const Initial = Template.bind( {} );
Initial.storyName = 'Initial';
Initial.args = {
	setupRegistry: ( registry ) => {
		provideModules( registry, [
			{
				slug: 'ads',
				active: false,
				connected: false,
			},
		] );

		provideSiteInfo( registry );
		provideModuleRegistrations( registry );

		registry.dispatch( MODULES_ADS ).setSettings( { conversionID: '' } );
	},
};

export default {
	title: 'Modules/Ads/Setup/SetupForm',
	decorators: [
		( Story ) => {
			const setupRegistry = ( registry ) => {
				provideModules( registry, [
					{
						slug: 'ads',
						active: true,
						connected: true,
					},
				] );

				provideSiteInfo( registry );
				provideModuleRegistrations( registry );

				registry
					.dispatch( MODULES_ADS )
					.setSettings( { conversionID: 'AW-123456789' } );
			};

			return (
				<WithRegistrySetup func={ setupRegistry }>
					<Story />
				</WithRegistrySetup>
			);
		},
	],
	parameters: {
		features: [ 'adsModule' ],
		padding: 0,
	},
};
