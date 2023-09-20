/**
 * MetricTileNumeric component.
 *
 * Site Kit by Google, Copyright 2023 Google LLC
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
import { Fragment } from '@wordpress/element';

/**
 * Internal dependencies
 */
import { numFmt, expandNumFmtOptions } from '../../util';
import ChangeBadge from '../ChangeBadge';
import MetricTileError from './MetricTileError';
import MetricTileLoader from './MetricTileLoader';
import MetricTileHeader from './MetricTileHeader';

export default function MetricTileNumeric( props ) {
	const {
		Widget,
		loading,
		title,
		metricValue,
		metricValueFormat,
		subText,
		previousValue,
		currentValue,
		error,
		moduleSlug,
		infoTooltip,
	} = props;

	const formatOptions = expandNumFmtOptions( metricValueFormat );

	if ( error ) {
		return (
			<MetricTileError
				moduleSlug={ moduleSlug }
				error={ error }
				headerText={ title }
			/>
		);
	}

	return (
		<Widget noPadding>
			<div className="googlesitekit-km-widget-tile googlesitekit-km-widget-tile--numeric">
				<MetricTileHeader title={ title } infoTooltip={ infoTooltip } />
				<div className="googlesitekit-km-widget-tile__body">
					{ loading && <MetricTileLoader /> }
					{ ! loading && (
						<Fragment>
							<div className="googlesitekit-km-widget-tile__metric-change-container">
								<div className="googlesitekit-km-widget-tile__metric">
									{ numFmt( metricValue, formatOptions ) }
								</div>
								<ChangeBadge
									previousValue={ previousValue }
									currentValue={ currentValue }
									isAbsolute={
										formatOptions?.style === 'percent'
									}
								/>
							</div>
							<p className="googlesitekit-km-widget-tile__subtext">
								{ subText }
							</p>
						</Fragment>
					) }
				</div>
			</div>
		</Widget>
	);
}

MetricTileNumeric.propTypes = {
	Widget: PropTypes.elementType.isRequired,
	loading: PropTypes.bool,
	title: PropTypes.string,
	metricValue: PropTypes.oneOfType( [ PropTypes.string, PropTypes.number ] ),
	metricValueFormat: PropTypes.oneOfType( [
		PropTypes.string,
		PropTypes.object,
	] ),
	subtext: PropTypes.string,
	previousValue: PropTypes.number,
	currentValue: PropTypes.number,
	error: PropTypes.oneOfType( [
		PropTypes.arrayOf( PropTypes.object ),
		PropTypes.object,
	] ),
	moduleSlug: PropTypes.string.isRequired,
	infoTooltip: PropTypes.oneOfType( [ PropTypes.string, PropTypes.element ] ),
};
