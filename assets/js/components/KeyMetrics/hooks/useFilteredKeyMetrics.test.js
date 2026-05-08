/**
 * Hook useFilteredKeyMetrics tests.
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
 * Internal dependencies
 */
import { renderHook } from '../../../../../tests/js/test-utils';
import useFilteredKeyMetrics from './useFilteredKeyMetrics';
import {
	KEY_METRICS_GROUP_CURRENT,
	KEY_METRICS_GROUP_SUGGESTED,
	KEY_METRICS_GROUP_VISITORS,
} from '@/js/components/KeyMetrics/constants';

describe( 'useFilteredKeyMetrics', () => {
	const allMetricItems = {
		metricA: { group: KEY_METRICS_GROUP_VISITORS.SLUG },
		metricB: { group: KEY_METRICS_GROUP_VISITORS.SLUG },
		metricC: { group: KEY_METRICS_GROUP_SUGGESTED.SLUG },
	};

	it( 'filters active metrics by current group using effective selection', () => {
		const { result } = renderHook( () =>
			useFilteredKeyMetrics( {
				allMetricItems,
				isActive: KEY_METRICS_GROUP_CURRENT.SLUG,
				effectiveSelection: [ 'metricA' ],
				answerBasedMetrics: [],
				selectedMetrics: [ 'metricA' ],
				newBadgeEvents: [],
				conversionReportingEventWidgets: {},
			} )
		);

		expect( Object.keys( result.current.activeMetricItems ) ).toEqual( [
			'metricA',
		] );
		expect( result.current.selectedCounts ).toEqual(
			expect.objectContaining( {
				[ KEY_METRICS_GROUP_CURRENT.SLUG ]: 0,
				[ KEY_METRICS_GROUP_VISITORS.SLUG ]: 1,
			} )
		);
	} );

	it( 'includes answer-based metrics for suggested group', () => {
		const { result } = renderHook( () =>
			useFilteredKeyMetrics( {
				allMetricItems,
				isActive: KEY_METRICS_GROUP_SUGGESTED.SLUG,
				effectiveSelection: [],
				answerBasedMetrics: [ 'metricC' ],
				selectedMetrics: [],
				newBadgeEvents: [],
				conversionReportingEventWidgets: {},
			} )
		);

		expect( Object.keys( result.current.activeMetricItems ) ).toEqual( [
			'metricC',
		] );
	} );

	it( 'marks newly detected metrics based on new badge events', () => {
		const { result } = renderHook( () =>
			useFilteredKeyMetrics( {
				allMetricItems,
				isActive: KEY_METRICS_GROUP_VISITORS.SLUG,
				effectiveSelection: [],
				answerBasedMetrics: [],
				selectedMetrics: [],
				newBadgeEvents: [ 'purchase' ],
				conversionReportingEventWidgets: { purchase: [ 'metricB' ] },
			} )
		);

		expect( result.current.newlyDetectedMetrics ).toEqual( {
			[ KEY_METRICS_GROUP_VISITORS.SLUG ]: [ 'metricB' ],
		} );
	} );
} );
