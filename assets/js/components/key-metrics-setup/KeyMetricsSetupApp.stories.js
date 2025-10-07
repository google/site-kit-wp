/**
 * Key Metrics Setup App Stories.
 *
 * Site Kit by Google, Copyright 2025 Google LLC
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
import { withQuery } from '@storybook/addon-queryparams';

/**
 * Internal dependencies
 */
import KeyMetricsSetupApp from './KeyMetricsSetupApp';
import { CORE_USER } from '@/js/googlesitekit/datastore/user/constants';
import { VIEW_CONTEXT_KEY_METRICS_SETUP } from '@/js/googlesitekit/constants';
import { Provider as ViewContextProvider } from '@/js/components/Root/ViewContextContext';
import WithRegistrySetup from '../../../../tests/js/WithRegistrySetup';

function Template() {
	return <KeyMetricsSetupApp />;
}

export const Default = Template.bind( {} );
Default.storyName = 'Default';

export const WithError = Template.bind( {} );
WithError.storyName = 'With error';
WithError.args = {
	setupRegistry: ( registry ) => {
		registry.dispatch( CORE_USER ).receiveError(
			{
				code: 'test_code',
				message: 'Test error message',
				data: {
					reason: '',
				},
			},
			'saveUserInputSettings',
			[]
		);
	},
};

export default {
	title: 'Modules/Analytics4/Setup/KeyMetricsSetupApp',
	component: KeyMetricsSetupApp,
	decorators: [
		withQuery,
		( Story, { args } ) => {
			function setupRegistry( registry ) {
				if ( args?.setupRegistry ) {
					args.setupRegistry( registry );
				}
			}

			return (
				<WithRegistrySetup func={ setupRegistry }>
					<ViewContextProvider
						value={ VIEW_CONTEXT_KEY_METRICS_SETUP }
					>
						<Story />
					</ViewContextProvider>
				</WithRegistrySetup>
			);
		},
	],
};
