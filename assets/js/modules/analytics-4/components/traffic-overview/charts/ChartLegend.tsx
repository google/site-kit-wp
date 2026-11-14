/**
 * Traffic Overview chart legend.
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
import { FC, ReactNode } from 'react';

/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import Badge from '@/js/components/Badge';
import { BADGE_VARIANTS } from '@/js/components/Badge/constants';
import InfoTooltip from '@/js/components/InfoTooltip';
import Typography from '@/js/components/Typography';
import { SIZE_SMALL, TYPE_BODY } from '@/js/components/Typography/constants';

/**
 * One thing the chart draws, as the legend lists it.
 *
 * @since 1.189.0
 * @since 1.192.0 Interface changed from local to exported, for `getTrafficLegendItem()`.
 * @since n.e.x.t Added the `swatch`, `info` and `isBeta` properties.
 */
export interface ChartLegendItem {
	/** The name of what the chart draws, such as "Last 28 days traffic". */
	label: string;
	/** The color the chart draws it in. The legend shows the same color beside the label. */
	color: string;
	/** The shape the legend shows the color in: `line` for a line, `area` for a band, and `dot` for a point. Defaults to `line`. */
	swatch?: 'line' | 'area' | 'dot';
	/** What the item stands for, in a tooltip on an info icon after the label. */
	info?: ReactNode;
	/** Whether the item shows a "Beta" badge at its end. */
	isBeta?: boolean;
}

export interface ChartLegendProps {
	/** One item for each thing the chart draws. */
	items: ChartLegendItem[];
}

const ChartLegend: FC< ChartLegendProps > = ( { items } ) => {
	return (
		<ul className="googlesitekit-traffic-overview__chart-legend">
			{ items.map(
				( { label, color, swatch = 'line', info, isBeta } ) => (
					<li
						key={ label }
						className="googlesitekit-traffic-overview__chart-legend-item"
					>
						<span
							className={ `googlesitekit-traffic-overview__chart-legend-${ swatch }` }
							style={ { backgroundColor: color } }
						/>
						<Typography
							as="span"
							type={ TYPE_BODY }
							size={ SIZE_SMALL }
							className="googlesitekit-traffic-overview__chart-legend-label"
						>
							{ label }
						</Typography>
						{ info && (
							<InfoTooltip
								title={ info }
								tooltipClassName="googlesitekit-traffic-overview__chart-legend-tooltip"
							/>
						) }
						{ isBeta && (
							<Badge
								className="googlesitekit-traffic-overview__chart-legend-badge"
								label={ __( 'Beta', 'google-site-kit' ) }
								variant={ BADGE_VARIANTS.ANNOUNCEMENT }
							/>
						) }
					</li>
				)
			) }
		</ul>
	);
};

export default ChartLegend;
