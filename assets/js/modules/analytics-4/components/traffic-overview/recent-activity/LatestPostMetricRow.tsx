/**
 * Recent activity latest post metric row.
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
import classnames from 'classnames';
import { FC } from 'react';

/**
 * Internal dependencies
 */
import PreviewBlock from '@/js/components/PreviewBlock';
import LatestPostReportError from './LatestPostReportError';

interface LatestPostMetricRowProps {
	/** The name of the metric, e.g. `Total visitors`. */
	label: string;
	/** The metric value, already formatted, e.g. `1m 16s`. */
	value?: string;
	/** Whether the metric's report is loading. */
	loading?: boolean;
	/** The error of the metric's report, which the row renders in place of the value. */
	error?: object;
	/** The module the metric's report comes from. Defaults to Analytics. */
	moduleSlug?: string;
}

const LatestPostMetricRow: FC< LatestPostMetricRowProps > = ( {
	label,
	value,
	loading = false,
	error,
	moduleSlug,
} ) => {
	const hasError = ! loading && !! error;

	return (
		<div
			className={ classnames( 'googlesitekit-table-tile__row', {
				'googlesitekit-traffic-overview__latest-post-row--error':
					hasError,
			} ) }
		>
			<div className="googlesitekit-table-tile__cell googlesitekit-table-tile__cell--label">
				{ label }
			</div>
			{ hasError ? (
				<LatestPostReportError
					error={ error }
					moduleSlug={ moduleSlug }
				/>
			) : (
				<div className="googlesitekit-table-tile__cell googlesitekit-table-tile__cell--value">
					{ loading ? (
						<PreviewBlock width="48px" height="18px" />
					) : (
						value
					) }
				</div>
			) }
		</div>
	);
};

export default LatestPostMetricRow;
