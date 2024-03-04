/**
 * PageSpeed Insights Lab Data report metrics component.
 *
 * Site Kit by Google, Copyright 2021 Google LLC
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
import { createInterpolateElement } from '@wordpress/element';
import { __, _x } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import ReportMetric from './ReportMetric';
import MetricsLearnMoreLink from './MetricsLearnMoreLink';
import { getScoreCategory } from '../../util';
import { getReportErrorMessage } from '../../../../util/errors';
import ReportErrorActions from '../../../../components/ReportErrorActions';
import ErrorText from '../../../../components/ErrorText';

export default function LabReportMetrics( { data, error } ) {
	const largestContentfulPaint =
		data?.lighthouseResult?.audits?.[ 'largest-contentful-paint' ];
	const cumulativeLayoutShift =
		data?.lighthouseResult?.audits?.[ 'cumulative-layout-shift' ];
	const totalBlockingTime =
		data?.lighthouseResult?.audits?.[ 'total-blocking-time' ];

	if ( error ) {
		const errorMessage = getReportErrorMessage( error );

		return (
			<div className="googlesitekit-pagespeed-insights-web-vitals-metrics">
				<div className="googlesitekit-pagespeed-report__row googlesitekit-pagespeed-report__row--error">
					<ErrorText message={ errorMessage } />

					<ReportErrorActions
						moduleSlug="pagespeed-insights"
						error={ error }
					/>
				</div>
			</div>
		);
	}

	return (
		<div className="googlesitekit-pagespeed-insights-web-vitals-metrics">
			<div className="googlesitekit-pagespeed-report__row googlesitekit-pagespeed-report__row--first">
				<p>
					{ createInterpolateElement(
						__(
							'Lab data is a snapshot of how your page performs right now, measured in tests we run in a controlled environment. <LearnMoreLink />',
							'google-site-kit'
						),
						{
							LearnMoreLink: <MetricsLearnMoreLink />,
						}
					) }
				</p>
			</div>
			<table className="googlesitekit-table googlesitekit-table--with-list">
				<thead>
					<tr>
						<th>{ __( 'Metric Name', 'google-site-kit' ) }</th>
						<th>{ __( 'Metric Value', 'google-site-kit' ) }</th>
					</tr>
				</thead>
				<tbody>
					<ReportMetric
						title={ _x(
							'Largest Contentful Paint',
							'core web vitals name',
							'google-site-kit'
						) }
						description={ __(
							'Time it takes for the page to load',
							'google-site-kit'
						) }
						displayValue={
							largestContentfulPaint?.displayValue || '0'
						}
						category={ getScoreCategory(
							largestContentfulPaint?.score || 0
						) }
					/>
					<ReportMetric
						title={ _x(
							'Cumulative Layout Shift',
							'core web vitals name',
							'google-site-kit'
						) }
						description={ __(
							'How stable the elements on the page are',
							'google-site-kit'
						) }
						displayValue={
							cumulativeLayoutShift?.displayValue || '0'
						}
						category={ getScoreCategory(
							cumulativeLayoutShift?.score || 0
						) }
					/>
					<ReportMetric
						title={ __( 'Total Blocking Time', 'google-site-kit' ) }
						description={ __(
							'How long people had to wait after the page loaded before they could click something',
							'google-site-kit'
						) }
						displayValue={ totalBlockingTime?.displayValue || '0' }
						category={ getScoreCategory(
							totalBlockingTime?.score || 0
						) }
						hintText={ <br /> }
						isLast
					/>
				</tbody>
			</table>
		</div>
	);
}

LabReportMetrics.propTypes = {
	data: PropTypes.object,
	error: PropTypes.object,
};
