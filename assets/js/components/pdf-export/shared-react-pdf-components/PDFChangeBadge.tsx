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
import PDFBadge from './PDFBadge';

export interface PDFChangeBadgeProps {
	/** The formatted, signed change string, e.g. "+5.1%". */
	change: string;
	/** Whether the change is negative. Controls the badge colors. */
	isNegative?: boolean;
}

const PDFChangeBadge: FC< PDFChangeBadgeProps > = ( {
	change,
	isNegative = false,
} ) => {
	const backgroundColor = isNegative
		? PDF_COLORS.UTILITY_ERROR_CONTAINER
		: PDF_COLORS.GREEN_G_50;
	const color = isNegative
		? PDF_COLORS.UTILITY_ON_ERROR_CONTAINER
		: PDF_COLORS.UTILITY_ON_SUCCESS_CONTAINER;

	return (
		<PDFBadge
			label={ change }
			backgroundColor={ backgroundColor }
			color={ color }
		/>
	);
};

export default PDFChangeBadge;
