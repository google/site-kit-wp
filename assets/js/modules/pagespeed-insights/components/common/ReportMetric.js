/**
 * PageSpeed Insights Report Metric component.
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
import classnames from 'classnames';

/**
 * WordPress dependencies
 */
import { __, _x } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import {
	CATEGORY_FAST,
	CATEGORY_AVERAGE,
	CATEGORY_SLOW,
} from '../../util/constants';
import Badge from '../../../../components/Badge';
import InfoTooltip from '../../../../components/InfoTooltip';

export default function ReportMetric( {
	title,
	description,
	displayValue,
	category,
	experimental,
	isLast,
	isHidden,
	isUnavailable,
} ) {
	// Normalize the category case.
	category = category?.toLowerCase();

	return (
		<tr
			className={ classnames(
				'googlesitekit-pagespeed-report__row',
				'googlesitekit-pagespeed-report-metric',
				{
					'googlesitekit-pagespeed-report__row--last': isLast,
					'googlesitekit-pagespeed-report__row--hidden': isHidden,
					'googlesitekit-pagespeed-report__row--unavailable':
						isUnavailable,
				}
			) }
		>
			<td>
				<div className="googlesitekit-pagespeed-report-metric__title">
					{ title }
					{ !! experimental && (
						<Badge
							label={ __( 'Experimental', 'google-site-kit' ) }
							className="googlesitekit-pagespeed-report-metric__badge"
						/>
					) }
					{ isUnavailable && (
						<InfoTooltip
							title={ __(
								'Field data is still being gathered for this metric and will become available once your site gets sufficient traffic.',
								'google-site-kit'
							) }
						/>
					) }
				</div>
				<div className="googlesitekit-pagespeed-report-metric__description">
					{ description }
				</div>
			</td>

			<td
				className={ classnames(
					'googlesitekit-pagespeed-report-metric-value',
					{
						[ `googlesitekit-pagespeed-report-metric--${ category }` ]:
							!! category,
					}
				) }
			>
				<div className="googlesitekit-pagespeed-report-metric-value-container">
					<div className="googlesitekit-pagespeed-report-metric-value__display-value">
						{ isUnavailable ? '—' : displayValue }
					</div>
					<div className="googlesitekit-pagespeed-report-metric-value__rating">
						{ isUnavailable && (
							<span>
								{ __( 'gathering data', 'google-site-kit' ) }
							</span>
						) }
						{ ! isUnavailable && category === CATEGORY_FAST && (
							<span>
								{ _x(
									'Good',
									'Performance rating',
									'google-site-kit'
								) }
							</span>
						) }
						{ ! isUnavailable && category === CATEGORY_AVERAGE && (
							<span>
								{ _x(
									'Needs improvement',
									'Performance rating',
									'google-site-kit'
								) }
							</span>
						) }
						{ ! isUnavailable && category === CATEGORY_SLOW && (
							<span>
								{ _x(
									'Poor',
									'Performance rating',
									'google-site-kit'
								) }
							</span>
						) }
					</div>
				</div>
			</td>
		</tr>
	);
}

ReportMetric.propTypes = {
	title: PropTypes.string.isRequired,
	description: PropTypes.string.isRequired,
	displayValue: PropTypes.string.isRequired,
	category: PropTypes.string,
	experimental: PropTypes.bool,
	isLast: PropTypes.bool,
	isHidden: PropTypes.bool,
};
