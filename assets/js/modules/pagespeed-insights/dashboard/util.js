/**
 * PageSpeed Insights dashboard utility functions.
 *
 * Site Kit by Google, Copyright 2019 Google LLC
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

import { __ } from '@wordpress/i18n';

/**
 * Retrieve the score category slug based on the given score.
 *
 * @param number score Score between 1.0 and 0.0.
 *
 * @return string Either 'fast', 'average', or 'slow'.
 */
function getScoreCategory( score ) {
	if ( 0.9 <= score ) {
		return 'fast';
	}

	if ( 0.5 <= score ) {
		return 'average';
	}

	return 'slow';
}

/**
 * Retrieve the score category label based on the given score.
 *
 * @param number score Score between 1.0 and 0.0.
 *
 * @return string Score category label.
 */
export const getScoreCategoryLabel = ( score ) => {
	const category = getScoreCategory( score );

	if ( 'fast' === category ) {
		return __( 'Fast', 'google-site-kit' );
	}

	if ( 'average' === category ) {
		return __( 'Average', 'google-site-kit' );
	}

	return __( 'Slow', 'google-site-kit' );
};

export const PageSpeedReportScoreCategoryWrapper = ( props ) => {
	const { score, children } = props;
	const className = `googlesitekit-pagespeed-report__score-category-wrapper googlesitekit-pagespeed-report__score-category-wrapper--${ getScoreCategory( score ) }`;
	const iconClassName = `googlesitekit-pagespeed-report__score-icon googlesitekit-pagespeed-report__score-icon--${ getScoreCategory( score ) }`;

	return (
		<span className={ className }>
			{ children } <span className={ iconClassName }></span>
		</span>
	);
};

export const PageSpeedReportScoreGauge = ( props ) => {
	const { score } = props;
	const percentage = parseInt( score * 100, 10 );
	const className = `
		googlesitekit-percentage-circle
		googlesitekit-percentage-circle--${ getScoreCategory( score ) }
		googlesitekit-percentage-circle--percent-${ percentage }
	`;

	return (
		<div className="googlesitekit-pagespeed-report__score-gauge">
			<div className={ className }>
				<div className="googlesitekit-percentage-circle__text">{ percentage }</div>
				<div className="googlesitekit-percentage-circle__slice">
					<div className="googlesitekit-percentage-circle__bar"></div>
					<div className="googlesitekit-percentage-circle__fill"></div>
				</div>
			</div>
			<span className="googlesitekit-pagespeed-report__score-gauge-label screen-reader-only">
				{ __( 'Performance', 'google-site-kit' ) }
			</span>
		</div>
	);
};

export const PageSpeedReportScale = () => {
	return (
		<div className="googlesitekit-pagespeed-report__scale">
			<span>
				{ __( 'Scale:', 'google-site-kit' ) }
			</span>
			<span className="googlesitekit-pagespeed-report__scale-range googlesitekit-pagespeed-report__scale-range--fast">
				{ __( '90-100 (fast)', 'google-site-kit' ) }
			</span>
			<span className="googlesitekit-pagespeed-report__scale-range googlesitekit-pagespeed-report__scale-range--average">
				{ __( '50-89 (average)', 'google-site-kit' ) }
			</span>
			<span className="googlesitekit-pagespeed-report__scale-range googlesitekit-pagespeed-report__scale-range--slow">
				{ __( '0-49 (slow)', 'google-site-kit' ) }
			</span>
		</div>
	);
};
