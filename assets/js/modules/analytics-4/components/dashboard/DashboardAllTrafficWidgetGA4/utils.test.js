/**
 * DashboardAllTrafficWidgetGA4 utility function tests.
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
import { withNoHooksAllowed } from '@/js/util/withNoHooksAllowed';
import { createZeroDataRow, getTooltipHelp } from './utils';

describe( 'createZeroDataRow', () => {
	it( 'should return a row with the given date and a zero for the metric value', () => {
		const date = '2021-01-01';
		const row = createZeroDataRow( date );

		expect( row ).toEqual( {
			dimensionValues: [
				{
					value: '20210101',
				},
			],
			metricValues: [
				{
					value: 0,
				},
			],
		} );
	} );
} );

describe( 'getTooltipHelp', () => {
	// See https://github.com/google/site-kit-wp/issues/11359
	it( 'does not use hooks internally', () => {
		withNoHooksAllowed( getTooltipHelp )(
			'https://example.com',
			'Test',
			'Test label'
		);
	} );
} );
