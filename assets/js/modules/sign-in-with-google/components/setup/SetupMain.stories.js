/**
 * SetupMain component stories.
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
import {
	provideModuleRegistrations,
	provideSiteInfo,
	provideModules,
} from '../../../../../../tests/js/utils';
import ModuleSetup from '../../../../components/setup/ModuleSetup';
import WithRegistrySetup from '../../../../../../tests/js/WithRegistrySetup';
import { VIEW_CONTEXT_MAIN_DASHBOARD } from '../../../../googlesitekit/constants';
import { Provider as ViewContextProvider } from '../../../../components/Root/ViewContextContext';

function Template( { setupRegistry = () => {} } ) {
	return (
		<WithRegistrySetup func={ setupRegistry }>
			<ViewContextProvider value={ VIEW_CONTEXT_MAIN_DASHBOARD }>
				<ModuleSetup moduleSlug="sign-in-with-google" />
			</ViewContextProvider>
		</WithRegistrySetup>
	);
}

export const Default = Template.bind( {} );
Default.storyName = 'Default';
Default.scenario = {};

export const WithHTTPSWarning = Template.bind( {} );
WithHTTPSWarning.storyName = 'With HTTPS Warning';
WithHTTPSWarning.args = {
	setupRegistry: ( registry ) => {
		provideSiteInfo( registry );
	},
};

export default {
	title: 'Modules/SignInWithGoogle/Setup/SetupMain',
	decorators: [
		( Story ) => {
			const setupRegistry = ( registry ) => {
				provideModules( registry, [
					{
						slug: 'sign-in-with-google',
						active: true,
						connected: true,
					},
				] );

				provideSiteInfo( registry, {
					homeURL: 'https://example.com',
				} );
				provideModuleRegistrations( registry );
			};

			return (
				<WithRegistrySetup func={ setupRegistry }>
					<Story />
				</WithRegistrySetup>
			);
		},
	],
	parameters: {
		padding: 0,
	},
};
