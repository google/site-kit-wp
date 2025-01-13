/**
 * Widgets API defaults
 *
 * Site Kit by Google, Copyright 2021 Google LLC
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
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import * as WIDGET_CONTEXTS from './default-contexts';
import * as WIDGET_AREAS from './default-areas';
import {
	CORE_USER,
	allKeyMetricsTileWidgets,
	keyMetricsGA4Widgets,
} from '../datastore/user/constants';
import { WIDGET_AREA_STYLES } from './datastore/constants';
import { CORE_MODULES } from '../modules/datastore/constants';
import { CORE_SITE } from '../datastore/site/constants';
import {
	KeyMetricsSetupCTAWidget,
	ChangeMetricsLink,
} from '../../components/KeyMetrics';
import AddMetricCTATile from '../../components/KeyMetrics/AddMetricCTATile';
import KeyMetricsNewBadge from '../../components/KeyMetrics/KeyMetricsNewBadge';
import MetricsWidgetSubtitle from '../../components/KeyMetrics/MetricsWidgetSubtitle';
import ConnectGA4CTAWidget from '../../modules/analytics-4/components/widgets/ConnectGA4CTAWidget';
import {
	AudienceAreaFooter,
	ChangeGroupsLink,
} from '../../modules/analytics-4/components/audience-segmentation/dashboard';
import { isFeatureEnabled } from '../../features';
import { BREAKPOINT_SMALL } from '../../hooks/useBreakpoint';
import ConversionReportingNotificationCTAWidget from '../../components/KeyMetrics/ConversionReportingNotificationCTAWidget';
import { MODULES_ANALYTICS_4 } from '../../modules/analytics-4/datastore/constants';

const { ...ADDITIONAL_WIDGET_CONTEXTS } = WIDGET_CONTEXTS;

const { ...ADDITIONAL_WIDGET_AREAS } = WIDGET_AREAS;

/**
 * Defines default widget areas for a given context
 * and registers non-module specific widgets.
 *
 * @since 1.12.0
 *
 * @param {Object} widgetsAPI Widgets API.
 */
