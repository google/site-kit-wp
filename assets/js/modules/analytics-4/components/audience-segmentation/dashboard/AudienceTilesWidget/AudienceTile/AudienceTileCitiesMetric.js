/**
 * AudienceTileCitiesMetric component.
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
import { numFmt } from '../../../../../../../util';
import AudienceTileNoData from './AudienceTileNoData';

export default function AudienceTileCitiesMetric( {
	TileIcon,
	title,
	topCities,
} ) {
	const validDimensionValues =
		topCities?.dimensionValues?.filter( Boolean ) || [];
	const hasDimensionValues = !! validDimensionValues.length;

	return (
		<div className="googlesitekit-audience-segmentation-tile-metric googlesitekit-audience-segmentation-tile-metric--cities">
			<div className="googlesitekit-audience-segmentation-tile-metric__icon">
				<TileIcon />
			</div>
			<div className="googlesitekit-audience-segmentation-tile-metric__container">
				<div className="googlesitekit-audience-segmentation-tile-metric__title">
					{ title }
				</div>
				<div className="googlesitekit-audience-segmentation-tile-metric__content">
					{ ! hasDimensionValues && <AudienceTileNoData /> }
					{ hasDimensionValues &&
						validDimensionValues.map( ( city, index ) => (
							<div
								key={ city?.value }
								className="googlesitekit-audience-segmentation-tile-metric__cities-metric"
							>
								<div className="googlesitekit-audience-segmentation-tile-metric__cities-metric-name">
									{ city?.value }
								</div>
								<div className="googlesitekit-audience-segmentation-tile-metric__cities-metric-value">
									{ numFmt(
										topCities?.metricValues[ index ]?.value,
										{
											style: 'percent',
											maximumFractionDigits: 1,
										}
									) }
								</div>
							</div>
						) ) }
				</div>
			</div>
		</div>
	);
}

AudienceTileCitiesMetric.propTypes = {
	TileIcon: PropTypes.elementType.isRequired,
	title: PropTypes.string.isRequired,
	topCities: PropTypes.object,
};
