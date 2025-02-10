/**
 * TopCategoriesWidget component tests.
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
import { render } from '../../../../../../tests/js/test-utils';
import {
	createTestRegistry,
	provideKeyMetrics,
	provideModules,
	provideUserAuthentication,
} from '../../../../../../tests/js/utils';
import { provideAnalytics4MockReport } from '../../utils/data-mock';
import { getWidgetComponentProps } from '../../../../googlesitekit/widgets/util';
import {
	CORE_USER,
	KM_ANALYTICS_TOP_CATEGORIES,
	KM_ANALYTICS_TOP_CITIES,
} from '../../../../googlesitekit/datastore/user/constants';
import { KEY_METRICS_WIDGETS } from '../../../../components/KeyMetrics/key-metrics-widgets';
import {
	DATE_RANGE_OFFSET,
	MODULES_ANALYTICS_4,
} from '../../datastore/constants';
import TopCategoriesWidget from './TopCategoriesWidget';

describe( 'TopCategoriesWidget', () => {
	const { Widget } = getWidgetComponentProps( KM_ANALYTICS_TOP_CITIES );

	let registry;
	beforeEach( () => {
		registry = createTestRegistry();
		registry.dispatch( CORE_USER ).setReferenceDate( '2020-09-08' );
		registry.dispatch( MODULES_ANALYTICS_4 ).receiveGetSettings( {
			availableCustomDimensions:
				KEY_METRICS_WIDGETS[ KM_ANALYTICS_TOP_CATEGORIES ]
					.requiredCustomDimensions,
		} );
		registry
			.dispatch( MODULES_ANALYTICS_4 )
			.receiveIsGatheringData( false );
		registry
			.dispatch( MODULES_ANALYTICS_4 )
			.receiveIsCustomDimensionGatheringData(
				KEY_METRICS_WIDGETS[ KM_ANALYTICS_TOP_CATEGORIES ]
					.requiredCustomDimensions[ 0 ],
				false
			);

		provideUserAuthentication( registry );
		provideModules( registry, [
			{
				slug: 'analytics-4',
				active: true,
				connected: true,
			},
		] );
		provideKeyMetrics( registry );
	} );

	it( 'renders correctly with the expected metrics', async () => {
		provideAnalytics4MockReport( registry, {
			...registry.select( CORE_USER ).getDateRangeDates( {
				offsetDays: DATE_RANGE_OFFSET,
			} ),
			dimensions: [ 'customEvent:googlesitekit_post_categories' ],
			dimensionFilters: {
				'customEvent:googlesitekit_post_categories': {
					filterType: 'emptyFilter',
					value: '',
					notExpression: false,
				},
			},
			metrics: [ { name: 'screenPageViews' } ],
			orderby: [
				{
					metric: {
						metricName: 'screenPageViews',
					},
					desc: true,
				},
			],
			limit: 3,
		} );

		const { container, waitForRegistry } = render(
			<TopCategoriesWidget
				widgetSlug={ KM_ANALYTICS_TOP_CATEGORIES }
				Widget={ Widget }
			/>,
			{ registry }
		);
		await waitForRegistry();

		expect( container ).toMatchSnapshot();
	} );
} );
