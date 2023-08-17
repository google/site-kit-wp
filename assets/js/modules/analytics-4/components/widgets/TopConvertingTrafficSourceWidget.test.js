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

describe( 'TopConvertingTrafficSourceWidget', () => {
	const { Widget, WidgetNull } = getWidgetComponentProps(
		KM_ANALYTICS_TOP_CONVERTING_TRAFFIC_SOURCE
	);

	it( 'renders correctly with the expected metrics', async () => {
		const { container, waitForRegistry } = render(
			<TopConvertingTrafficSourceWidget
				Widget={ Widget }
				WidgetNull={ WidgetNull }
			/>,
			{
				setupRegistry: ( registry ) => {
					registry
						.dispatch( CORE_USER )
						.setReferenceDate( '2020-09-08' );

					provideModules( registry, [
						{
							slug: 'analytics-4',
							active: true,
							connected: true,
						},
					] );
					provideKeyMetrics( registry );
					provideAnalytics4MockReport( registry, {
						compareStartDate: '2020-07-14',
						compareEndDate: '2020-08-10',
						startDate: '2020-08-11',
						endDate: '2020-09-07',
						dimensions: [ 'sessionDefaultChannelGroup' ],
						metrics: [
							{
								name: 'sessionConversionRate',
							},
						],
						limit: 1,
						orderBy: 'sessionConversionRate',
					} );
				},
			}
		);
		await waitForRegistry();

		expect( container ).toMatchSnapshot();
	} );
} );
