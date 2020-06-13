/**
 * PageSpeed Insights Lab Data report metrics component.
 *
 * Site Kit by Google, Copyright 2020 Google LLC
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
import PropTypes from 'prop-types';

/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import ReportMetric from './ReportMetric';
import { getScoreCategory } from '../dashboard/util';
import Link from '../../../components/link';
import { sanitizeHTML } from '../../../util';

export default function LabReportMetrics( { data } ) {
	const totalBlockingTime = data?.lighthouseResult?.audits?.[ 'total-blocking-time' ];
	const largestContentfulPaint = data?.lighthouseResult?.audits?.[ 'largest-contentful-paint' ];
	const cumulativeLayoutShift = data?.lighthouseResult?.audits?.[ 'cumulative-layout-shift' ];

	if ( ! totalBlockingTime || ! largestContentfulPaint || ! cumulativeLayoutShift ) {
		return null;
	}

	return (
		<div className="googlesitekit-layout googlesitekit-pagespeed-insights-web-vitals-metrics">
			<div>
				<p>
					{ __( 'Lab data is useful for debugging performance issues, as it is collected in a controlled environment.', 'google-site-kit' ) }
					{ ' ' }
					<Link
						href="https://web.dev/user-centric-performance-metrics/#in-the-lab"
						external
						inherit
						dangerouslySetInnerHTML={ sanitizeHTML(
							__( 'Learn more<span class="screen-reader-text"> about lab data.</span>', 'google-site-kit' ),
							{
								ALLOWED_TAGS: [ 'span' ],
								ALLOWED_ATTR: [ 'class' ],
							}
						) }
					/>
				</p>
			</div>
			<table>
				<thead>
					<tr>
						<th>
							{ __( 'Metric Name', 'google-site-kit' ) }
						</th>
						<th>
							{ __( 'Metric Value', 'google-site-kit' ) }
						</th>
					</tr>
				</thead>
				<tbody>
					<ReportMetric
						title={ __( 'Total Blocking Time', 'google-site-kit' ) }
						description={ __( 'Sum of all time periods between FCP and Time to Interactive, when task length exceeded 50ms.', 'google-site-kit' ) }
						displayValue={ totalBlockingTime.displayValue }
						category={ getScoreCategory( totalBlockingTime.score ) }
					/>
					<ReportMetric
						title={ __( 'Largest Contentful Paint', 'google-site-kit' ) }
						description={ __( 'Marks the time at which the largest text or image is painted.', 'google-site-kit' ) }
						displayValue={ largestContentfulPaint.displayValue }
						category={ getScoreCategory( largestContentfulPaint.score ) }
					/>
					<ReportMetric
						title={ __( 'Cumulative Layout Shift', 'google-site-kit' ) }
						description={ __( 'Measures the movement of visible elements within the viewport.', 'google-site-kit' ) }
						displayValue={ cumulativeLayoutShift.displayValue }
						category={ getScoreCategory( cumulativeLayoutShift.score ) }
					/>
				</tbody>
			</table>
			<div>
				<p>
					{ __( 'View details at', 'google-site-kit' ) }
					{ ' ' }
					<Link
						href="https://developers.google.com/speed/pagespeed/insights/"
						external
						inherit
						dangerouslySetInnerHTML={ sanitizeHTML(
							__( 'PageSpeed Insights<span class="screen-reader-text"> PageSpeed Insights.</span>', 'google-site-kit' ),
							{
								ALLOWED_TAGS: [ 'span' ],
								ALLOWED_ATTR: [ 'class' ],
							}
						) }
					/>
				</p>
			</div>
		</div>
	);
}

LabReportMetrics.propTypes = {
	data: PropTypes.object.isRequired,
};
