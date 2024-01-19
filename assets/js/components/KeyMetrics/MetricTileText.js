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
import MetricTileWrapper from './MetricTileWrapper';

export default function MetricTileText( {
	metricValue,
	metricValueFormat,
	subText,
	previousValue,
	currentValue,
	...props
} ) {
	const formatOptions = expandNumFmtOptions( metricValueFormat );

	return (
		<MetricTileWrapper
			className="googlesitekit-km-widget-tile--text"
			{ ...props }
		>
			<div className="googlesitekit-km-widget-tile__metric-container">
				<div className="googlesitekit-km-widget-tile__metric">
					{ metricValue }
				</div>
				<p className="googlesitekit-km-widget-tile__subtext">
					{ subText }
				</p>
			</div>
			<div className="googlesitekit-km-widget-tile__metric-change-container">
				<ChangeBadge
					previousValue={ previousValue }
					currentValue={ currentValue }
					isAbsolute={ formatOptions?.style === 'percent' }
				/>
			</div>
		</MetricTileWrapper>
	);
}

MetricTileText.propTypes = {
	metricValue: PropTypes.oneOfType( [ PropTypes.string, PropTypes.number ] ),
	subtext: PropTypes.string,
	previousValue: PropTypes.number,
	currentValue: PropTypes.number,
};
