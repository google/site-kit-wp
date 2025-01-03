/**
 * UseSnippetSwitch component stories.
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
import WithRegistrySetup from '../../../../../../tests/js/WithRegistrySetup';
import { MODULES_TAGMANAGER } from '../../datastore/constants';
import UseSnippetSwitch from './UseSnippetSwitch';

function Template( args ) {
	return (
		<div className="googlesitekit-setup">
			<section className="googlesitekit-setup__wrapper">
				<div className="googlesitekit-setup-module">
					<UseSnippetSwitch { ...args } />
				</div>
			</section>
		</div>
	);
}

export const Default = Template.bind( {} );
Default.storyName = 'Default';
Default.args = {};

export default {
	title: 'Modules/TagManager/Components/UseSnippetSwitch',
	component: UseSnippetSwitch,
	decorators: [
		( Story ) => {
			const setupRegistry = ( registry ) => {
				registry.dispatch( MODULES_TAGMANAGER ).setSettings( {} );
				registry.dispatch( MODULES_TAGMANAGER ).setUseSnippet( true );
			};

			return (
				<WithRegistrySetup func={ setupRegistry }>
					<Story />
				</WithRegistrySetup>
			);
		},
	],
};
