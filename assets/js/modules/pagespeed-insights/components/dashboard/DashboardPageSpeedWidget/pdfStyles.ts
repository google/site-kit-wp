/**
 * DashboardPageSpeedWidget PDF shared styles.
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
import { StyleSheet } from '@react-pdf/renderer';

/**
 * Internal dependencies
 */
import {
	PDF_COLOR_TEXT_MUTED,
	PDF_COLOR_TEXT_PRIMARY,
	PDF_COLOR_TEXT_SECONDARY,
	PDF_FONT_FAMILY_TEXT,
} from '@/js/components/pdf-export/pdf-theme';

const ROW_BORDER_COLOR = '#EBEEF0';

// The mobile/desktop columns must line up between the header cells and the
// value cells, so the width is shared across all the metric components.
export const STRATEGY_COLUMN_WIDTH = 110;

export const styles = StyleSheet.create( {
	widgetHeading: {
		fontFamily: PDF_FONT_FAMILY_TEXT,
		fontSize: 13,
		color: PDF_COLOR_TEXT_MUTED,
		marginBottom: 10,
	},
	sectionWidgetCard: {
		backgroundColor: '#ffffff',
		borderRadius: 10,
		paddingBottom: 15,
		marginBottom: 10,
	},
	sectionWidgetCardLast: {
		marginBottom: 10,
	},
	headerRow: {
		flexDirection: 'row',
		alignItems: 'center',
		paddingHorizontal: 12,
		paddingVertical: 15,
		borderBottomWidth: 1,
		borderBottomColor: ROW_BORDER_COLOR,
		borderBottomStyle: 'solid',
	},
	headerTitleCell: {
		flex: 1,
		justifyContent: 'center',
	},
	headerStrategyCell: {
		width: STRATEGY_COLUMN_WIDTH,
		alignItems: 'center',
		justifyContent: 'center',
	},
	headerSectionTitle: {
		fontFamily: PDF_FONT_FAMILY_TEXT,
		fontSize: 7,
		fontWeight: 500,
		color: PDF_COLOR_TEXT_PRIMARY,
	},
	headerStrategyLabel: {
		fontFamily: PDF_FONT_FAMILY_TEXT,
		fontSize: 7,
		fontWeight: 500,
		color: PDF_COLOR_TEXT_SECONDARY,
		textAlign: 'center',
	},
	metricRow: {
		flexDirection: 'row',
		alignItems: 'center',
		paddingHorizontal: 12,
		paddingVertical: 7,
		borderBottomWidth: 1,
		borderBottomColor: ROW_BORDER_COLOR,
		borderBottomStyle: 'solid',
	},
	metricRowLast: {
		borderBottomWidth: 0,
	},
	metricLabelGroup: {
		flex: 1,
		paddingRight: 8,
	},
	metricTitle: {
		fontFamily: PDF_FONT_FAMILY_TEXT,
		fontSize: 8,
		fontWeight: 500,
		color: PDF_COLOR_TEXT_PRIMARY,
	},
	metricDescription: {
		fontFamily: PDF_FONT_FAMILY_TEXT,
		fontSize: 6,
		color: PDF_COLOR_TEXT_SECONDARY,
		marginTop: 3,
	},
	valueCell: {
		width: STRATEGY_COLUMN_WIDTH,
		alignItems: 'center',
	},
	metricValue: {
		fontFamily: PDF_FONT_FAMILY_TEXT,
		fontSize: 8,
		fontWeight: 500,
		color: PDF_COLOR_TEXT_PRIMARY,
	},
	badge: {
		marginTop: 3,
		paddingHorizontal: 5,
		paddingVertical: 1,
		borderRadius: 10,
	},
	badgeText: {
		fontFamily: PDF_FONT_FAMILY_TEXT,
		fontSize: 6,
		fontWeight: 500,
	},
	unavailableCell: {
		fontFamily: PDF_FONT_FAMILY_TEXT,
		fontSize: 8,
		color: PDF_COLOR_TEXT_SECONDARY,
		textAlign: 'center',
	},
	unavailableSection: {
		fontFamily: PDF_FONT_FAMILY_TEXT,
		fontSize: 8,
		color: PDF_COLOR_TEXT_SECONDARY,
		padding: 12,
	},
} );
