/**
 * Analytics module widget registrations.
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
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import lazyWithPreload from '@/js/components/pdf-export/lazy-with-preload';
import { isFeatureEnabled } from '@/js/features';
import {
	CORE_USER,
	KM_ANALYTICS_ENGAGED_TRAFFIC_SOURCE,
	KM_ANALYTICS_FORM_COMPLETION_ENGAGEMENT_RATE,
	KM_ANALYTICS_FORM_COMPLETION_RATE,
	KM_ANALYTICS_LEADS_BY_COUNTRIES,
	KM_ANALYTICS_LEADS_BY_DEVICE_TYPE,
	KM_ANALYTICS_LEADS_BY_VISITOR_TYPE,
	KM_ANALYTICS_LEAST_ENGAGING_PAGES,
	KM_ANALYTICS_MOST_ENGAGING_PAGES,
	KM_ANALYTICS_NEW_VISITORS,
	KM_ANALYTICS_PAGES_PER_VISIT,
	KM_ANALYTICS_POPULAR_AUTHORS,
	KM_ANALYTICS_POPULAR_CONTENT,
	KM_ANALYTICS_POPULAR_PRODUCTS,
	KM_ANALYTICS_RETURNING_VISITORS,
	KM_ANALYTICS_SALES_BY_COUNTRIES,
	KM_ANALYTICS_SALES_BY_VISITOR_TYPE,
	KM_ANALYTICS_SALES_ENGAGEMENT_RATE,
	KM_ANALYTICS_SALES_RATE,
	KM_ANALYTICS_TOP_AUTHORS_DRIVING_LEADS,
	KM_ANALYTICS_TOP_AUTHORS_DRIVING_SALES,
	KM_ANALYTICS_TOP_CATEGORIES,
	KM_ANALYTICS_TOP_CITIES,
	KM_ANALYTICS_TOP_CITIES_DRIVING_ADD_TO_CART,
	KM_ANALYTICS_TOP_CITIES_DRIVING_LEADS,
	KM_ANALYTICS_TOP_CITIES_DRIVING_PURCHASES,
	KM_ANALYTICS_TOP_CONVERTING_TRAFFIC_SOURCE,
	KM_ANALYTICS_TOP_COUNTRIES,
	KM_ANALYTICS_TOP_DEVICE_DRIVING_PURCHASES,
	KM_ANALYTICS_TOP_PAGES_DRIVING_LEADS,
	KM_ANALYTICS_TOP_PAGES_DRIVING_SALES,
	KM_ANALYTICS_TOP_RECENT_TRENDING_PAGES,
	KM_ANALYTICS_TOP_RETURNING_VISITOR_PAGES,
	KM_ANALYTICS_TOP_TRAFFIC_CHANNELS_DRIVING_FORM_COMPLETION_RATE,
	KM_ANALYTICS_TOP_TRAFFIC_CHANNELS_DRIVING_SALES_RATE,
	KM_ANALYTICS_TOP_TRAFFIC_SOURCE,
	KM_ANALYTICS_TOP_TRAFFIC_SOURCE_DRIVING_ADD_TO_CART,
	KM_ANALYTICS_TOP_TRAFFIC_SOURCE_DRIVING_LEADS,
	KM_ANALYTICS_TOP_TRAFFIC_SOURCE_DRIVING_PURCHASES,
	KM_ANALYTICS_TOTAL_FORM_COMPLETIONS,
	KM_ANALYTICS_TOTAL_SALES,
	KM_ANALYTICS_VISITS_PER_VISITOR,
	KM_ANALYTICS_VISIT_LENGTH,
} from '@/js/googlesitekit/datastore/user/constants';
import { CORE_MODULES } from '@/js/googlesitekit/modules/datastore/constants';
import {
	AREA_ENTITY_DASHBOARD_CONTENT_PRIMARY,
	AREA_ENTITY_DASHBOARD_TRAFFIC_PRIMARY,
	AREA_MAIN_DASHBOARD_CONTENT_PRIMARY,
	AREA_MAIN_DASHBOARD_KEY_METRICS_PRIMARY,
	AREA_MAIN_DASHBOARD_SITE_GOALS_PRIMARY,
	AREA_MAIN_DASHBOARD_TRAFFIC_AUDIENCE_SEGMENTATION,
	AREA_MAIN_DASHBOARD_TRAFFIC_PRIMARY,
} from '@/js/googlesitekit/widgets/default-areas';
import {
	AudienceSegmentationBackNotice,
	AudienceTilesWidget,
	ConnectAnalyticsCTAWidget,
	InfoNoticeWidget,
	PrimaryUserSetupWidget,
	SecondaryUserSetupWidget,
} from '@/js/modules/analytics-4/components/audience-segmentation/dashboard';
import { AUDIENCE_SEGMENTATION_BACK_NOTICE_SLUG } from '@/js/modules/analytics-4/components/audience-segmentation/dashboard/AudienceSegmentationBackNotice';
import { AUDIENCE_SEGMENTATION_SETUP_DISMISSED_SLUG } from '@/js/modules/analytics-4/components/audience-segmentation/dashboard/AudienceSelectionPanel/constants';
import getAudienceTilesPDFData from '@/js/modules/analytics-4/components/audience-segmentation/dashboard/AudienceTilesWidget/getPDFData';
import {
	DashboardAllTrafficWidgetGA4,
	DashboardOverallPageMetricsWidgetGA4,
} from '@/js/modules/analytics-4/components/dashboard';
import getAllTrafficPDFData from '@/js/modules/analytics-4/components/dashboard/DashboardAllTrafficWidgetGA4/getPDFData';
import { ModulePopularPagesWidgetGA4 } from '@/js/modules/analytics-4/components/module';
import getModulePopularPagesPDFData from '@/js/modules/analytics-4/components/module/ModulePopularPagesWidgetGA4/getPDFData';
import { GOAL_TYPES } from '@/js/modules/analytics-4/components/site-goals/goal-drivers/constants';
import {
	LeadGenerationPerformanceWidget,
	OnlineStorePerformanceWidget,
} from '@/js/modules/analytics-4/components/site-goals/widgets';
import {
	EngagedTrafficSourceWidget,
	FormCompletionEngagementRateWidget,
	FormCompletionRateWidget,
	LeadsByCountriesWidget,
	LeadsByDeviceTypeWidget,
	LeadsByVisitorTypeWidget,
	LeastEngagingPagesWidget,
	MostEngagingPagesWidget,
	NewVisitorsWidget,
	PagesPerVisitWidget,
	PopularAuthorsWidget,
	PopularContentWidget,
	PopularProductsWidget,
	ReturningVisitorsWidget,
	SalesByCountriesWidget,
	SalesByVisitorTypeWidget,
	SalesEngagementRateWidget,
	SalesRateWidget,
	TopAuthorsDrivingLeadsWidget,
	TopAuthorsDrivingSalesWidget,
	TopCategoriesWidget,
	TopCitiesDrivingAddToCartWidget,
	TopCitiesDrivingLeadsWidget,
	TopCitiesDrivingPurchasesWidget,
	TopCitiesWidget,
	TopConvertingTrafficSourceWidget,
	TopCountriesWidget,
	TopDeviceDrivingPurchasesWidget,
	TopPagesDrivingLeadsWidget,
	TopPagesDrivingSalesWidget,
	TopRecentTrendingPagesWidget,
	TopReturningVisitorPages,
	TopTrafficChannelsDrivingFormCompletionRateWidget,
	TopTrafficChannelsDrivingSalesRateWidget,
	TopTrafficSourceDrivingAddToCartWidget,
	TopTrafficSourceDrivingLeadsWidget,
	TopTrafficSourceDrivingPurchasesWidget,
	TopTrafficSourceWidget,
	TotalFormCompletionsWidget,
	TotalSalesWidget,
	VisitLengthWidget,
	VisitsPerVisitorWidget,
} from '@/js/modules/analytics-4/components/widgets';
import ConversionReportingNotificationCTAWidget from '@/js/modules/analytics-4/components/widgets/ConversionReportingNotificationCTAWidget';
import { MODULE_SLUG_ANALYTICS_4 } from '@/js/modules/analytics-4/constants';
import { MODULES_ANALYTICS_4 } from '@/js/modules/analytics-4/datastore/constants';

/**
 * Lazy-loaded PDF component for the Your visitor groups widget.
 */
