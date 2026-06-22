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

interface KeyActionTilesProps {
	// Whether the "Other sources" tab is active; it shows only the total, since
	// unattributed events have no per-source sessions to compute a rate against.
	isOtherSourcesTab: boolean;
	supportURL: string;
	rateTitle: string;
	totalTitle: string;
	totalSubtitle: string;
	currentRate: number;
	previousRate: number;
	currentSessions: number;
	// Counts for a value tab (the goal's primary event, scoped to the tab).
	currentCount: number;
	previousCount: number;
	// Counts for the "Other sources" tab (unattributed events).
	otherSourcesCount: number;
	otherSourcesPreviousCount: number;
}

// Renders the Key action rate and total tiles, shared by the Site Goals
// widgets. The parent supplies all copy (titles/subtitle) so this stays
// presentational.
const KeyActionTiles: FC< KeyActionTilesProps > = ( {
	isOtherSourcesTab,
	supportURL,
	rateTitle,
	totalTitle,
	totalSubtitle,
	currentRate,
	previousRate,
	currentSessions,
	currentCount,
	previousCount,
	otherSourcesCount,
	otherSourcesPreviousCount,
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
	</Fragment>
);

export default KeyActionTiles;
