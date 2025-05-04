/**
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
import SettingsCardKeyMetrics from './SettingsCardKeyMetrics';
import {
	WithTestRegistry,
	createTestRegistry,
	muteFetch,
	provideSiteInfo,
	provideUserAuthentication,
} from '../../../../tests/js/utils';
import { CORE_USER } from '../../googlesitekit/datastore/user/constants';

function Template() {
	return <SettingsCardKeyMetrics />;
}

export const Default = Template.bind( {} );
Default.storyName = 'Default';

export const WithUserInputCompleted = Template.bind( {} );
WithUserInputCompleted.storyName = 'WithUserInputCompleted';
WithUserInputCompleted.args = {
	setupRegistry: ( registry ) => {
		registry.dispatch( CORE_USER ).receiveIsUserInputCompleted( true );

		registry.dispatch( CORE_USER ).receiveGetUserInputSettings( {
			purpose: {
				values: [ 'publish_blog' ],
				scope: 'site',
			},
			postFrequency: {
				values: [ 'daily' ],
				scope: 'user',
			},
			goals: {
				values: [ 'retaining_visitors' ],
				scope: 'user',
			},
		} );
	},
};

export default {
	title: 'Key Metrics/SettingsCardKeyMetrics',
	decorators: [
		( Story, { args } ) => {
			const registry = createTestRegistry();

			provideUserAuthentication( registry );
			provideSiteInfo( registry );

			registry.dispatch( CORE_USER ).receiveIsUserInputCompleted( false );

			registry.dispatch( CORE_USER ).receiveGetKeyMetricsSettings( {
				widgetSlugs: [],
				isWidgetHidden: false,
			} );

			registry.dispatch( CORE_USER ).receiveGetUserInputSettings( {} );

			muteFetch(
				new RegExp(
					'^/google-site-kit/v1/core/user/data/survey-trigger'
				)
			);
			muteFetch(
				new RegExp(
					'^/google-site-kit/v1/core/user/data/survey-timeouts'
				)
			);

			if ( args.setupRegistry ) {
				args.setupRegistry( registry );
			}

			return (
				<WithTestRegistry
					registry={ registry }
					features={ args.features || [] }
				>
					<Story />
				</WithTestRegistry>
			);
		},
	],
};
