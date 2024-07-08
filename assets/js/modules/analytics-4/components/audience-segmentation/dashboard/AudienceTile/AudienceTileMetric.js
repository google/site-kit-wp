/**
 * AudienceTileMetric component.
 *
 * Site Kit by Google, Copyright 2024 Google LLC
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
import { numFmt } from '../../../../../../util';

export default function AudienceTileMetric( {
	TileIcon,
	title,
	metricValue,
	Badge,
	metricValueFormat,
} ) {
	return (
		<div className="googlesitekit-audience-segmentation-tile-metric">
			<div className="googlesitekit-audience-segmentation-tile-metric__icon">
				<TileIcon />
			</div>
			<div className="googlesitekit-audience-segmentation-tile-metric__container">
				<div className="googlesitekit-audience-segmentation-tile-metric__value">
					{ numFmt( metricValue, metricValueFormat ) }
				</div>
				<div className="googlesitekit-audience-segmentation-tile-metric__title">
					{ title }
				</div>
			</div>
			<div className="googlesitekit-audience-segmentation-tile-metric__badge-container">
				<Badge />
			</div>
		</div>
	);
}

AudienceTileMetric.propTypes = {
	TileIcon: PropTypes.elementType.isRequired,
	title: PropTypes.string.isRequired,
	metricValue: PropTypes.number.isRequired,
	Badge: PropTypes.elementType.isRequired,
	metricValueFormat: PropTypes.object,
};
