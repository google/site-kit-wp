/**
 * MetricTileText component.
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
 * Internal dependencies
 */
import ChangeBadge from '../ChangeBadge';
import { expandNumFmtOptions } from '../../util';
import { Fragment } from 'react';
import MetricTileError from './MetricTileError';
import MetricTileLoader from './MetricTileLoader';

export default function MetricTileText( {
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
} ) {
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
			<div className="googlesitekit-km-widget-tile googlesitekit-km-widget-tile--text">
				<h3 className="googlesitekit-km-widget-tile__title">
					{ title }
				</h3>
				<div className="googlesitekit-km-widget-tile__body">
					{ loading && <MetricTileLoader /> }
					{ ! loading && (
						<Fragment>
							<div className="googlesitekit-km-widget-tile__metric">
								{ metricValue }
							</div>
							<p className="googlesitekit-km-widget-tile__subtext">
								{ subText }
							</p>
							<div className="googlesitekit-km-widget-tile__metric-change-container">
								<ChangeBadge
									previousValue={ previousValue }
									currentValue={ currentValue }
									isAbsolute={
										formatOptions?.style === 'percent'
									}
								/>
							</div>
						</Fragment>
					) }
				</div>
			</div>
		</Widget>
	);
}

MetricTileText.propTypes = {
	Widget: PropTypes.elementType.isRequired,
	loading: PropTypes.bool,
	title: PropTypes.string,
	metricValue: PropTypes.oneOfType( [ PropTypes.string, PropTypes.number ] ),
	subtext: PropTypes.string,
	previousValue: PropTypes.number,
	currentValue: PropTypes.number,
	error: PropTypes.oneOfType( [
		PropTypes.arrayOf( PropTypes.object ),
		PropTypes.object,
	] ),
	moduleSlug: PropTypes.string.isRequired,
};
