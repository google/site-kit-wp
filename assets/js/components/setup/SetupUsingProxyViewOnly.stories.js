/**
 * SetupUsingProxyViewOnly Component Stories.
 *
 * Site Kit by Google, Copyright 2022 Google LLC
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
import SetupUsingProxyViewOnly from './SetupUsingProxyViewOnly';
import { CORE_USER } from '../../googlesitekit/datastore/user/constants';
import { provideSiteConnection } from '../../../../tests/js/utils';
import WithRegistrySetup from '../../../../tests/js/WithRegistrySetup';
import { Provider as ViewContextProvider } from '../Root/ViewContextContext';
import { VIEW_CONTEXT_MAIN_DASHBOARD } from '../../googlesitekit/constants';

function Template() {
	return (
		<ViewContextProvider value={ VIEW_CONTEXT_MAIN_DASHBOARD }>
			<SetupUsingProxyViewOnly />
		</ViewContextProvider>
	);
}

export const Start = Template.bind( {} );
Start.storyName = 'Start';

export default {
	title: 'Setup / Using Proxy View-Only',
	decorators: [
		( Story, { args } ) => {
			const setupRegistry = ( registry ) => {
				provideSiteConnection( registry, {
					hasConnectedAdmins: false,
				} );

				registry
					.dispatch( CORE_USER )
					.receiveGetTracking( { enabled: false } );

				// Call story-specific setup.
				if ( typeof args?.setupRegistry === 'function' ) {
					args.setupRegistry( registry );
				}
			};

			return (
				<WithRegistrySetup func={ setupRegistry }>
					<Story />
				</WithRegistrySetup>
			);
		},
	],
	parameters: { padding: 0 },
};