const PDFYourVisitorGroups = lazyWithPreload( () =>
	import(
		/* webpackChunkName: "googlesitekit-vendor-lazy-pdf" */
		'@/js/modules/analytics-4/components/audience-segmentation/dashboard/AudienceTilesWidget/PDFYourVisitorGroups'
	)
);

const DashboardAllTrafficWidgetGA4PDF = lazyWithPreload( () =>
	import(
		/* webpackChunkName: "googlesitekit-vendor-lazy-pdf" */
		'@/js/modules/analytics-4/components/dashboard/DashboardAllTrafficWidgetGA4/indexPDF'
	)
);

/**
 * Lazy-loaded PDF component for the Top content over time widget.
 */
const ModulePopularPagesWidgetGA4PDF = lazyWithPreload( () =>
	import(
		/* webpackChunkName: "googlesitekit-vendor-lazy-pdf" */
		'@/js/modules/analytics-4/components/module/ModulePopularPagesWidgetGA4/ModulePopularPagesWidgetGA4PDF'
	)
);

export function registerWidgets( widgets ) {
	// Register Analytics 4 Widgets.
	widgets.registerWidget(
		'analyticsAllTrafficGA4',
		{
			Component: DashboardAllTrafficWidgetGA4,
			width: widgets.WIDGET_WIDTHS.FULL,
			priority: 1,
			wrapWidget: false,
			modules: [ MODULE_SLUG_ANALYTICS_4 ],
			pdf: {
				Component: DashboardAllTrafficWidgetGA4PDF,
				getData: getAllTrafficPDFData,
				label: __( 'Site traffic over time', 'google-site-kit' ),
			},
		},
		[
			AREA_MAIN_DASHBOARD_TRAFFIC_PRIMARY,
			AREA_ENTITY_DASHBOARD_TRAFFIC_PRIMARY,
		]
	);

	if ( isFeatureEnabled( 'setupFlowRefresh' ) ) {
		widgets.registerWidget(
			'analyticsAudienceSegmentationBackNotice',
			{
				Component: AudienceSegmentationBackNotice,
				width: widgets.WIDGET_WIDTHS.FULL,
				priority: 0,
				wrapWidget: false,
				modules: [ MODULE_SLUG_ANALYTICS_4 ],
				isActive: ( select ) => {
					const isWidgetHidden =
						select(
							CORE_USER
						).getRawAudienceSegmentationWidgetHidden();
					const isDismissed = select( CORE_USER ).isItemDismissed(
						AUDIENCE_SEGMENTATION_BACK_NOTICE_SLUG
					);

					return isWidgetHidden === true && isDismissed === false;
				},
			},
			[ AREA_MAIN_DASHBOARD_TRAFFIC_AUDIENCE_SEGMENTATION ]
		);
	}

	widgets.registerWidget(
		'analyticsAudienceTiles',
		{
			Component: AudienceTilesWidget,
			width: widgets.WIDGET_WIDTHS.FULL,
			priority: 1,
			wrapWidget: false,
			modules: [ MODULE_SLUG_ANALYTICS_4 ],
			isActive: ( select ) => {
				if (
					! select( CORE_USER ).hasAccessToShareableModule(
						MODULE_SLUG_ANALYTICS_4
					)
				) {
					return false;
				}

				const configuredAudiences =
					select( CORE_USER ).getConfiguredAudiences();
				return !! configuredAudiences;
			},
			pdf: {
				Component: PDFYourVisitorGroups,
				getData: getAudienceTilesPDFData,
				label: __( 'Visitor groups', 'google-site-kit' ),
				// The PDF row needs two cards, so it renders only for two or
				// more audiences. The dashboard tile keeps its own `isActive`,
				// which allows a single audience.
				isActive: ( select ) =>
					( select( CORE_USER ).getConfiguredAudiences()?.length ??
						0 ) >= 2,
			},
		},
		[ AREA_MAIN_DASHBOARD_TRAFFIC_AUDIENCE_SEGMENTATION ]
	);

	widgets.registerWidget(
		'analyticsAudienceSecondaryUserSetup',
		{
			Component: SecondaryUserSetupWidget,
			width: widgets.WIDGET_WIDTHS.FULL,
			priority: 1,
			wrapWidget: false,
			modules: [ MODULE_SLUG_ANALYTICS_4 ],
			isActive: ( select ) => {
				const hasAccessToShareableModule = select(
					CORE_USER
				).hasAccessToShareableModule( MODULE_SLUG_ANALYTICS_4 );

				if ( ! hasAccessToShareableModule ) {
					return false;
				}

				const isAnalyticsConnected = select(
					CORE_MODULES
				).isModuleConnected( MODULE_SLUG_ANALYTICS_4 );

				if ( ! isAnalyticsConnected ) {
					return false;
				}

				const isItemDismissed = select( CORE_USER ).isItemDismissed(
					AUDIENCE_SEGMENTATION_SETUP_DISMISSED_SLUG
				);

				if ( isItemDismissed !== false ) {
					return false;
				}

				const availableAudiences =
					select( MODULES_ANALYTICS_4 ).getAvailableAudiences();

				const configuredAudiences =
					select( CORE_USER ).getConfiguredAudiences();

				const audienceSegmentationSetupCompletedBy =
					select(
						MODULES_ANALYTICS_4
					).getAudienceSegmentationSetupCompletedBy();

				return (
					availableAudiences?.length &&
					configuredAudiences === null &&
					audienceSegmentationSetupCompletedBy !== null
				);
			},
		},
		[ AREA_MAIN_DASHBOARD_TRAFFIC_AUDIENCE_SEGMENTATION ]
	);

	widgets.registerWidget(
		'analyticsAudiencePrimaryUserSetup',
		{
			Component: PrimaryUserSetupWidget,
			width: widgets.WIDGET_WIDTHS.FULL,
			priority: 1,
			wrapWidget: false,
			modules: [ MODULE_SLUG_ANALYTICS_4 ],
			isActive: ( select ) => {
				if ( ! isFeatureEnabled( 'setupFlowRefresh' ) ) {
					return false;
				}

				const hasAccessToShareableModule = select(
					CORE_USER
				).hasAccessToShareableModule( MODULE_SLUG_ANALYTICS_4 );

				if ( ! hasAccessToShareableModule ) {
					return false;
				}

				const isAnalyticsConnected = select(
					CORE_MODULES
				).isModuleConnected( MODULE_SLUG_ANALYTICS_4 );

				if ( ! isAnalyticsConnected ) {
					return false;
				}

				const isItemDismissed = select( CORE_USER ).isItemDismissed(
					AUDIENCE_SEGMENTATION_SETUP_DISMISSED_SLUG
				);

				if ( isItemDismissed !== false ) {
					return false;
				}

				const isAnalyticsSetupComplete =
					select( CORE_USER ).isAnalyticsSetupComplete();

				const audienceSegmentationSetupCompletedBy =
					select(
						MODULES_ANALYTICS_4
					).getAudienceSegmentationSetupCompletedBy();

				return (
					isAnalyticsSetupComplete &&
					! audienceSegmentationSetupCompletedBy
				);
			},
		},
		[ AREA_MAIN_DASHBOARD_TRAFFIC_AUDIENCE_SEGMENTATION ]
	);

	widgets.registerWidget(
		'audienceConnectAnalyticsCTA',
		{
			Component: ConnectAnalyticsCTAWidget,
			width: widgets.WIDGET_WIDTHS.FULL,
			priority: 1,
			wrapWidget: false,
			modules: [ MODULE_SLUG_ANALYTICS_4 ],
			isActive: ( select ) => {
				if (
					! select( CORE_USER ).hasAccessToShareableModule(
						MODULE_SLUG_ANALYTICS_4
					)
				) {
					return false;
				}

				const isAnalyticsConnected = select(
					CORE_MODULES
				).isModuleConnected( MODULE_SLUG_ANALYTICS_4 );
				const configuredAudiences =
					select( CORE_USER ).getConfiguredAudiences();
				const isAudienceSegmentationWidgetHidden =
					select( CORE_USER ).isAudienceSegmentationWidgetHidden();

				return (
					configuredAudiences?.length > 0 &&
					isAudienceSegmentationWidgetHidden === false &&
					! isAnalyticsConnected
				);
			},
		},
		[ AREA_MAIN_DASHBOARD_TRAFFIC_AUDIENCE_SEGMENTATION ]
	);

	widgets.registerWidget(
		'analyticsAudienceInfoNotice',
		{
			Component: InfoNoticeWidget,
			width: widgets.WIDGET_WIDTHS.FULL,
			priority: 2,
			wrapWidget: false,
			modules: [ MODULE_SLUG_ANALYTICS_4 ],
		},
		[ AREA_MAIN_DASHBOARD_TRAFFIC_AUDIENCE_SEGMENTATION ]
	);

	widgets.registerWidget(
		'analyticsOverallPageMetricsGA4',
		{
			Component: DashboardOverallPageMetricsWidgetGA4,
			width: widgets.WIDGET_WIDTHS.FULL,
			priority: 3,
			wrapWidget: false,
			modules: [ MODULE_SLUG_ANALYTICS_4 ],
		},
		[ AREA_ENTITY_DASHBOARD_CONTENT_PRIMARY ]
	);

	widgets.registerWidget(
		'analyticsModulePopularPagesGA4',
		{
			Component: ModulePopularPagesWidgetGA4,
			width: widgets.WIDGET_WIDTHS.FULL,
			priority: 4,
			wrapWidget: false,
			modules: [ MODULE_SLUG_ANALYTICS_4 ],
			pdf: {
				Component: ModulePopularPagesWidgetGA4PDF,
				getData: getModulePopularPagesPDFData,
				label: __( 'Top content', 'google-site-kit' ),
			},
		},
		[ AREA_MAIN_DASHBOARD_CONTENT_PRIMARY ]
	);

	/*
	 * Key metrics widgets.
	 */
	widgets.registerWidget(
		KM_ANALYTICS_TOP_RECENT_TRENDING_PAGES,
		{
			Component: TopRecentTrendingPagesWidget,
			width: widgets.WIDGET_WIDTHS.QUARTER,
			priority: 1,
			wrapWidget: false,
			modules: [ MODULE_SLUG_ANALYTICS_4 ],
			isActive: ( select ) =>
				select( CORE_USER ).isKeyMetricActive(
					KM_ANALYTICS_TOP_RECENT_TRENDING_PAGES
				),
		},
		[ AREA_MAIN_DASHBOARD_KEY_METRICS_PRIMARY ]
	);

	widgets.registerWidget(
		KM_ANALYTICS_POPULAR_AUTHORS,
		{
			Component: PopularAuthorsWidget,
			width: widgets.WIDGET_WIDTHS.QUARTER,
			priority: 1,
			wrapWidget: false,
			modules: [ MODULE_SLUG_ANALYTICS_4 ],
			isActive: ( select ) =>
				select( CORE_USER ).isKeyMetricActive(
					KM_ANALYTICS_POPULAR_AUTHORS
				),
		},
		[ AREA_MAIN_DASHBOARD_KEY_METRICS_PRIMARY ]
	);

	widgets.registerWidget(
		KM_ANALYTICS_TOP_CATEGORIES,
		{
			Component: TopCategoriesWidget,
			width: widgets.WIDGET_WIDTHS.QUARTER,
			priority: 1,
			wrapWidget: false,
			modules: [ MODULE_SLUG_ANALYTICS_4 ],
			isActive: ( select ) =>
				select( CORE_USER ).isKeyMetricActive(
					KM_ANALYTICS_TOP_CATEGORIES
				),
		},
		[ AREA_MAIN_DASHBOARD_KEY_METRICS_PRIMARY ]
	);

	widgets.registerWidget(
		KM_ANALYTICS_POPULAR_CONTENT,
		{
			Component: PopularContentWidget,
			width: widgets.WIDGET_WIDTHS.QUARTER,
			priority: 1,
			wrapWidget: false,
			modules: [ MODULE_SLUG_ANALYTICS_4 ],
			isActive: ( select ) =>
				select( CORE_USER ).isKeyMetricActive(
					KM_ANALYTICS_POPULAR_CONTENT
				),
		},
		[ AREA_MAIN_DASHBOARD_KEY_METRICS_PRIMARY ]
	);

	widgets.registerWidget(
		KM_ANALYTICS_POPULAR_PRODUCTS,
		{
			Component: PopularProductsWidget,
			width: widgets.WIDGET_WIDTHS.QUARTER,
			priority: 1,
			wrapWidget: false,
			modules: [ MODULE_SLUG_ANALYTICS_4 ],
			isActive: ( select ) =>
				select( CORE_USER ).isKeyMetricActive(
					KM_ANALYTICS_POPULAR_PRODUCTS
				),
		},
		[ AREA_MAIN_DASHBOARD_KEY_METRICS_PRIMARY ]
	);

	widgets.registerWidget(
		KM_ANALYTICS_PAGES_PER_VISIT,
		{
			Component: PagesPerVisitWidget,
			width: widgets.WIDGET_WIDTHS.QUARTER,
			priority: 1,
			wrapWidget: false,
			modules: [ MODULE_SLUG_ANALYTICS_4 ],
			isActive: ( select ) =>
				select( CORE_USER ).isKeyMetricActive(
					KM_ANALYTICS_PAGES_PER_VISIT
				),
		},
		[ AREA_MAIN_DASHBOARD_KEY_METRICS_PRIMARY ]
	);

	widgets.registerWidget(
		KM_ANALYTICS_VISIT_LENGTH,
		{
			Component: VisitLengthWidget,
			width: widgets.WIDGET_WIDTHS.QUARTER,
			priority: 1,
			wrapWidget: false,
			modules: [ MODULE_SLUG_ANALYTICS_4 ],
			isActive: ( select ) =>
				select( CORE_USER ).isKeyMetricActive(
					KM_ANALYTICS_VISIT_LENGTH
				),
		},
		[ AREA_MAIN_DASHBOARD_KEY_METRICS_PRIMARY ]
	);

	widgets.registerWidget(
		KM_ANALYTICS_VISITS_PER_VISITOR,
		{
			Component: VisitsPerVisitorWidget,
			width: widgets.WIDGET_WIDTHS.QUARTER,
			priority: 1,
			wrapWidget: false,
			modules: [ MODULE_SLUG_ANALYTICS_4 ],
			isActive: ( select ) =>
				select( CORE_USER ).isKeyMetricActive(
					KM_ANALYTICS_VISITS_PER_VISITOR
				),
		},
		[ AREA_MAIN_DASHBOARD_KEY_METRICS_PRIMARY ]
	);

	widgets.registerWidget(
		KM_ANALYTICS_MOST_ENGAGING_PAGES,
		{
			Component: MostEngagingPagesWidget,
			width: widgets.WIDGET_WIDTHS.QUARTER,
			priority: 1,
			wrapWidget: false,
			modules: [ MODULE_SLUG_ANALYTICS_4 ],
			isActive: ( select ) =>
				select( CORE_USER ).isKeyMetricActive(
					KM_ANALYTICS_MOST_ENGAGING_PAGES
				),
		},
		[ AREA_MAIN_DASHBOARD_KEY_METRICS_PRIMARY ]
	);

	widgets.registerWidget(
		KM_ANALYTICS_LEAST_ENGAGING_PAGES,
		{
			Component: LeastEngagingPagesWidget,
			width: widgets.WIDGET_WIDTHS.QUARTER,
			priority: 1,
			wrapWidget: false,
			modules: [ MODULE_SLUG_ANALYTICS_4 ],
			isActive: ( select ) =>
				select( CORE_USER ).isKeyMetricActive(
					KM_ANALYTICS_LEAST_ENGAGING_PAGES
				),
		},
		[ AREA_MAIN_DASHBOARD_KEY_METRICS_PRIMARY ]
	);

	widgets.registerWidget(
		KM_ANALYTICS_TOP_RETURNING_VISITOR_PAGES,
		{
			Component: TopReturningVisitorPages,
			width: widgets.WIDGET_WIDTHS.QUARTER,
			priority: 1,
			wrapWidget: false,
			modules: [ MODULE_SLUG_ANALYTICS_4 ],
			isActive: ( select ) =>
				select( CORE_USER ).isKeyMetricActive(
					KM_ANALYTICS_TOP_RETURNING_VISITOR_PAGES
				),
		},
		[ AREA_MAIN_DASHBOARD_KEY_METRICS_PRIMARY ]
	);

	widgets.registerWidget(
		KM_ANALYTICS_NEW_VISITORS,
		{
			Component: NewVisitorsWidget,
			width: widgets.WIDGET_WIDTHS.QUARTER,
			priority: 1,
			wrapWidget: false,
			modules: [ MODULE_SLUG_ANALYTICS_4 ],
			isActive: ( select ) =>
				select( CORE_USER ).isKeyMetricActive(
					KM_ANALYTICS_NEW_VISITORS
				),
		},
		[ AREA_MAIN_DASHBOARD_KEY_METRICS_PRIMARY ]
	);

	widgets.registerWidget(
		KM_ANALYTICS_RETURNING_VISITORS,
		{
			Component: ReturningVisitorsWidget,
			width: widgets.WIDGET_WIDTHS.QUARTER,
			priority: 1,
			wrapWidget: false,
			modules: [ MODULE_SLUG_ANALYTICS_4 ],
			isActive: ( select ) =>
				select( CORE_USER ).isKeyMetricActive(
					KM_ANALYTICS_RETURNING_VISITORS
				),
		},
		[ AREA_MAIN_DASHBOARD_KEY_METRICS_PRIMARY ]
	);

	widgets.registerWidget(
		KM_ANALYTICS_TOP_TRAFFIC_SOURCE,
		{
			Component: TopTrafficSourceWidget,
			width: widgets.WIDGET_WIDTHS.QUARTER,
			priority: 1,
			wrapWidget: false,
			modules: [ MODULE_SLUG_ANALYTICS_4 ],
			isActive: ( select ) =>
				select( CORE_USER ).isKeyMetricActive(
					KM_ANALYTICS_TOP_TRAFFIC_SOURCE
				),
		},
		[ AREA_MAIN_DASHBOARD_KEY_METRICS_PRIMARY ]
	);

	widgets.registerWidget(
		KM_ANALYTICS_TOP_TRAFFIC_SOURCE_DRIVING_ADD_TO_CART,
		{
			Component: TopTrafficSourceDrivingAddToCartWidget,
			width: widgets.WIDGET_WIDTHS.QUARTER,
			priority: 1,
			wrapWidget: false,
			modules: [ MODULE_SLUG_ANALYTICS_4 ],
			isActive: ( select ) =>
				select( CORE_USER ).isKeyMetricActive(
					KM_ANALYTICS_TOP_TRAFFIC_SOURCE_DRIVING_ADD_TO_CART
				),
		},
		[ AREA_MAIN_DASHBOARD_KEY_METRICS_PRIMARY ]
	);

	widgets.registerWidget(
		KM_ANALYTICS_TOP_TRAFFIC_SOURCE_DRIVING_LEADS,
		{
			Component: TopTrafficSourceDrivingLeadsWidget,
			width: widgets.WIDGET_WIDTHS.QUARTER,
			priority: 1,
			wrapWidget: false,
			modules: [ MODULE_SLUG_ANALYTICS_4 ],
			isActive: ( select ) =>
				select( CORE_USER ).isKeyMetricActive(
					KM_ANALYTICS_TOP_TRAFFIC_SOURCE_DRIVING_LEADS
				),
		},
		[ AREA_MAIN_DASHBOARD_KEY_METRICS_PRIMARY ]
	);

	widgets.registerWidget(
		KM_ANALYTICS_TOP_TRAFFIC_SOURCE_DRIVING_PURCHASES,
		{
			Component: TopTrafficSourceDrivingPurchasesWidget,
			width: widgets.WIDGET_WIDTHS.QUARTER,
			priority: 1,
			wrapWidget: false,
			modules: [ MODULE_SLUG_ANALYTICS_4 ],
			isActive: ( select ) =>
				select( CORE_USER ).isKeyMetricActive(
					KM_ANALYTICS_TOP_TRAFFIC_SOURCE_DRIVING_PURCHASES
				),
		},
		[ AREA_MAIN_DASHBOARD_KEY_METRICS_PRIMARY ]
	);

	widgets.registerWidget(
		KM_ANALYTICS_ENGAGED_TRAFFIC_SOURCE,
		{
			Component: EngagedTrafficSourceWidget,
			width: widgets.WIDGET_WIDTHS.QUARTER,
			priority: 1,
			wrapWidget: false,
			modules: [ MODULE_SLUG_ANALYTICS_4 ],
			isActive: ( select ) =>
				select( CORE_USER ).isKeyMetricActive(
					KM_ANALYTICS_ENGAGED_TRAFFIC_SOURCE
				),
		},
		[ AREA_MAIN_DASHBOARD_KEY_METRICS_PRIMARY ]
	);

	widgets.registerWidget(
		KM_ANALYTICS_TOP_CONVERTING_TRAFFIC_SOURCE,
		{
			Component: TopConvertingTrafficSourceWidget,
			width: widgets.WIDGET_WIDTHS.QUARTER,
			priority: 1,
			wrapWidget: false,
			modules: [ MODULE_SLUG_ANALYTICS_4 ],
			isActive: ( select ) =>
				select( CORE_USER ).isKeyMetricActive(
					KM_ANALYTICS_TOP_CONVERTING_TRAFFIC_SOURCE
				),
		},
		[ AREA_MAIN_DASHBOARD_KEY_METRICS_PRIMARY ]
	);

	widgets.registerWidget(
		KM_ANALYTICS_TOP_CITIES,
		{
			Component: TopCitiesWidget,
			width: widgets.WIDGET_WIDTHS.QUARTER,
			priority: 1,
			wrapWidget: false,
			modules: [ MODULE_SLUG_ANALYTICS_4 ],
			isActive: ( select ) =>
				select( CORE_USER ).isKeyMetricActive(
					KM_ANALYTICS_TOP_CITIES
				),
		},
		[ AREA_MAIN_DASHBOARD_KEY_METRICS_PRIMARY ]
	);

	widgets.registerWidget(
		KM_ANALYTICS_TOP_CITIES_DRIVING_LEADS,
		{
			Component: TopCitiesDrivingLeadsWidget,
			width: widgets.WIDGET_WIDTHS.QUARTER,
			priority: 1,
			wrapWidget: false,
			modules: [ MODULE_SLUG_ANALYTICS_4 ],
			isActive: ( select ) =>
				select( CORE_USER ).isKeyMetricActive(
					KM_ANALYTICS_TOP_CITIES_DRIVING_LEADS
				),
		},
		[ AREA_MAIN_DASHBOARD_KEY_METRICS_PRIMARY ]
	);

	widgets.registerWidget(
		KM_ANALYTICS_TOP_PAGES_DRIVING_LEADS,
		{
			Component: TopPagesDrivingLeadsWidget,
			width: widgets.WIDGET_WIDTHS.QUARTER,
			priority: 1,
			wrapWidget: false,
			modules: [ MODULE_SLUG_ANALYTICS_4 ],
			isActive: ( select ) =>
				select( CORE_USER ).isKeyMetricActive(
					KM_ANALYTICS_TOP_PAGES_DRIVING_LEADS
				),
		},
		[ AREA_MAIN_DASHBOARD_KEY_METRICS_PRIMARY ]
	);

	widgets.registerWidget(
		KM_ANALYTICS_TOP_CITIES_DRIVING_ADD_TO_CART,
		{
			Component: TopCitiesDrivingAddToCartWidget,
			width: widgets.WIDGET_WIDTHS.QUARTER,
			priority: 1,
			wrapWidget: false,
			modules: [ MODULE_SLUG_ANALYTICS_4 ],
			isActive: ( select ) =>
				select( CORE_USER ).isKeyMetricActive(
					KM_ANALYTICS_TOP_CITIES_DRIVING_ADD_TO_CART
				),
		},
		[ AREA_MAIN_DASHBOARD_KEY_METRICS_PRIMARY ]
	);

	widgets.registerWidget(
		KM_ANALYTICS_TOP_CITIES_DRIVING_PURCHASES,
		{
			Component: TopCitiesDrivingPurchasesWidget,
			width: widgets.WIDGET_WIDTHS.QUARTER,
			priority: 1,
			wrapWidget: false,
			modules: [ MODULE_SLUG_ANALYTICS_4 ],
			isActive: ( select ) =>
				select( CORE_USER ).isKeyMetricActive(
					KM_ANALYTICS_TOP_CITIES_DRIVING_PURCHASES
				),
		},
		[ AREA_MAIN_DASHBOARD_KEY_METRICS_PRIMARY ]
	);

	widgets.registerWidget(
		KM_ANALYTICS_TOP_DEVICE_DRIVING_PURCHASES,
		{
			Component: TopDeviceDrivingPurchasesWidget,
			width: widgets.WIDGET_WIDTHS.QUARTER,
			priority: 1,
			wrapWidget: false,
			modules: [ MODULE_SLUG_ANALYTICS_4 ],
			isActive: ( select ) =>
				select( CORE_USER ).isKeyMetricActive(
					KM_ANALYTICS_TOP_DEVICE_DRIVING_PURCHASES
				),
		},
		[ AREA_MAIN_DASHBOARD_KEY_METRICS_PRIMARY ]
	);

	[
		{
			slug: KM_ANALYTICS_TOTAL_SALES,
			Component: TotalSalesWidget,
		},
		{
			slug: KM_ANALYTICS_SALES_RATE,
			Component: SalesRateWidget,
		},
		{
			slug: KM_ANALYTICS_SALES_ENGAGEMENT_RATE,
			Component: SalesEngagementRateWidget,
		},
		{
			slug: KM_ANALYTICS_TOP_TRAFFIC_CHANNELS_DRIVING_SALES_RATE,
			Component: TopTrafficChannelsDrivingSalesRateWidget,
		},
		{
			slug: KM_ANALYTICS_SALES_BY_VISITOR_TYPE,
			Component: SalesByVisitorTypeWidget,
		},
		{
			slug: KM_ANALYTICS_SALES_BY_COUNTRIES,
			Component: SalesByCountriesWidget,
		},
		{
			slug: KM_ANALYTICS_TOP_AUTHORS_DRIVING_SALES,
			Component: TopAuthorsDrivingSalesWidget,
		},
		{
			slug: KM_ANALYTICS_TOP_PAGES_DRIVING_SALES,
			Component: TopPagesDrivingSalesWidget,
		},
		{
			slug: KM_ANALYTICS_TOTAL_FORM_COMPLETIONS,
			Component: TotalFormCompletionsWidget,
		},
		{
			slug: KM_ANALYTICS_FORM_COMPLETION_RATE,
			Component: FormCompletionRateWidget,
		},
		{
			slug: KM_ANALYTICS_FORM_COMPLETION_ENGAGEMENT_RATE,
			Component: FormCompletionEngagementRateWidget,
		},
		{
			slug: KM_ANALYTICS_TOP_TRAFFIC_CHANNELS_DRIVING_FORM_COMPLETION_RATE,
			Component: TopTrafficChannelsDrivingFormCompletionRateWidget,
		},
		{
			slug: KM_ANALYTICS_LEADS_BY_VISITOR_TYPE,
			Component: LeadsByVisitorTypeWidget,
		},
		{
			slug: KM_ANALYTICS_LEADS_BY_COUNTRIES,
			Component: LeadsByCountriesWidget,
		},
		{
			slug: KM_ANALYTICS_LEADS_BY_DEVICE_TYPE,
			Component: LeadsByDeviceTypeWidget,
		},
		{
			slug: KM_ANALYTICS_TOP_AUTHORS_DRIVING_LEADS,
			Component: TopAuthorsDrivingLeadsWidget,
		},
	].forEach( ( { slug, Component } ) => {
		widgets.registerWidget(
			slug,
			{
				Component,
				width: widgets.WIDGET_WIDTHS.QUARTER,
				priority: 1,
				wrapWidget: false,
				modules: [ MODULE_SLUG_ANALYTICS_4 ],
				isActive: ( select ) =>
					select( CORE_USER ).isKeyMetricActive( slug ),
			},
			[ AREA_MAIN_DASHBOARD_KEY_METRICS_PRIMARY ]
		);
	} );

	widgets.registerWidget(
		KM_ANALYTICS_TOP_COUNTRIES,
		{
			Component: TopCountriesWidget,
			width: widgets.WIDGET_WIDTHS.QUARTER,
			priority: 1,
			wrapWidget: false,
			modules: [ MODULE_SLUG_ANALYTICS_4 ],
			isActive: ( select ) =>
				select( CORE_USER ).isKeyMetricActive(
					KM_ANALYTICS_TOP_COUNTRIES
				),
		},
		[ AREA_MAIN_DASHBOARD_KEY_METRICS_PRIMARY ]
	);

	widgets.registerWidget(
		'keyMetricsEventDetectionCalloutNotification',
		{
			Component: ConversionReportingNotificationCTAWidget,
			width: [ widgets.WIDGET_WIDTHS.FULL ],
			priority: 0,
			modules: [ MODULE_SLUG_ANALYTICS_4 ],
		},
		[ AREA_MAIN_DASHBOARD_KEY_METRICS_PRIMARY ]
	);

	/*
	 * Site Goals widgets.
	 *
	 * Not registering these widgets when the feature flag is disabled will
	 * ensure that the new Widget Area and Widget Context for Site Goals, including
	 * the Navigation chip, will not be rendered when the feature is disabled.
	 */
	if ( isFeatureEnabled( 'siteGoals' ) ) {
		widgets.registerWidget(
			'analyticsOnlineStorePerformance',
			{
				Component: OnlineStorePerformanceWidget,
				width: widgets.WIDGET_WIDTHS.FULL,
				priority: 1,
				wrapWidget: false,
				modules: [ MODULE_SLUG_ANALYTICS_4 ],
				isActive: ( select ) =>
					select( MODULES_ANALYTICS_4 ).isSiteGoalsWidgetRenderable(
						GOAL_TYPES.ECOMMERCE
					) === true,
			},
			[ AREA_MAIN_DASHBOARD_SITE_GOALS_PRIMARY ]
		);

		widgets.registerWidget(
			'analyticsLeadGenerationPerformance',
			{
				Component: LeadGenerationPerformanceWidget,
				width: widgets.WIDGET_WIDTHS.FULL,
				priority: 2,
				wrapWidget: false,
				modules: [ MODULE_SLUG_ANALYTICS_4 ],
				isActive: ( select ) =>
					select( MODULES_ANALYTICS_4 ).isSiteGoalsWidgetRenderable(
						GOAL_TYPES.LEAD
					) === true,
			},
			[ AREA_MAIN_DASHBOARD_SITE_GOALS_PRIMARY ]
		);
	}
}
