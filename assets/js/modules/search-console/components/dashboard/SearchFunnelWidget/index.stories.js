/**
 * SearchFunnelWidget Component Stories.
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
import { CORE_USER } from '../../../../../googlesitekit/datastore/user/constants';
import {
	provideModules,
	provideSiteInfo,
} from '../../../../../../../tests/js/utils';
import { withWidgetComponentProps } from '../../../../../googlesitekit/widgets/util';
import WithRegistrySetup from '../../../../../../../tests/js/WithRegistrySetup';
import SearchFunnelWidget from './index';
import { provideSearchConsoleMockReport } from '../../../util/data-mock';
import { provideAnalyticsMockReport } from '../../../../analytics/util/data-mock';

const WidgetWithComponentProps = withWidgetComponentProps( 'widget-slug' )(
	SearchFunnelWidget
);

const Template = ( { setupRegistry, ...args } ) => (
	<WithRegistrySetup func={ setupRegistry }>
		<WidgetWithComponentProps { ...args } />
	</WithRegistrySetup>
);

export const Ready = Template.bind( {} );
Ready.storyName = 'Ready';
Ready.args = {
	setupRegistry: ( registry ) => {
		provideSearchConsoleMockReport( registry, {
			startDate: '2021-08-18',
			endDate: '2021-10-12',
			dimensions: 'date',
		} );
		provideAnalyticsMockReport( registry, {
			startDate: '2021-09-15',
			endDate: '2021-10-12',
			compareStartDate: '2021-08-18',
			compareEndDate: '2021-09-14',
			metrics: [
				{
					expression: 'ga:goalCompletionsAll',
					alias: 'Goal Completions',
				},
				'ga:bounceRate',
			],
		} );
		provideAnalyticsMockReport( registry, {
			startDate: '2021-09-15',
			endDate: '2021-10-12',
			compareStartDate: '2021-08-18',
			compareEndDate: '2021-09-14',
			dimensions: 'ga:date',
			metrics: [
				{
					expression: 'ga:goalCompletionsAll',
					alias: 'Goal Completions',
				},
				'ga:bounceRate',
			],
		} );
		provideAnalyticsMockReport( registry, {
			startDate: '2021-09-15',
			endDate: '2021-10-12',
			compareStartDate: '2021-08-18',
			compareEndDate: '2021-09-14',
			metrics: [
				{
					expression: 'ga:users',
					alias: 'Total Users',
				},
			],
			dimensions: [ 'ga:channelGrouping' ],
			dimensionFilters: { 'ga:channelGrouping': 'Organic Search' },
		} );
		provideAnalyticsMockReport( registry, {
			startDate: '2021-09-15',
			endDate: '2021-10-12',
			compareStartDate: '2021-08-18',
			compareEndDate: '2021-09-14',
			metrics: [
				{
					expression: 'ga:users',
					alias: 'Total Users',
				},
			],
			dimensions: [ 'ga:date', 'ga:channelGrouping' ],
			dimensionFilters: { 'ga:channelGrouping': 'Organic Search' },
		} );
	},
};

export default {
	title: 'Modules/SearchConsole/Widgets/SearchFunnelWidget',
	decorators: [
		( Story ) => (
			<div className="googlesitekit-widget">
				<div className="googlesitekit-widget__body">
					<Story />
				</div>
			</div>
		),
		( Story, { args } ) => {
			const setupRegistry = ( registry ) => {
				provideSiteInfo( registry );
				registry.dispatch( CORE_USER ).setReferenceDate( '2021-10-13' );

				provideModules( registry, [
					{
						active: true,
						connected: true,
						slug: 'search-console',
					},
					{
						active: true,
						connected: true,
						slug: 'analytics',
					},
				] );

				// Call story-specific setup.
				args.setupRegistry( registry );
			};

			return (
				<WithRegistrySetup func={ setupRegistry }>
					<Story />
				</WithRegistrySetup>
			);
		},
	],
};
