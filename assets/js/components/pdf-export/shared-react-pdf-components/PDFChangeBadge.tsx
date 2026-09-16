/**
 * A badge that shows a metric's change, colored for a rise or a fall.
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
 * External dependencies
 */
import { FC } from 'react';

/**
 * Internal dependencies
 */
import { PDF_COLORS } from '@/js/components/pdf-export/pdf-theme';
import type { PDFChangeType } from '@/js/components/pdf-export/types';
import PDFBadge from './PDFBadge';

/**
 * Background and text color for each change direction.
 *
 * Exported so callers that tint a larger area by the same direction (e.g. a
 * metric tile's own background) can match the badge exactly, rather than
 * picking colors independently.
 */
export const PDF_CHANGE_COLORS: Record<
	PDFChangeType,
	{ backgroundColor: string; color: string }
> = {
	positive: {
		backgroundColor: PDF_COLORS.GREEN_G_50,
		color: PDF_COLORS.UTILITY_ON_SUCCESS_CONTAINER,
	},
	negative: {
		backgroundColor: PDF_COLORS.UTILITY_ERROR_CONTAINER,
		color: PDF_COLORS.UTILITY_ON_ERROR_CONTAINER,
	},
	noChange: {
		backgroundColor: PDF_COLORS.SURFACES_INVERSE_ON_SURFACE,
		color: PDF_COLORS.NEUTRAL_N_700,
	},
};

export interface PDFChangeBadgeProps {
	/** The formatted, signed change string, e.g. "+5.1%". */
	change: string;
	/** The change's type (`'positive'`, `'negative'`, or `'noChange'`). Controls the badge colors. */
	changeType?: PDFChangeType;
}

const PDFChangeBadge: FC< PDFChangeBadgeProps > = ( {
	change,
	changeType = 'positive',
} ) => {
	const { backgroundColor, color } = PDF_CHANGE_COLORS[ changeType ];

	return (
		<PDFBadge
			label={ change }
			backgroundColor={ backgroundColor }
			color={ color }
		/>
	);
};

export default PDFChangeBadge;