export function registerDefaults( widgetsAPI ) {
	const isConversionReportingEnabled = isFeatureEnabled(
		'conversionReporting'
	);

	const {
		// Main dashboard
		CONTEXT_MAIN_DASHBOARD_KEY_METRICS,
		CONTEXT_MAIN_DASHBOARD_TRAFFIC,
		CONTEXT_MAIN_DASHBOARD_CONTENT,
		CONTEXT_MAIN_DASHBOARD_SPEED,
		CONTEXT_MAIN_DASHBOARD_MONETIZATION,
		// Entity dashboard
		CONTEXT_ENTITY_DASHBOARD_TRAFFIC,
		CONTEXT_ENTITY_DASHBOARD_CONTENT,
		CONTEXT_ENTITY_DASHBOARD_SPEED,
		CONTEXT_ENTITY_DASHBOARD_MONETIZATION,
	} = ADDITIONAL_WIDGET_CONTEXTS;

	const {
		// Main dashboard
		AREA_MAIN_DASHBOARD_KEY_METRICS_PRIMARY,
		AREA_MAIN_DASHBOARD_TRAFFIC_PRIMARY,
		AREA_MAIN_DASHBOARD_TRAFFIC_AUDIENCE_SEGMENTATION,
		AREA_MAIN_DASHBOARD_CONTENT_PRIMARY,
		AREA_MAIN_DASHBOARD_SPEED_PRIMARY,
		AREA_MAIN_DASHBOARD_MONETIZATION_PRIMARY,
		// Entity dashboard
		AREA_ENTITY_DASHBOARD_TRAFFIC_PRIMARY,
		AREA_ENTITY_DASHBOARD_CONTENT_PRIMARY,
		AREA_ENTITY_DASHBOARD_SPEED_PRIMARY,
		AREA_ENTITY_DASHBOARD_MONETIZATION_PRIMARY,
	} = ADDITIONAL_WIDGET_AREAS;

	/*
	 * Main dashboard areas.
	 */

	widgetsAPI.registerWidgetArea(
		AREA_MAIN_DASHBOARD_KEY_METRICS_PRIMARY,
		{
			title: (
				<Fragment>
					{ __( 'Key metrics', 'google-site-kit' ) }
					<KeyMetricsNewBadge />
				</Fragment>
			),
			subtitle: MetricsWidgetSubtitle,
			style: WIDGET_AREA_STYLES.BOXES,
			priority: 1,
			CTA: ChangeMetricsLink,
			filterActiveWidgets( select, areaWidgets ) {
				// Prevent showing only one widget tile in this area when
				// only Search Console is shared.
				// See: https://github.com/google/site-kit-wp/issues/7435
				if (
					areaWidgets.length === 1 &&
					allKeyMetricsTileWidgets.includes( areaWidgets[ 0 ].slug )
				) {
					return [];
				}

				return areaWidgets;
			},
		},
		CONTEXT_MAIN_DASHBOARD_KEY_METRICS
	);

	widgetsAPI.registerWidgetArea(
		AREA_MAIN_DASHBOARD_TRAFFIC_PRIMARY,
		{
			title: __(
				'Find out how your audience is growing',
				'google-site-kit'
			),
			subtitle: __(
				'Track your site’s traffic over time',
				'google-site-kit'
			),
			style: WIDGET_AREA_STYLES.BOXES,
			priority: 1,
		},
		CONTEXT_MAIN_DASHBOARD_TRAFFIC
	);

	if ( isFeatureEnabled( 'audienceSegmentation' ) ) {
		widgetsAPI.registerWidgetArea(
			AREA_MAIN_DASHBOARD_TRAFFIC_AUDIENCE_SEGMENTATION,
			{
				subtitle: __(
					'Understand how different visitor groups interact with your site',
					'google-site-kit'
				),
				hasNewBadge: true,
				style: WIDGET_AREA_STYLES.BOXES,
				priority: 2,
				CTA: ChangeGroupsLink,
				Footer: AudienceAreaFooter,
				filterActiveWidgets( select, areaWidgets ) {
					const isAudienceSegmentationWidgetHidden =
						select(
							CORE_USER
						).isAudienceSegmentationWidgetHidden();

					if (
						isAudienceSegmentationWidgetHidden === undefined ||
						isAudienceSegmentationWidgetHidden
					) {
						return [];
					}

					return areaWidgets;
				},
			},
			CONTEXT_MAIN_DASHBOARD_TRAFFIC
		);
	}

	widgetsAPI.registerWidgetArea(
		AREA_MAIN_DASHBOARD_CONTENT_PRIMARY,
		{
			title: __( 'See how your content is doing', 'google-site-kit' ),
			subtitle: __(
				'Keep track of your most popular pages and how people found them from Search',
				'google-site-kit'
			),
			style: WIDGET_AREA_STYLES.BOXES,
			priority: 1,
		},
		CONTEXT_MAIN_DASHBOARD_CONTENT
	);

	widgetsAPI.registerWidgetArea(
		AREA_MAIN_DASHBOARD_SPEED_PRIMARY,
		{
			title: __(
				'Find out how visitors experience your site',
				'google-site-kit'
			),
			subtitle: __(
				'Keep track of how fast your pages are and get specific recommendations on what to improve',
				'google-site-kit'
			),
			style: WIDGET_AREA_STYLES.BOXES,
			priority: 1,
		},
		CONTEXT_MAIN_DASHBOARD_SPEED
	);

	widgetsAPI.registerWidgetArea(
		AREA_MAIN_DASHBOARD_MONETIZATION_PRIMARY,
		{
			title: __(
				'Find out how much you’re earning from your content',
				'google-site-kit'
			),
			subtitle: __(
				'Track your AdSense revenue over time',
				'google-site-kit'
			),
			style: WIDGET_AREA_STYLES.BOXES,
			priority: 1,
		},
		CONTEXT_MAIN_DASHBOARD_MONETIZATION
	);

	/*
	 * Entity dashboard areas.
	 */

	widgetsAPI.registerWidgetArea(
		AREA_ENTITY_DASHBOARD_TRAFFIC_PRIMARY,
		{
			title: __(
				'Find out how your audience is growing',
				'google-site-kit'
			),
			subtitle: __(
				'Track traffic to this page over time',
				'google-site-kit'
			),
			style: WIDGET_AREA_STYLES.BOXES,
			priority: 1,
		},
		CONTEXT_ENTITY_DASHBOARD_TRAFFIC
	);

	widgetsAPI.registerWidgetArea(
		AREA_ENTITY_DASHBOARD_CONTENT_PRIMARY,
		{
			title: __( 'See how your content is doing', 'google-site-kit' ),
			subtitle: __(
				'Understand how people found this page from Search',
				'google-site-kit'
			),
			style: WIDGET_AREA_STYLES.BOXES,
			priority: 1,
		},
		CONTEXT_ENTITY_DASHBOARD_CONTENT
	);

	widgetsAPI.registerWidgetArea(
		AREA_ENTITY_DASHBOARD_SPEED_PRIMARY,
		{
			title: __(
				'Find out how visitors experience this page',
				'google-site-kit'
			),
			subtitle: __(
				'Keep track of how fast your page is and get specific recommendations on what to improve',
				'google-site-kit'
			),
			style: WIDGET_AREA_STYLES.BOXES,
			priority: 1,
		},
		CONTEXT_ENTITY_DASHBOARD_SPEED
	);

	widgetsAPI.registerWidgetArea(
		AREA_ENTITY_DASHBOARD_MONETIZATION_PRIMARY,
		{
			title: __(
				'Find out how much you’re earning from your content',
				'google-site-kit'
			),
			subtitle: __(
				'Track your AdSense revenue over time',
				'google-site-kit'
			),
			style: WIDGET_AREA_STYLES.BOXES,
			priority: 1,
		},
		CONTEXT_ENTITY_DASHBOARD_MONETIZATION
	);

	widgetsAPI.registerWidget(
		'keyMetricsSetupCTA',
		{
			Component: KeyMetricsSetupCTAWidget,
			width: [ widgetsAPI.WIDGET_WIDTHS.FULL ],
			priority: 1,
			wrapWidget: false,
			modules: [ 'search-console' ],
			isActive: ( select ) =>
				select( CORE_USER ).isAuthenticated() &&
				select( CORE_SITE ).isKeyMetricsSetupCompleted() === false,
		},
		[ AREA_MAIN_DASHBOARD_KEY_METRICS_PRIMARY ]
	);

	/**
	 * This widget is only shown if the GA4 module is not connected,
	 * AND if the user has four KMW tiles dependent on GA4.
	 * If the user has selected less than four KMW tiles dependent on GA4,
	 * we show the `ConnectGA4CTATileWidget` instead.
	 */
	widgetsAPI.registerWidget(
		'keyMetricsConnectGA4All',
		{
			Component: ConnectGA4CTAWidget,
			width: [ widgetsAPI.WIDGET_WIDTHS.FULL ],
			priority: 1,
			wrapWidget: false,
			modules: [ 'search-console' ],
			isActive: ( select ) => {
				const keyMetrics = select( CORE_USER ).getKeyMetrics();
				const isGA4Connected =
					select( CORE_MODULES ).isModuleConnected( 'analytics-4' );

				if ( isGA4Connected || ! Array.isArray( keyMetrics ) ) {
					return false;
				}
				const kmAnalyticsWidgetCount = keyMetrics.filter(
					( keyMetric ) => keyMetricsGA4Widgets.includes( keyMetric )
				).length;

				return kmAnalyticsWidgetCount > 3;
			},
		},
		[ AREA_MAIN_DASHBOARD_KEY_METRICS_PRIMARY ]
	);

	/**
	 * Since we allow selecting at least two and at most four key
	 * metrics, we're adding two instances of the same AddMetricCTATile
	 * widget. Using the isActive property, we'll show one
	 * AddMetricCTATile widget if the user has selected three
	 * key metrics, or both if they have selected two key metrics.
	 */
	widgetsAPI.registerWidget(
		'keyMetricsAddMetricFirst',
		{
			Component: AddMetricCTATile,
			width: [ widgetsAPI.WIDGET_WIDTHS.QUARTER ],
			priority: 3, // GA4 tiles are 1, SC tiles are 2, so these should always be at the end.
			wrapWidget: false,
			isActive: ( select ) => {
				const keyMetrics = select( CORE_USER ).getKeyMetrics();

				if ( ! Array.isArray( keyMetrics ) || keyMetrics.length < 2 ) {
					return false;
				}

				return keyMetrics.length < 4;
			},
		},
		[ AREA_MAIN_DASHBOARD_KEY_METRICS_PRIMARY ]
	);

	widgetsAPI.registerWidget(
		'keyMetricsAddMetricSecond',
		{
			Component: AddMetricCTATile,
			width: [ widgetsAPI.WIDGET_WIDTHS.QUARTER ],
			priority: 3, // GA4 tiles are 1, SC tiles are 2, so these should always be at the end.
			wrapWidget: false,
			isActive: ( select ) => {
				const keyMetrics = select( CORE_USER ).getKeyMetrics();

				if ( ! Array.isArray( keyMetrics ) || keyMetrics.length < 2 ) {
					return false;
				}

				return keyMetrics.length < 3;
			},
		},
		[ AREA_MAIN_DASHBOARD_KEY_METRICS_PRIMARY ]
	);

	if ( isConversionReportingEnabled ) {
		widgetsAPI.registerWidget(
			'keyMetricsAddMetricThird',
			{
				Component: AddMetricCTATile,
				width: [ widgetsAPI.WIDGET_WIDTHS.QUARTER ],
				priority: 3, // GA4 tiles are 1, SC tiles are 2, so these should always be at the end.
				wrapWidget: false,
				isActive: ( select ) => {
					const keyMetrics = select( CORE_USER ).getKeyMetrics();

					if (
						! Array.isArray( keyMetrics ) ||
						keyMetrics.length < 5
					) {
						return false;
					}

					return keyMetrics.length < 8;
				},
			},
			[ AREA_MAIN_DASHBOARD_KEY_METRICS_PRIMARY ]
		);

		widgetsAPI.registerWidget(
			'keyMetricsAddMetricFourth',
			{
				Component: AddMetricCTATile,
				width: [ widgetsAPI.WIDGET_WIDTHS.QUARTER ],
				priority: 3, // GA4 tiles are 1, SC tiles are 2, so these should always be at the end.
				wrapWidget: false,
				hideOnBreakpoints: [ BREAKPOINT_SMALL ],
				isActive: ( select ) => {
					const keyMetrics = select( CORE_USER ).getKeyMetrics();

					if (
						! Array.isArray( keyMetrics ) ||
						keyMetrics.length < 5
					) {
						return false;
					}

					return keyMetrics.length < 7;
				},
			},
			[ AREA_MAIN_DASHBOARD_KEY_METRICS_PRIMARY ]
		);

		widgetsAPI.registerWidget(
			'keyMetricsAddMetricFifth',
			{
				Component: AddMetricCTATile,
				width: [ widgetsAPI.WIDGET_WIDTHS.QUARTER ],
				priority: 3, // GA4 tiles are 1, SC tiles are 2, so these should always be at the end.
				wrapWidget: false,
				hideOnBreakpoints: [ BREAKPOINT_SMALL ],
				isActive: ( select ) => {
					const keyMetrics = select( CORE_USER ).getKeyMetrics();

					if (
						! Array.isArray( keyMetrics ) ||
						keyMetrics.length < 5
					) {
						return false;
					}

					return keyMetrics.length < 6;
				},
			},
			[ AREA_MAIN_DASHBOARD_KEY_METRICS_PRIMARY ]
		);

		widgetsAPI.registerWidget(
			'keyMetricsEventDetectionCalloutNotification',
			{
				Component: ConversionReportingNotificationCTAWidget,
				width: [ widgetsAPI.WIDGET_WIDTHS.FULL ],
				priority: 0,
				modules: [ 'analytics-4' ],
				isActive: ( select ) => {
					if ( ! isFeatureEnabled( 'conversionReporting' ) ) {
						return false;
					}

					if (
						! select(
							MODULES_ANALYTICS_4
						).hasNewConversionReportingEvents() &&
						! select(
							MODULES_ANALYTICS_4
						).hasLostConversionReportingEvents()
					) {
						return false;
					}

					return true;
				},
			},
			[ AREA_MAIN_DASHBOARD_KEY_METRICS_PRIMARY ]
		);
	}
}
