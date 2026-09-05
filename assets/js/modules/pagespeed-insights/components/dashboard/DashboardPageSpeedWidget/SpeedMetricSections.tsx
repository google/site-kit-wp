/**
 * DashboardPageSpeedWidget PDF SpeedMetricSections component.
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
 * WordPress dependencies
 */
import { Fragment } from '@wordpress/element';
import { __, _x } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import { createPDFStyles } from '@/js/components/pdf-export/pdf-scale';
import PDFCard from '@/js/components/pdf-export/shared-react-pdf-components/PDFCard';
import { FieldMetrics } from '@/js/modules/pagespeed-insights/components/common/reportMetrics';
import { StrategyData } from './getPDFData';
import MetricRow from './MetricRow';
import MetricSection from './MetricSection';

const styles = createPDFStyles( {
	// The section header and the metric rows own the padding, so the card
	// sets none and its radius wraps both.
	card: {
		padding: 0,
	},
	secondCard: {
		padding: 0,
		marginTop: 15,
	},
} );

interface SpeedMetricSectionsProps {
	/** The mobile strategy's metrics, or null when the mobile report failed. */
	mobile: StrategyData | null;
	/** The desktop strategy's metrics, or null when the desktop report failed. */
	desktop: StrategyData | null;
}

interface RealUserMetricRow {
	key: keyof FieldMetrics;
	title: string;
	description: string;
}

const allRealUserMetricRows: RealUserMetricRow[] = [
	{
		key: 'largestContentfulPaint',
		title: _x(
			'Largest Contentful Paint',
			'core web vitals name',
			'google-site-kit'
		),
		description: __(
			'Time it takes for the page to load',
			'google-site-kit'
		),
	},
	{
		key: 'cumulativeLayoutShift',
		title: _x(
			'Cumulative Layout Shift',
			'core web vitals name',
			'google-site-kit'
		),
		description: __(
			'How stable the elements on the page are',
			'google-site-kit'
		),
	},
	{
		key: 'interactionToNextPaint',
		title: _x(
			'Interaction to Next Paint',
			'core web vitals name',
			'google-site-kit'
		),
		description: __(
			'How quickly your page responds when people interact with it',
			'google-site-kit'
		),
	},
];

export default function SpeedMetricSections( {
	mobile,
	desktop,
}: SpeedMetricSectionsProps ) {
	const realUserMetricRows = allRealUserMetricRows.filter(
		( { key } ) => mobile?.field?.[ key ] || desktop?.field?.[ key ]
	);

	return (
		<Fragment>
			<PDFCard style={ styles.card }>
				<MetricSection title={ __( 'Lab data', 'google-site-kit' ) }>
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
						mobileMetric={ mobile?.lab.largestContentfulPaint }
						desktopMetric={ desktop?.lab.largestContentfulPaint }
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
						mobileMetric={ mobile?.lab.cumulativeLayoutShift }
						desktopMetric={ desktop?.lab.cumulativeLayoutShift }
					/>
					<MetricRow
						title={ __( 'Total Blocking Time', 'google-site-kit' ) }
						description={ __(
							'How long people had to wait after the page loaded before they could click something',
							'google-site-kit'
						) }
						mobileMetric={ mobile?.lab.totalBlockingTime }
						desktopMetric={ desktop?.lab.totalBlockingTime }
						isLast
					/>
				</MetricSection>
			</PDFCard>
			{ !! realUserMetricRows.length && (
				<PDFCard style={ styles.secondCard }>
					<MetricSection
						title={ __( 'Real user data', 'google-site-kit' ) }
					>
						{ realUserMetricRows.map(
							( { key, title, description }, index ) => (
								<MetricRow
									key={ key }
									title={ title }
									description={ description }
									mobileMetric={ mobile?.field?.[ key ] }
									desktopMetric={ desktop?.field?.[ key ] }
									isLast={
										index === realUserMetricRows.length - 1
									}
								/>
							)
						) }
					</MetricSection>
				</PDFCard>
			) }
		</Fragment>
	);
}
