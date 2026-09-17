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
import { FC } from 'react';

/**
 * Internal dependencies
 */
import Typography from '@/js/components/Typography';
import { SIZE_SMALL, TYPE_BODY } from '@/js/components/Typography/constants';

interface ChartLegendItem {
	/** The name of the line, such as "Last 28 days traffic". */
	label: string;
	/** The color of the line. The legend shows the same color beside the label. */
	color: string;
}

export interface ChartLegendProps {
	/** One item for each line the chart draws. */
	items: ChartLegendItem[];
}

const ChartLegend: FC< ChartLegendProps > = ( { items } ) => {
	return (
		<ul className="googlesitekit-traffic-overview__chart-legend">
			{ items.map( ( { label, color } ) => (
				<li
					key={ label }
					className="googlesitekit-traffic-overview__chart-legend-item"
				>
					<span
						className="googlesitekit-traffic-overview__chart-legend-line"
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
				</li>
			) ) }
		</ul>
	);
};

export default ChartLegend;
