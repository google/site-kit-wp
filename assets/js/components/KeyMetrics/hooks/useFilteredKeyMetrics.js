/**
 * The useFilteredKeyMetrics hook.
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
 * WordPress dependencies
 */
import { useMemo } from '@wordpress/element';

/**
 * Internal dependencies
 */
import {
	KEY_METRICS_GROUP_CURRENT,
	KEY_METRICS_GROUP_SUGGESTED,
} from '@/js/components/KeyMetrics/constants';

/**
 * Filters and aggregates key metrics for the active group.
 *
 * @since 1.163.0
 *
 * @param {Object} args                                 Arguments.
 * @param {Object} args.allMetricItems                  All metric items keyed by slug.
 * @param {string} args.isActive                        Active group slug.
 * @param {Array}  args.effectiveSelection              Effective selection list.
 * @param {Array}  args.answerBasedMetrics              Tailored metrics for suggested group.
 * @param {Array}  args.selectedMetrics                 Currently selected metrics.
 * @param {Array}  args.newBadgeEvents                  Events that should show the "New" badge.
 * @param {Object} args.conversionReportingEventWidgets Mapping of event => [metric slugs].
 * @return {Object}                                     Object with `selectedCounts`, `activeMetricItems`, and `newlyDetectedMetrics`.
 */
export default function useFilteredKeyMetrics( {
	allMetricItems = {},
	isActive,
	effectiveSelection = [],
	answerBasedMetrics = [],
	selectedMetrics = [],
	newBadgeEvents = [],
	conversionReportingEventWidgets = {},
} ) {
	return useMemo( () => {
		// Currently selected group does not include total selected number, so it will always be 0.
		const selectedCounts = { [ KEY_METRICS_GROUP_CURRENT.SLUG ]: 0 };
		const activeMetricItems = {};
		const newlyDetectedMetrics = {};

		for ( const metricItemSlug in allMetricItems ) {
			const metricGroup = allMetricItems[ metricItemSlug ].group;
			if (
				metricGroup === isActive ||
				( isActive === KEY_METRICS_GROUP_CURRENT.SLUG &&
					effectiveSelection.includes( metricItemSlug ) )
			) {
				activeMetricItems[ metricItemSlug ] =
					allMetricItems[ metricItemSlug ];
			}

			if (
				isActive === KEY_METRICS_GROUP_SUGGESTED.SLUG &&
				answerBasedMetrics.includes( metricItemSlug )
			) {
				if ( answerBasedMetrics.includes( metricItemSlug ) ) {
					activeMetricItems[ metricItemSlug ] =
						allMetricItems[ metricItemSlug ];
				}
			}

			if ( ! selectedCounts[ metricGroup ] ) {
				const selectedCount = Object.keys( allMetricItems ).filter(
					( slug ) => {
						// Check if metric slug is in selectedMetrics, so the group count is reflected in real time as metrics are checked/unchecked.
						if (
							allMetricItems[ slug ].group === metricGroup &&
							selectedMetrics?.includes( slug )
						) {
							return true;
						}
						return false;
					}
				).length;
				selectedCounts[ metricGroup ] = selectedCount;
			}

			// Check if metric is conversion event related and if new badge should be included.
			if ( newBadgeEvents?.length ) {
				const isNewlyDetectedKeyMetrics = newBadgeEvents.some(
					( conversionEvent ) =>
						conversionReportingEventWidgets[
							conversionEvent
						].includes( metricItemSlug )
				);

				if ( isNewlyDetectedKeyMetrics ) {
					newlyDetectedMetrics[ metricGroup ] = [
						...( newlyDetectedMetrics[ metricGroup ] ?? [] ),
						metricItemSlug,
					];
				}
			}
		}

		return { selectedCounts, activeMetricItems, newlyDetectedMetrics };
	}, [
		allMetricItems,
		isActive,
		effectiveSelection,
		answerBasedMetrics,
		selectedMetrics,
		newBadgeEvents,
		conversionReportingEventWidgets,
	] );
}
