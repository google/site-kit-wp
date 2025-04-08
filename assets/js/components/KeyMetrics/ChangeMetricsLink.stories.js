/**
 * Key Metrics ChangeMetricsLink Component Stories.
 *
 * Site Kit by Google, Copyright 2023 Google LLC
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
	provideKeyMetrics,
	provideUserAuthentication,
} from '../../../../tests/js/utils';
import WithRegistrySetup from '../../../../tests/js/WithRegistrySetup';
import {
	KM_ANALYTICS_NEW_VISITORS,
	KM_ANALYTICS_RETURNING_VISITORS,
} from '../../googlesitekit/datastore/user/constants';
import ChangeMetricsLink from './ChangeMetricsLink';

function Template() {
	return <ChangeMetricsLink />;
}

export const Default = Template.bind( {} );
Default.storyName = 'ChangeMetricsLink';

export default {
	title: 'Key Metrics/ChangeMetricsLink',
	component: ChangeMetricsLink,
	decorators: [
		( Story ) => {
			const setupRegistry = ( registry ) => {
				provideUserAuthentication( registry );
				provideKeyMetrics( registry, {
					widgetSlugs: [
						KM_ANALYTICS_NEW_VISITORS,
						KM_ANALYTICS_RETURNING_VISITORS,
					],
				} );
			};

			return (
				<WithRegistrySetup func={ setupRegistry }>
					<Story />
				</WithRegistrySetup>
			);
		},
	],
};
