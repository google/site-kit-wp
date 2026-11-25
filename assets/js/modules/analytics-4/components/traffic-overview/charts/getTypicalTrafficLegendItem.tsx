/**
 * Traffic Overview `getTypicalTrafficLegendItem` utility.
 *
 * Site Kit by Google, Copyright 2026 Google LLC
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
import { createInterpolateElement } from '@wordpress/element';
import { __, _n, sprintf } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import DocumentationLink from '@/js/components/DocumentationLink';
import { TypicalChartLegendItem } from './TypicalChartLegend';
import { TYPICAL_TRAFFIC_RANGE_COLOR } from './typicalTrafficChartOptions';

interface TypicalTrafficRangeHistory {
	/** The number of days of traffic the band of the range's last day is fitted on. */
	referenceDays?: number | null;
	/** Whether the site's history reaches the same time last year. */
	lastYearAvailable?: boolean;
}

/**
 * Gets the text of the band's tooltip: what the typical range is, and how
 * much of the site's traffic it is based on.
 *
 * @since n.e.x.t
 *
 * @param {number}  weeks                     The whole weeks of traffic the band is fitted on.
 * @param {Object}  options                   The rest of the band's history.
 * @param {boolean} options.lastYearAvailable Whether the site's history reaches the same time last year.
 * @return {string} The text, with `<a>` around the words of the link.
 */
function getTypicalTrafficRangeInfo(
	weeks: number,
	{
		lastYearAvailable,
	}: Pick< TypicalTrafficRangeHistory, 'lastYearAvailable' >
): string {
	if ( lastYearAvailable ) {
		return sprintf(
			/* translators: %d: the number of whole weeks of the site's traffic the typical range is estimated from, such as "52" */
			_n(
				'Site Kit estimates a typical range from your traffic history, so you can see when visits are higher or lower than expected. Based on %d week of your traffic, including the same time last year. <a>Learn more</a>',
				'Site Kit estimates a typical range from your traffic history, so you can see when visits are higher or lower than expected. Based on %d weeks of your traffic, including the same time last year. <a>Learn more</a>',
				weeks,
				'google-site-kit'
			),
			weeks
		);
	}

	return sprintf(
		/* translators: %d: the number of whole weeks of the site's traffic the typical range is estimated from, such as "12" */
		_n(
			'Site Kit estimates a typical range from your traffic history, so you can see when visits are higher or lower than expected. Based on %d week of your traffic. <a>Learn more</a>',
			'Site Kit estimates a typical range from your traffic history, so you can see when visits are higher or lower than expected. Based on %d weeks of your traffic. <a>Learn more</a>',
			weeks,
			'google-site-kit'
		),
		weeks
	);
}

/**
 * Gets the legend item for the chart's band, the typical range of visits on
 * each day, with a tooltip that says how much of the site's traffic it is
 * based on.
 *
 * The tooltip names the history in whole weeks, rounded down, so it never
 * claims more history than the band read. It mentions last year only once the
 * site's history reaches the same time last year.
 *
 * @since n.e.x.t
 *
 * @param {Object}      history                     The history the band is fitted on.
 * @param {number|null} [history.referenceDays]     Optional. The number of days of traffic the band of the range's last day is fitted on. Without it, the item has no tooltip.
 * @param {boolean}     [history.lastYearAvailable] Optional. Whether the site's history reaches the same time last year. Default is `false`.
 * @return {Object} The legend item.
 */
export function getTypicalTrafficLegendItem( {
	referenceDays,
	lastYearAvailable = false,
}: TypicalTrafficRangeHistory ): TypicalChartLegendItem {
	const item: TypicalChartLegendItem = {
		label: __( 'Typical traffic range', 'google-site-kit' ),
		color: TYPICAL_TRAFFIC_RANGE_COLOR,
		swatch: 'area',
		isBeta: true,
	};

	if ( ! referenceDays ) {
		return item;
	}

	return {
		...item,
		info: createInterpolateElement(
			getTypicalTrafficRangeInfo( Math.floor( referenceDays / 7 ), {
				lastYearAvailable,
			} ),
			{
				a: <DocumentationLink slug="typical-traffic-range" />,
			}
		),
	};
}
