/**
 * Utility functions for SearchFunnelWidgetGA4/Overview.
 *
 * Site Kit by Google, Copyright 2025 Google LLC
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
 * Internal dependencies
 */
import { calculateChange } from '../../../../../../util';

/**
 * Gets the cell props for responsive grid layout.
 * These props define the cell sizes for different screen breakpoints.
 *
 * @since n.e.x.t
 *
 * @param {boolean} showConversionsCTA Whether to show the conversions CTA.
 * @return {Object} Object with the cell props for the DataBlocks.
 */
export function getCellProps( showConversionsCTA ) {
	const quarterCellProps = {
		smSize: 2,
		mdSize: showConversionsCTA ? 4 : 2,
		lgSize: 3,
	};

	const oneThirdCellProps = {
		smSize: 2,
		mdSize: 4,
		lgSize: 4,
	};

	const halfCellProps = {
		smSize: 4,
		mdSize: 4,
		lgSize: 6,
	};

	const threeQuartersCellProps = {
		smSize: 4,
		mdSize: 4,
		lgSize: 9,
	};

	const fullCellProps = {
		smSize: 4,
		mdSize: 8,
		lgSize: 12,
	};

	return {
		quarterCellProps,
		halfCellProps,
		oneThirdCellProps,
		threeQuartersCellProps,
		fullCellProps,
	};
}

/**
 * Gets the datapoint and change for the given report and selected stat.
 *
 * @since n.e.x.t
 *
 * @param {Object} report       The report object.
 * @param {number} selectedStat The selected stat.
 * @param {number} divider      The divider.
 * @return {Object} Object with the datapoint and change.
 */
export function getDatapointAndChange( report, selectedStat, divider = 1 ) {
	return {
		datapoint:
			report?.totals?.[ 0 ]?.metricValues?.[ selectedStat ]?.value /
			divider,
		change: calculateChange(
			report?.totals?.[ 1 ]?.metricValues?.[ selectedStat ]?.value,
			report?.totals?.[ 0 ]?.metricValues?.[ selectedStat ]?.value
		),
	};
}
