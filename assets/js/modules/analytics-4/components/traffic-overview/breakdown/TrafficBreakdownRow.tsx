/**
 * Traffic Overview breakdown row.
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
import {
	SIZE_MEDIUM,
	TYPE_BODY,
	TYPE_LABEL,
} from '@/js/components/Typography/constants';
import { numFmt } from '@/js/util';

export interface TrafficBreakdownRowProps {
	/** The dimension value, rendered exactly as GA4 returned it. */
	label: string;
	/** The row's share of the column's total, as a `0`–`1` fraction. */
	percentage: number;
}

const TrafficBreakdownRow: FC< TrafficBreakdownRowProps > = ( {
	label,
	percentage,
} ) => {
	return (
		<div className="googlesitekit-traffic-overview__breakdown-row">
			<Typography
				type={ TYPE_LABEL }
				size={ SIZE_MEDIUM }
				className="googlesitekit-traffic-overview__breakdown-row-label"
			>
				{ label }
			</Typography>
			<Typography
				type={ TYPE_BODY }
				size={ SIZE_MEDIUM }
				className="googlesitekit-traffic-overview__breakdown-row-percentage"
			>
				{ numFmt( percentage, {
					style: 'percent',
					maximumFractionDigits: 0,
				} ) }
			</Typography>
		</div>
	);
};

export default TrafficBreakdownRow;
