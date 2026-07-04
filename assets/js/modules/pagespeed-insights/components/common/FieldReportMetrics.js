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
import classnames from 'classnames';
import PropTypes from 'prop-types';

/**
 * WordPress dependencies
 */
import { createInterpolateElement } from '@wordpress/element';
import { __, _x, sprintf } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import ErrorNotice from '@/js/components/ErrorNotice';
import ReportErrorActions from '@/js/components/ReportErrorActions';
import Typography from '@/js/components/Typography';
import P from '@/js/components/Typography/P';
import { CATEGORY_AVERAGE } from '@/js/modules/pagespeed-insights/util/constants';
import { getReportErrorMessage } from '@/js/util/errors';
import INPLearnMoreLink from './INPLearnMoreLink';
import MetricsLearnMoreLink from './MetricsLearnMoreLink';
import ReportMetric from './ReportMetric';
import { extractFieldMetrics } from './reportMetrics';

export default function FieldReportMetrics( { data, error } ) {
	// INP is read from the raw report for the dashboard tile; extractFieldMetrics
	// also extracts it as interactionToNextPaint for the PDF (LCP / CLS / INP).
	const { INTERACTION_TO_NEXT_PAINT: interactionToNextPaint } =
		data?.loadingExperience?.metrics || {};

	// Each field metric is independently optional, so LCP and CLS still render
	// when other CrUX metrics (e.g. FID) are absent.
	const fieldMetrics = extractFieldMetrics( data );
	const largestContentfulPaint = fieldMetrics?.largestContentfulPaint;
	const cumulativeLayoutShift = fieldMetrics?.cumulativeLayoutShift;

	if ( error ) {
		const errorMessage = getReportErrorMessage( error );

		return (
			<div className="googlesitekit-pagespeed-insights-web-vitals-metrics">
				<div className="googlesitekit-pagespeed-report__row googlesitekit-pagespeed-report__row--error">
					<ErrorNotice message={ errorMessage } />

					<ReportErrorActions
						moduleSlug="pagespeed-insights"
						error={ error }
					/>
				</div>
			</div>
		);
	}

	if (
		! largestContentfulPaint &&
		! cumulativeLayoutShift &&
		! interactionToNextPaint
	) {
		return (
			<div className="googlesitekit-pagespeed-insights-web-vitals-metrics googlesitekit-pagespeed-insights-web-vitals-metrics--field-data-unavailable">
				<div className="googlesitekit-pagespeed-insights-web-vitals-metrics__field-data-unavailable-content">
					<Typography as="h3" type="headline" size="small">
						{ __( 'Field data unavailable', 'google-site-kit' ) }
					</Typography>
					<P>
						{ __(
							'Field data shows how real users actually loaded and interacted with your page. We don’t have enough real-world experience and speed data for this page. It may be new, or not enough users with Chrome browsers have visited it yet.',
							'google-site-kit'
						) }
					</P>
				</div>
			</div>
		);
	}

	return (
		<div className="googlesitekit-pagespeed-insights-web-vitals-metrics">
			<div className="googlesitekit-pagespeed-report__row googlesitekit-pagespeed-report__row--first">
				<P>
					{ createInterpolateElement(
						__(
							'Field data shows how real users actually loaded and interacted with your page over time. <LearnMoreLink />',
							'google-site-kit'
						),
						{
							LearnMoreLink: <MetricsLearnMoreLink />,
						}
					) }
				</P>
			</div>
			<table
				className={ classnames(
					'googlesitekit-table',
					'googlesitekit-table--with-list'
				) }
			>
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
						displayValue={ largestContentfulPaint?.displayValue }
						category={ largestContentfulPaint?.category }
						isUnavailable={ ! largestContentfulPaint }
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
						displayValue={ cumulativeLayoutShift?.displayValue }
						category={ cumulativeLayoutShift?.category }
						isUnavailable={ ! cumulativeLayoutShift }
					/>
					<ReportMetric
						title={ _x(
							'Interaction to Next Paint',
							'core web vitals name',
							'google-site-kit'
						) }
						description={ __(
							'How quickly your page responds when people interact with it',
							'google-site-kit'
						) }
						displayValue={ sprintf(
							/* translators: %s: number of milliseconds */
							_x( '%s ms', 'duration', 'google-site-kit' ),
							interactionToNextPaint?.percentile
						) }
						category={
							interactionToNextPaint?.category || CATEGORY_AVERAGE
						}
						isUnavailable={ ! interactionToNextPaint }
						hintText={ createInterpolateElement(
							__(
								'INP is a new Core Web Vital that replaced FID in March 2024. <LearnMoreLink />',
								'google-site-kit'
							),
							{
								LearnMoreLink: <INPLearnMoreLink />,
							}
						) }
						isLast
					/>
				</tbody>
			</table>
		</div>
	);
}

FieldReportMetrics.propTypes = {
	data: PropTypes.object,
	error: PropTypes.object,
};
