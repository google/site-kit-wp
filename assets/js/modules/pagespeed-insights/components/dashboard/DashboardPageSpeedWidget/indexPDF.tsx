/**
 * DashboardPageSpeedWidget PDF component for @react-pdf/renderer.
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
import { StyleSheet, Text, View } from '@react-pdf/renderer';
import type { FC, ReactNode } from 'react';

/**
 * WordPress dependencies
 */
import { Fragment } from '@wordpress/element';
import { __, _x } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import {
	PDF_COLOR_TEXT_MUTED,
	PDF_COLOR_TEXT_PRIMARY,
	PDF_COLOR_TEXT_SECONDARY,
	PDF_FONT_FAMILY_TEXT,
	PDF_SCORE_BADGE_COLORS,
} from '@/js/components/pdf-export/pdf-theme';
import type { PDFWidgetComponentProps } from '@/js/googlesitekit/widgets/types';
import type {
	FieldMetric,
	ScoredMetric,
} from '@/js/modules/pagespeed-insights/components/common/reportMetrics';
import {
	CATEGORY_FAST,
	CATEGORY_SLOW,
} from '@/js/modules/pagespeed-insights/util/constants';
import type { SpeedPDFData, StrategyData } from './getPDFData';

const ROW_BORDER_COLOR = '#EBEEF0';

const STRATEGY_COLUMN_WIDTH = 110;

