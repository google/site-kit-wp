/**
 * FullScreenMetricsSelectionApp Component Stories.
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
	createTestRegistry,
	provideSiteInfo,
	WithTestRegistry,
} from '../../../../tests/js/utils';
import { CORE_USER } from '../../googlesitekit/datastore/user/constants';
import { VIEW_CONTEXT_METRIC_SELECTION } from '../../googlesitekit/constants';
import { Provider as ViewContextProvider } from '../Root/ViewContextContext';
import FullScreenMetricsSelectionApp from './FullScreenMetricSelectionApp';

function Template() {
	return (
		<ViewContextProvider value={ VIEW_CONTEXT_METRIC_SELECTION }>
			<FullScreenMetricsSelectionApp />
		</ViewContextProvider>
	);
}

export const Default = Template.bind( {} );
Default.storyName = 'Default';
Default.args = {
	features: [ 'conversionReporting' ],
};
Default.scenario = {};

export default {
	title: 'Key Metrics/FullScreenMetricsSelectionApp',
	component: FullScreenMetricsSelectionApp,
	decorators: [
		( Story, { args } ) => {
			const registry = createTestRegistry();

			registry.dispatch( CORE_USER ).receiveIsUserInputCompleted( false );

			provideSiteInfo( registry );

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
	parameters: {
		padding: 0,
	},
};
