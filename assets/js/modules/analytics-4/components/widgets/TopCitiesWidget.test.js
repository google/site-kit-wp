/**
 * TopCitiesWidget component tests.
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
} from '../../../../../../tests/js/utils';
import { provideAnalytics4MockReport } from '../../utils/data-mock';
import { getWidgetComponentProps } from '../../../../googlesitekit/widgets/util';
import {
	CORE_USER,
	KM_ANALYTICS_TOP_CITIES,
} from '../../../../googlesitekit/datastore/user/constants';
import TopCitiesWidget from './TopCitiesWidget';
import { DATE_RANGE_OFFSET } from '../../datastore/constants';
import { withConnected } from '../../../../googlesitekit/modules/datastore/__fixtures__';

describe( 'TopCitiesWidget', () => {
	const { Widget } = getWidgetComponentProps( KM_ANALYTICS_TOP_CITIES );

	it( 'renders correctly with the expected metrics', async () => {
		const registry = createTestRegistry();
		registry.dispatch( CORE_USER ).setReferenceDate( '2020-09-08' );
		provideKeyMetrics( registry );
		provideModules( registry, withConnected( 'analytics-4' ) );
		provideAnalytics4MockReport( registry, {
			...registry
				.select( CORE_USER )
				.getDateRangeDates( { offsetDays: DATE_RANGE_OFFSET } ),
			dimensions: [ 'city' ],
			metrics: [ { name: 'totalUsers' } ],
			orderby: [
				{
					metric: {
						metricName: 'totalUsers',
					},
					desc: true,
				},
			],
			limit: 4,
		} );
		const { container, waitForRegistry } = render(
			<TopCitiesWidget Widget={ Widget } />,
			{
				registry,
			}
		);
		await waitForRegistry();

		expect( container ).toMatchSnapshot();
	} );
} );
