/**
 * Site Goals Key action tiles.
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
 * External dependencies
 */
import { FC } from 'react';

/**
 * WordPress dependencies
 */
import { Fragment, createInterpolateElement } from '@wordpress/element';
import { __, sprintf } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import { Tile } from '@/js/modules/analytics-4/components/site-goals/components/Tile';
import {
	NUMBER_FORMAT,
	PERCENT_FORMAT,
} from '@/js/modules/analytics-4/components/site-goals/utils/formats';
import { numFmt } from '@/js/util';
import KeyActionChartTile, {
	KeyActionChartTileProps,
} from './KeyActionChartTile';

interface KeyActionTilesProps
	extends Pick<
		KeyActionChartTileProps,
		'dates' | 'eventNames' | 'goalType' | 'breakdownFilter'
	> {
	/**
	 * Whether the "Other sources" tab is active. That tab shows the total tile
	 * alone, because unattributed events have no per-source sessions to measure
	 * a rate against.
	 */
	isOtherSourcesTab: boolean;
	/** The URL the rate tile's info tooltip links to. */
	supportURL: string;
	/** The rate tile's title. */
	rateTitle: string;
	/** The total tile's title. */
	totalTitle: string;
	/** The line under the total, which names the event. */
	totalSubtitle: string;
	/** The chart tile's title. */
	chartTitle: string;
	/** The Key action's rate over the selected date range. */
	currentRate: number;
	/** The Key action's rate over the period before the selected date range. */
	previousRate: number;
	/** The total sessions the rate is a share of. */
	currentSessions: number;
	/** The Key action's count on a value tab, over the selected date range. */
	currentCount: number;
	/** The Key action's count on a value tab, over the period before the selected date range. */
	previousCount: number;
	/** The unattributed count, which the "Other sources" tab shows in place of `currentCount`. */
	otherSourcesCount: number;
	/** The unattributed count over the period before the selected date range. */
	otherSourcesPreviousCount: number;
}

const KeyActionTiles: FC< KeyActionTilesProps > = ( {
	isOtherSourcesTab,
	supportURL,
	rateTitle,
	totalTitle,
	totalSubtitle,
	chartTitle,
	currentRate,
	previousRate,
	currentSessions,
	currentCount,
	previousCount,
	otherSourcesCount,
	otherSourcesPreviousCount,
	dates,
	eventNames,
	goalType,
	breakdownFilter,
} ) => (
	<Fragment>
		{ ! isOtherSourcesTab && (
			<Tile
				title={ rateTitle }
				subtitle={ sprintf(
					/* translators: %s: formatted number of total sessions */
					__( 'of %s total sessions', 'google-site-kit' ),
					numFmt( currentSessions, NUMBER_FORMAT )
				) }
				infoTooltip={ createInterpolateElement(
					__(
						'The percentage of total visitors who successfully completed a key action (like making a purchase or filling out a form). <a>Learn more</a>',
						'google-site-kit'
					),
					{
						a: (
							// Content is supplied by createInterpolateElement.
							// eslint-disable-next-line jsx-a11y/anchor-has-content
							<a
								href={ supportURL }
								target="_blank"
								rel="noreferrer noopener"
							/>
						),
					}
				) }
				currentValue={ currentRate }
				previousValue={ previousRate }
				format={ PERCENT_FORMAT }
				primary
			/>
		) }

		<Tile
			title={ totalTitle }
			subtitle={ totalSubtitle }
			currentValue={
				isOtherSourcesTab ? otherSourcesCount : currentCount
			}
			previousValue={
				isOtherSourcesTab ? otherSourcesPreviousCount : previousCount
			}
			format={ NUMBER_FORMAT }
		/>

		{ ! isOtherSourcesTab && (
			<KeyActionChartTile
				title={ chartTitle }
				dates={ dates }
				eventNames={ eventNames }
				goalType={ goalType }
				breakdownFilter={ breakdownFilter }
			/>
		) }
	</Fragment>
);

export default KeyActionTiles;
