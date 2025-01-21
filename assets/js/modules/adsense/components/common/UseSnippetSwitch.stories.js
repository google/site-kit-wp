/**
 * AdSense UseSnippetSwitch Stories.
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
import { MODULES_ADSENSE } from '../../datastore/constants';
import UseSnippetSwitch from './UseSnippetSwitch';
import WithRegistrySetup from '../../../../../../tests/js/WithRegistrySetup';

function Template() {
	return (
		<div className="googlesitekit-setup-module__inputs">
			<UseSnippetSwitch />
		</div>
	);
}

export const On = Template.bind( {} );
On.storyName = 'On';
On.args = {
	setupRegistry: ( registry ) => {
		registry.dispatch( MODULES_ADSENSE ).setUseSnippet( true );
	},
};

export const Off = Template.bind( {} );
Off.storyName = 'Off';
Off.args = {
	setupRegistry: ( registry ) => {
		registry.dispatch( MODULES_ADSENSE ).setUseSnippet( false );
	},
};

export default {
	title: 'Modules/Adsense/Components/UseSnippetSwitch',
	component: UseSnippetSwitch,
	decorators: [
		( Story, { args } ) => {
			return (
				<WithRegistrySetup func={ args.setupRegistry }>
					<Story />
				</WithRegistrySetup>
			);
		},
	],
};
