/**
 * TopConvertingTrafficSourceWidget component tests.
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
	KM_ANALYTICS_TOP_CONVERTING_TRAFFIC_SOURCE,
} from '../../../../googlesitekit/datastore/user/constants';
import TopConvertingTrafficSourceWidget from './TopConvertingTrafficSourceWidget';
import { withConnected } from '../../../../googlesitekit/modules/datastore/__fixtures__';
import { DATE_RANGE_OFFSET } from '../../datastore/constants';

describe( 'TopConvertingTrafficSourceWidget', () => {
	const { Widget, WidgetNull } = getWidgetComponentProps(
		KM_ANALYTICS_TOP_CONVERTING_TRAFFIC_SOURCE
	);

	it( 'renders correctly with the expected metrics', async () => {
		const registry = createTestRegistry();
		registry.dispatch( CORE_USER ).setReferenceDate( '2020-09-08' );
		provideKeyMetrics( registry );
		provideModules( registry, withConnected( 'analytics-4' ) );
		provideAnalytics4MockReport( registry, {
			...registry.select( CORE_USER ).getDateRangeDates( {
				offsetDays: DATE_RANGE_OFFSET,
				compare: true,
			} ),
			dimensions: [ 'sessionDefaultChannelGroup' ],
			metrics: [
				{
					name: 'sessionConversionRate',
				},
			],
			limit: 1,
			orderBy: 'sessionConversionRate',
		} );
		const { container, waitForRegistry } = render(
			<TopConvertingTrafficSourceWidget
				Widget={ Widget }
				WidgetNull={ WidgetNull }
			/>,
			{
				registry,
			}
		);
		await waitForRegistry();

		expect( container ).toMatchSnapshot();
	} );
} );
