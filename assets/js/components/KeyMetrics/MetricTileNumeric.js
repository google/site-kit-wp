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
 * Internal dependencies
 */
import ChangeBadge from '../ChangeBadge';
import PreviewBlock from '../PreviewBlock';

export default function MetricTileNumeric( {
	Widget,
	loading,
	title,
	metricValue,
	subText,
	previousChangeValue,
	currentChangeValue,
} ) {
	if ( loading ) {
		return (
			<Widget noPadding>
				<PreviewBlock width="100%" height="142px" padding />
			</Widget>
		);
	}

	return (
		<Widget noPadding>
			<div className="googlesitekit-km-widget-tile">
				<h3 className="googlesitekit-km-widget-tile__title">
					{ title }
				</h3>
				<div className="googlesitekit-km-widget-tile__body">
					<div className="googlesitekit-km-widget-tile__metric-change-container">
						<div className="googlesitekit-km-widget-tile__metric">
							{ metricValue }
						</div>
						<ChangeBadge
							previousValue={ previousChangeValue }
							currentValue={ currentChangeValue }
						></ChangeBadge>
					</div>
					<p className="googlesitekit-km-widget-tile__subtext">
						{ subText }
					</p>
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
	subtext: PropTypes.string,
	previousChangeValue: PropTypes.number,
	currentChangeValue: PropTypes.number,
};
