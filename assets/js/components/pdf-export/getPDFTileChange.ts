/**
 * PDF tile change helper.
 *
 * Site Kit by Google, Copyright 2026 Google LLC
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
import type { PDFChangeType } from '@/js/components/pdf-export/types';
import { calculateChange, numFmt } from '@/js/util';

/** A tile's period-over-period change, pre-formatted for the change badge. */
export interface PDFTileChange {
	/** The formatted, signed change, e.g. "+5.1%", or `undefined` when it can't be computed. */
	change?: string;
	/** The change's direction, controlling the badge color. */
	changeType?: PDFChangeType;
}

/**
 * Gets a change badge's `PDFChangeType` from a numeric change value.
 *
 * @since n.e.x.t
 *
 * @param {number} change The change value.
 * @return {string} The change's direction.
 */
export function getPDFChangeType( change: number ): PDFChangeType {
	if ( change < 0 ) {
		return 'negative';
	}
	return change === 0 ? 'zero' : 'positive';
}

/**
 * Computes a Key Metrics PDF tile's change badge fields from its current and
 * previous values, mirroring the dashboard's `ChangeBadge`.
 *
 * The change is the relative difference by default, or the absolute difference
 * when `isAbsolute` is set (used for metrics that are themselves percentages, so
 * the badge shows a point difference rather than a percentage of a percentage).
 * The result is `undefined` when the change can't be computed (e.g. the previous
 * value is zero), which hides the badge.
 *
 * @since n.e.x.t
 *
 * @param {number}  previousValue        The previous period's value.
 * @param {number}  currentValue         The current period's value.
 * @param {Object}  [options]            Options.
 * @param {boolean} [options.isAbsolute] Whether to use the absolute rather than relative change. Defaults to `false`.
 * @return {PDFTileChange} The formatted change and its direction.
 */
export default function getPDFTileChange(
	previousValue: number,
	currentValue: number,
	{ isAbsolute = false }: { isAbsolute?: boolean } = {}
): PDFTileChange {
	const change = isAbsolute
		? currentValue - previousValue
		: calculateChange( previousValue, currentValue );

	if ( change === null || change === undefined ) {
		return {};
	}

	return {
		change: numFmt( change, {
			style: 'percent',
			signDisplay: 'exceptZero',
			maximumFractionDigits: 1,
		} ),
		changeType: getPDFChangeType( change ),
	};
}
