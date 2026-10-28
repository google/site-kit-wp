/**
 * Shared styles for the sections of an audience card in the Your visitor groups PDF widget.
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
import { createPDFStyles } from '@/js/components/pdf-export/pdf-scale';
import { PDF_COLORS } from '@/js/components/pdf-export/pdf-theme';

export const audienceCardStyles = createPDFStyles( {
	// Fills its grid cell, so the dividers line up across the cards.
	section: {
		flexGrow: 1,
		marginHorizontal: 24,
		borderBottomWidth: 1,
		borderBottomColor: PDF_COLORS.SURFACES_SURFACE_1,
	},
	lastSection: {
		borderBottomWidth: 0,
	},
	sectionContent: {
		flexDirection: 'row',
		alignItems: 'center',
		paddingVertical: 12,
	},
	iconColumn: {
		width: 52,
		alignItems: 'center',
		marginRight: 4,
	},
	body: {
		flex: 1,
	},
	sectionTitle: {
		color: PDF_COLORS.SURFACES_ON_SURFACE_VARIANT,
	},
	badgeRow: {
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'space-between',
	},
	// Takes the width the badge leaves, so a long title wraps before it.
	badgeRowTitle: {
		flex: 1,
	},
} );
