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
import classnames from 'classnames';

/**
 * WordPress dependencies
 */
import { useCallback } from '@wordpress/element';
import { __, _x } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import API from 'googlesitekit-api';
import Data from 'googlesitekit-data';
import { STORE_NAME as CORE_SITE } from '../../../../googlesitekit/datastore/site/constants';
import ReportMetric from './ReportMetric';
import ReportDetailsLink from './ReportDetailsLink';
import MetricsLearnMoreLink from './MetricsLearnMoreLink';
import { getScoreCategory } from '../../util';
import Link from '../../../../components/Link';
import ErrorText from '../../../../components/error-text';
import {
	STORE_NAME,
	STRATEGY_MOBILE,
	STRATEGY_DESKTOP,
} from '../../datastore/constants';

const { useSelect, useDispatch } = Data;

export default function LabReportMetrics( { data, error } ) {
	const referenceURL = useSelect( ( select ) => select( CORE_SITE ).getCurrentReferenceURL() );

	const { invalidateResolution } = useDispatch( STORE_NAME );
	const updateReport = useCallback( async ( event ) => {
		event.preventDefault();

		// Invalidate the PageSpeed API request caches.
		await API.invalidateCache( 'modules', 'pagespeed-insights', 'pagespeed' );

		// Invalidate the cached resolver.
		invalidateResolution( 'getReport', [ referenceURL, STRATEGY_DESKTOP ] );
		invalidateResolution( 'getReport', [ referenceURL, STRATEGY_MOBILE ] );
	}, [ invalidateResolution, referenceURL ] );

	const totalBlockingTime = data?.lighthouseResult?.audits?.[ 'total-blocking-time' ];
	const largestContentfulPaint = data?.lighthouseResult?.audits?.[ 'largest-contentful-paint' ];
	const cumulativeLayoutShift = data?.lighthouseResult?.audits?.[ 'cumulative-layout-shift' ];

	if ( error ) {
		return (
			<div className="googlesitekit-pagespeed-insights-web-vitals-metrics">
				<div className="googlesitekit-pagespeed-report__row googlesitekit-pagespeed-report__row--first">
					<ErrorText message={ error.message } />
				</div>
			</div>
		);
	}

	if ( ! totalBlockingTime || ! largestContentfulPaint || ! cumulativeLayoutShift ) {
		return null;
	}

	return (
		<div className="googlesitekit-pagespeed-insights-web-vitals-metrics">
			<div className="googlesitekit-pagespeed-report__row googlesitekit-pagespeed-report__row--first">
				<p>
					{ __( 'Lab data is a snapshot of how your page performs right now, measured in tests we run in a controlled environment.', 'google-site-kit' ) }
					{ ' ' }
					<MetricsLearnMoreLink />
				</p>
			</div>
			<table
				className={ classnames(
					'googlesitekit-table',
					'googlesitekit-table--with-list'
				) }
			>
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
						description={ __( 'How long people had to wait after the page loaded before they could click something', 'google-site-kit' ) }
						displayValue={ totalBlockingTime.displayValue }
						category={ getScoreCategory( totalBlockingTime.score ) }
					/>
					<ReportMetric
						title={ _x( 'Largest Contentful Paint', 'core web vitals name', 'google-site-kit' ) }
						description={ __( 'Time it takes for the page to load', 'google-site-kit' ) }
						displayValue={ largestContentfulPaint.displayValue }
						category={ getScoreCategory( largestContentfulPaint.score ) }
					/>
					<ReportMetric
						title={ _x( 'Cumulative Layout Shift', 'core web vitals name', 'google-site-kit' ) }
						description={ __( 'How stable the elements on the page are', 'google-site-kit' ) }
						displayValue={ cumulativeLayoutShift.displayValue }
						category={ getScoreCategory( cumulativeLayoutShift.score ) }
					/>
				</tbody>
			</table>
			<div className="googlesitekit-pagespeed-report__row googlesitekit-pagespeed-report__row--last">
				<Link onClick={ updateReport }>
					{ __( 'Run test again', 'google-site-kit' ) }
				</Link>
				<ReportDetailsLink />
			</div>
		</div>
	);
}

LabReportMetrics.propTypes = {
	data: PropTypes.object,
	error: PropTypes.object,
};
