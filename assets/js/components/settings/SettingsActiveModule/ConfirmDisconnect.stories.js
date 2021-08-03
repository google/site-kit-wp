/**
 * ConfirmDisconnect Component Stories.
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
import ConfirmDisconnect from './ConfirmDisconnect';
import { provideModules } from '../../../../../tests/js/utils';
import WithRegistrySetup from '../../../../../tests/js/WithRegistrySetup';
import { CORE_UI } from '../../../googlesitekit/datastore/ui/constants';

const Template = ( args ) => <ConfirmDisconnect { ...args } />;

// TODO - better name. w/features
export const DefaultConfirmDisconnect = Template.bind( {} );
DefaultConfirmDisconnect.storyName = 'Default ConfirmDisconnect';
DefaultConfirmDisconnect.args = {
	slug: 'search-console',
};
DefaultConfirmDisconnect.decorators = [
	( Story ) => {
		const setupRegistry = ( registry ) => {
			// Set up the search console and analytics modules stores but provide no data.
			provideModules( registry, [
				{
					slug: 'search-console',
					active: true,
					connected: true,
				},
				{
					slug: 'analytics',
					active: true,
					connected: true,
				},
			] );

			registry
				.dispatch( CORE_UI )
				.setValue( 'module-search-console-dialogActive', true );
		};

		return (
			<WithRegistrySetup func={ setupRegistry }>
				<Story />
			</WithRegistrySetup>
		);
	},
];

// TODO - w/o features

export default {
	title: 'Components/ConfirmDisconnect',
	component: ConfirmDisconnect,
};
