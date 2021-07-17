/**
 * IdeaHubModuleNotification Component Stories.
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
 * External dependencies
 */
import fetchMock from 'fetch-mock';

/**
 * Internal dependencies
 */
import IdeaHubModuleNotification from './IdeaHubModuleNotification';
import { CORE_USER } from '../../googlesitekit/datastore/user/constants';
import { createTestRegistry, WithTestRegistry, provideModules } from '../../../../tests/js/utils';
import { enabledFeatures } from '../../features';

const Template = ( { ...args } ) => <IdeaHubModuleNotification { ...args } />;

export const Ready = Template.bind( {} );
Ready.storyName = 'Ready';
Ready.decorators = [
	( Story ) => {
		fetchMock.reset();

		fetchMock.get(
			/^\/google-site-kit\/v1\/core\/user\/data\/dismissed-items/,
			{ body: {}, status: 200 }
		);
		return <Story />;
	},
];

export default {
	title: 'Modules/Idea Hub/Notifications/ModuleNotification',
	component: IdeaHubModuleNotification,
	decorators: [
		( Story ) => {
			enabledFeatures.clear();
			enabledFeatures.add( 'ideaHubModule' );

			const registry = createTestRegistry();
			provideModules( registry, [ {
				slug: 'idea-hub',
				active: false,
				connected: false,
			} ] );
			registry.dispatch( CORE_USER ).receiveGetAuthentication( { needsReauthentication: false } );

			return (
				<WithTestRegistry registry={ registry } features={ [ 'ideaHubModule' ] }>
					<Story />
				</WithTestRegistry>
			);
		},
	],
};
