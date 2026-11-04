/**
 * Recent activity fresh metric.
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
import PreviewBlock from '@/js/components/PreviewBlock';
import Typography from '@/js/components/Typography';
import {
	SIZE_LARGE,
	SIZE_MEDIUM,
	TYPE_DISPLAY,
} from '@/js/components/Typography/constants';
import P from '@/js/components/Typography/P';
import { numFmt } from '@/js/util';

export interface FreshMetricProps {
	/** The name of the figure, shown under it, e.g. `Total visitors`. */
	label: string;
	/** The figure, or `undefined` while its report loads. */
	value?: number;
}

const FreshMetric: FC< FreshMetricProps > = ( { label, value } ) => {
	return (
		<div className="googlesitekit-traffic-overview__fresh-metric">
			{ value === undefined ? (
				<PreviewBlock width="96px" height="64px" />
			) : (
				<Typography as="span" type={ TYPE_DISPLAY } size={ SIZE_LARGE }>
					{ numFmt( value ) }
				</Typography>
			) }
			<P
				size={ SIZE_MEDIUM }
				className="googlesitekit-traffic-overview__fresh-metric-label"
			>
				{ label }
			</P>
		</div>
	);
};

export default FreshMetric;
