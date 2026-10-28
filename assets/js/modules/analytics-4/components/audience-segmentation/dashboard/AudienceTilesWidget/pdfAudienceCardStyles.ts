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
	// Each section is inset from the card edges and draws a divider below it.
	// It fills its cell, which is as tall as the tallest card's section, so the
	// dividers line up across the cards. Its content is vertically centered.
	row: {
		flexGrow: 1,
		flexDirection: 'row',
		alignItems: 'center',
		marginHorizontal: 24,
		paddingVertical: 12,
		borderBottomWidth: 1,
		borderBottomColor: PDF_COLORS.SURFACES_SURFACE_1,
	},
	// The last section drops its divider, so the card ends on content.
	lastRow: {
		borderBottomWidth: 0,
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
	// A row that keeps a title on the left and its Partial data badge on the
	// right, both vertically centered, like the dashboard tile.
	badgeRow: {
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'space-between',
	},
} );
