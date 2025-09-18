/**
 * The useKeyMetricsGroups hook.
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
import { ENUM_CONVERSION_EVENTS } from '@/js/modules/analytics-4/datastore/constants';
import {
	KEY_METRICS_GROUP_CURRENT,
	KEY_METRICS_GROUP_SUGGESTED,
	KEY_METRICS_GROUP_CONTENT_PERFORMANCE,
	KEY_METRICS_GROUP_DRIVING_TRAFFIC,
	KEY_METRICS_GROUP_GENERATING_LEADS,
	KEY_METRICS_GROUP_SELLING_PRODUCTS,
	KEY_METRICS_GROUP_VISITORS,
} from '@/js/components/KeyMetrics/constants';

/**
 * Computes the key metrics groups and supporting flags for tailoring.
 *
 * @since n.e.x.t
 *
 * @param {Object}  args                       Arguments.
 * @param {Array}   args.detectedEvents        Detected GA4 events.
 * @param {Array}   args.currentlyActiveEvents Currently active events from settings/user picks.
 * @param {boolean} args.isUserInputCompleted  Whether user input is completed.
 * @param {Array}   args.answerBasedMetrics    Tailored metrics based on answers/events.
 * @return {Object}                            Object with `hasGeneratingLeadsGroup`, `hasSellingProductsGroup`, `keyMetricsGroups`, and `dynamicGroups`.
 */
export default function useKeyMetricsGroups( {
	detectedEvents = [],
	currentlyActiveEvents = [],
	isUserInputCompleted,
	answerBasedMetrics = [],
} ) {
	const hasGeneratingLeadsGroup = [
		ENUM_CONVERSION_EVENTS.SUBMIT_LEAD_FORM,
		ENUM_CONVERSION_EVENTS.CONTACT,
		ENUM_CONVERSION_EVENTS.GENERATE_LEAD,
	].filter(
		( item ) =>
			detectedEvents?.includes( item ) ||
			currentlyActiveEvents?.includes( item )
	);

	const hasSellingProductsGroup = [
		ENUM_CONVERSION_EVENTS.ADD_TO_CART,
		ENUM_CONVERSION_EVENTS.PURCHASE,
	].filter(
		( item ) =>
			detectedEvents?.includes( item ) ||
			currentlyActiveEvents?.includes( item )
	);

	const keyMetricsGroups = useMemo( () => {
		return [
			KEY_METRICS_GROUP_VISITORS,
			KEY_METRICS_GROUP_DRIVING_TRAFFIC,
			...( hasGeneratingLeadsGroup?.length
				? [ KEY_METRICS_GROUP_GENERATING_LEADS ]
				: [] ),
			...( hasSellingProductsGroup?.length
				? [ KEY_METRICS_GROUP_SELLING_PRODUCTS ]
				: [] ),
			KEY_METRICS_GROUP_CONTENT_PERFORMANCE,
		];
	}, [ hasGeneratingLeadsGroup, hasSellingProductsGroup ] );

	const dynamicGroups = useMemo( () => {
		if ( isUserInputCompleted && answerBasedMetrics?.length ) {
			return [ KEY_METRICS_GROUP_CURRENT, KEY_METRICS_GROUP_SUGGESTED ];
		}

		return [ KEY_METRICS_GROUP_CURRENT ];
	}, [ isUserInputCompleted, answerBasedMetrics ] );

	return {
		hasGeneratingLeadsGroup,
		hasSellingProductsGroup,
		keyMetricsGroups,
		dynamicGroups,
	};
}
