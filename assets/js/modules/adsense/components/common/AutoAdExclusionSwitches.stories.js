/**
 * AutoAdExclusionSwitches Component Stories.
 *
 * Site Kit by Google, Copyright 2021 Google LLC
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
import AutoAdExclusionSwitches from './AutoAdExclusionSwitches';
import { MODULES_ADSENSE } from '../../datastore/constants';
import {
	createTestRegistry,
	WithTestRegistry,
	provideModules,
} from '../../../../../../tests/js/utils';
import WithRegistrySetup from '../../../../../../tests/js/WithRegistrySetup';

function Template( { setupRegistry, ...args } ) {
	return (
		<WithRegistrySetup func={ setupRegistry }>
			<div className="googlesitekit-setup">
				<section className="googlesitekit-setup__wrapper">
					<div className="googlesitekit-setup-module">
						<AutoAdExclusionSwitches { ...args } />
					</div>
				</section>
			</div>
		</WithRegistrySetup>
	);
}

export const AdExclusionDefault = Template.bind( {} );
AdExclusionDefault.storyName = 'Ad exclusions (default)';
AdExclusionDefault.args = {
	setupRegistry: ( registry ) => {
		registry.dispatch( MODULES_ADSENSE ).setAutoAdsDisabled( [] );
	},
};

export const AdExclusionLoggedInUsers = Template.bind( {} );
AdExclusionLoggedInUsers.storyName = 'Ad exclusions (including loggedinUsers)';
AdExclusionLoggedInUsers.args = {
	setupRegistry: ( registry ) => {
		registry
			.dispatch( MODULES_ADSENSE )
			.setAutoAdsDisabled( [ 'loggedinUsers' ] );
	},
};

export const AdExclusionContentCreators = Template.bind( {} );
AdExclusionContentCreators.storyName =
	'Ad exclusions (including contentCreators)';
AdExclusionContentCreators.args = {
	setupRegistry: ( registry ) => {
		registry
			.dispatch( MODULES_ADSENSE )
			.setAutoAdsDisabled( [ 'contentCreators' ] );
	},
};

export default {
	title: 'Modules/AdSense/Components/AutoAdExclusionSwitches',
	component: AutoAdExclusionSwitches,
	decorators: [
		( Story ) => {
			const registry = createTestRegistry();
			provideModules( registry, [
				{
					slug: 'adsense',
					active: true,
					connected: true,
				},
			] );

			return (
				<WithTestRegistry registry={ registry }>
					<Story />
				</WithTestRegistry>
			);
		},
	],
};
