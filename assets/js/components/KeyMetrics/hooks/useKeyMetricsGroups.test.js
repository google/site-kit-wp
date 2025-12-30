/**
 * Hook useKeyMetricsGroups tests.
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
import useKeyMetricsGroups from './useKeyMetricsGroups';
import {
	KEY_METRICS_GROUP_CURRENT,
	KEY_METRICS_GROUP_SUGGESTED,
	KEY_METRICS_GROUP_GENERATING_LEADS,
	KEY_METRICS_GROUP_SELLING_PRODUCTS,
} from '@/js/components/KeyMetrics/constants';

describe( 'useKeyMetricsGroups', () => {
	it( 'includes generating leads group when lead events are present', () => {
		const { result } = renderHook( () =>
			useKeyMetricsGroups( {
				detectedEvents: [ 'contact' ],
				currentlyActiveEvents: [],
				isUserInputCompleted: true,
				answerBasedMetrics: [ 'foo' ],
			} )
		);

		expect( result.current.keyMetricsGroups ).toEqual(
			expect.arrayContaining( [ KEY_METRICS_GROUP_GENERATING_LEADS ] )
		);
	} );

	it( 'includes selling products group when purchase events are present', () => {
		const { result } = renderHook( () =>
			useKeyMetricsGroups( {
				detectedEvents: [ 'purchase' ],
				currentlyActiveEvents: [],
				isUserInputCompleted: false,
				answerBasedMetrics: [],
			} )
		);

		expect( result.current.keyMetricsGroups ).toEqual(
			expect.arrayContaining( [ KEY_METRICS_GROUP_SELLING_PRODUCTS ] )
		);
	} );

	it( 'returns both current and suggested as dynamic groups when user input completed and there are answer-based metrics', () => {
		const { result } = renderHook( () =>
			useKeyMetricsGroups( {
				detectedEvents: [],
				currentlyActiveEvents: [],
				isUserInputCompleted: true,
				answerBasedMetrics: [ 'metric-a' ],
			} )
		);

		expect( result.current.dynamicGroups ).toEqual( [
			KEY_METRICS_GROUP_CURRENT,
			KEY_METRICS_GROUP_SUGGESTED,
		] );
	} );

	it( 'returns only current as dynamic group when user input is not completed or no answer-based metrics', () => {
		const { result } = renderHook( () =>
			useKeyMetricsGroups( {
				detectedEvents: [],
				currentlyActiveEvents: [],
				isUserInputCompleted: false,
				answerBasedMetrics: [],
			} )
		);

		expect( result.current.dynamicGroups ).toEqual( [
			KEY_METRICS_GROUP_CURRENT,
		] );
	} );
} );
