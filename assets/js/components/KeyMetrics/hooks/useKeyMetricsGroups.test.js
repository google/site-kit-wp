/**
 * Hook useKeyMetricsGroups tests.
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