const styles = StyleSheet.create( {
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

function getBadgeColors( category: string ) {
	switch ( category ) {
		case CATEGORY_FAST:
			return PDF_SCORE_BADGE_COLORS.fast;
		case CATEGORY_SLOW:
			return PDF_SCORE_BADGE_COLORS.slow;
		default:
			return PDF_SCORE_BADGE_COLORS.average;
	}
}

function getCategoryLabel( category: string ): string {
	switch ( category ) {
		case CATEGORY_FAST:
			return __( 'Good', 'google-site-kit' );
		case CATEGORY_SLOW:
			return __( 'Poor', 'google-site-kit' );
		default:
			return __( 'Needs improvement', 'google-site-kit' );
	}
}

interface MetricValueCellProps {
	metric: ScoredMetric | FieldMetric | null | undefined;
}

function MetricValueCell( { metric }: MetricValueCellProps ) {
	if ( ! metric ) {
		return (
			<View style={ styles.valueCell }>
				<Text style={ styles.unavailableCell }>—</Text>
			</View>
		);
	}
	const badgeColors = getBadgeColors( metric.category );
	return (
		<View style={ styles.valueCell }>
			<Text style={ styles.metricValue }>{ metric.displayValue }</Text>
			<View
				style={ [
					styles.badge,
					{ backgroundColor: badgeColors.background },
				] }
			>
				<Text
					style={ [ styles.badgeText, { color: badgeColors.text } ] }
				>
					{ getCategoryLabel( metric.category ) }
				</Text>
			</View>
		</View>
	);
}

interface MetricRowProps {
	title: string;
	description: string;
	mobileMetric: ScoredMetric | FieldMetric | null | undefined;
	desktopMetric: ScoredMetric | FieldMetric | null | undefined;
	isLast?: boolean;
}

function MetricRow( {
	title,
	description,
	mobileMetric,
	desktopMetric,
	isLast,
}: MetricRowProps ) {
	return (
		<View
			style={
				isLast
					? [ styles.metricRow, styles.metricRowLast ]
					: styles.metricRow
			}
		>
			<View style={ styles.metricLabelGroup }>
				<Text style={ styles.metricTitle }>{ title }</Text>
				<Text style={ styles.metricDescription }>{ description }</Text>
			</View>
			<MetricValueCell metric={ mobileMetric } />
			<MetricValueCell metric={ desktopMetric } />
		</View>
	);
}

interface MetricSectionProps {
	title: string;
	children: ReactNode;
}

function MetricSection( { title, children }: MetricSectionProps ) {
	return (
		<Fragment>
			<View style={ styles.headerRow }>
				<View style={ styles.headerTitleCell }>
					<Text style={ styles.headerSectionTitle }>{ title }</Text>
				</View>
				<View style={ styles.headerStrategyCell }>
					<Text style={ styles.headerStrategyLabel }>
						{ __( 'Mobile', 'google-site-kit' ) }
					</Text>
				</View>
				<View style={ styles.headerStrategyCell }>
					<Text style={ styles.headerStrategyLabel }>
						{ __( 'Desktop', 'google-site-kit' ) }
					</Text>
				</View>
			</View>
			{ children }
		</Fragment>
	);
}

interface SpeedMetricSectionsProps {
	mobile: StrategyData | null;
	desktop: StrategyData | null;
}

function SpeedMetricSections( { mobile, desktop }: SpeedMetricSectionsProps ) {
	const hasField =
		mobile?.field !== null && mobile?.field !== undefined
			? true
			: desktop?.field !== null && desktop?.field !== undefined;

	const labCardStyle = hasField
		? styles.sectionWidgetCard
		: [ styles.sectionWidgetCard, styles.sectionWidgetCardLast ];

	return (
		<Fragment>
			<View style={ labCardStyle }>
				<MetricSection title={ __( 'Lab data', 'google-site-kit' ) }>
					{ ! mobile && ! desktop ? (
						<Text style={ styles.unavailableSection }>
							{ __( 'Data unavailable.', 'google-site-kit' ) }
						</Text>
					) : (
						<Fragment>
							<MetricRow
								title={ _x(
									'Largest Contentful Paint',
									'core web vitals name',
									'google-site-kit'
								) }
								description={ __(
									'Time it takes for the page to load',
									'google-site-kit'
								) }
								mobileMetric={
									mobile?.lab.largestContentfulPaint
								}
								desktopMetric={
									desktop?.lab.largestContentfulPaint
								}
							/>
							<MetricRow
								title={ _x(
									'Cumulative Layout Shift',
									'core web vitals name',
									'google-site-kit'
								) }
								description={ __(
									'How stable the elements on the page are',
									'google-site-kit'
								) }
								mobileMetric={
									mobile?.lab.cumulativeLayoutShift
								}
								desktopMetric={
									desktop?.lab.cumulativeLayoutShift
								}
							/>
							<MetricRow
								title={ __(
									'Total Blocking Time',
									'google-site-kit'
								) }
								description={ __(
									'How long people had to wait after the page loaded before they could click something',
									'google-site-kit'
								) }
								mobileMetric={ mobile?.lab.totalBlockingTime }
								desktopMetric={ desktop?.lab.totalBlockingTime }
								isLast
							/>
						</Fragment>
					) }
				</MetricSection>
			</View>
			{ hasField && (
				<View
					style={ [
						styles.sectionWidgetCard,
						styles.sectionWidgetCardLast,
					] }
				>
					<MetricSection
						title={ __( 'Real user data', 'google-site-kit' ) }
					>
						<MetricRow
							title={ _x(
								'Largest Contentful Paint',
								'core web vitals name',
								'google-site-kit'
							) }
							description={ __(
								'Time it takes for the page to load',
								'google-site-kit'
							) }
							mobileMetric={
								mobile?.field?.largestContentfulPaint
							}
							desktopMetric={
								desktop?.field?.largestContentfulPaint
							}
						/>
						<MetricRow
							title={ _x(
								'Cumulative Layout Shift',
								'core web vitals name',
								'google-site-kit'
							) }
							description={ __(
								'How stable the elements on the page are',
								'google-site-kit'
							) }
							mobileMetric={
								mobile?.field?.cumulativeLayoutShift
							}
							desktopMetric={
								desktop?.field?.cumulativeLayoutShift
							}
						/>
						<MetricRow
							title={ _x(
								'Interaction to Next Paint',
								'core web vitals name',
								'google-site-kit'
							) }
							description={ __(
								'How quickly your page responds when people interact with it',
								'google-site-kit'
							) }
							mobileMetric={
								mobile?.field?.interactionToNextPaint
							}
							desktopMetric={
								desktop?.field?.interactionToNextPaint
							}
							isLast
						/>
					</MetricSection>
				</View>
			) }
		</Fragment>
	);
}

const DashboardPageSpeedWidgetPDF: FC< PDFWidgetComponentProps > = ( {
	data,
} ) => {
	const speedData = data as SpeedPDFData[ 'data' ] | null | undefined;

	return (
		<View>
			<Text style={ styles.widgetHeading }>
				{ __( 'Your site performance', 'google-site-kit' ) }
			</Text>
			{ ! speedData || ( ! speedData.mobile && ! speedData.desktop ) ? (
				<View
					style={ [
						styles.sectionWidgetCard,
						styles.sectionWidgetCardLast,
					] }
				>
					<Text style={ styles.unavailableSection }>
						{ __( 'Data unavailable.', 'google-site-kit' ) }
					</Text>
				</View>
			) : (
				<SpeedMetricSections
					mobile={ speedData.mobile }
					desktop={ speedData.desktop }
				/>
			) }
		</View>
	);
};

export default DashboardPageSpeedWidgetPDF;
