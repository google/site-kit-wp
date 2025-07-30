/**
 * Analytics-4 module initialization.
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
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import {
	EngagedTrafficSourceWidget,
	LeastEngagingPagesWidget,
	MostEngagingPagesWidget,
	NewVisitorsWidget,
	PopularContentWidget,
	PopularProductsWidget,
	ReturningVisitorsWidget,
	TopCitiesWidget,
	TopCitiesDrivingLeadsWidget,
	TopCitiesDrivingAddToCartWidget,
	TopCitiesDrivingPurchasesWidget,
	TopDeviceDrivingPurchasesWidget,
	TopCountriesWidget,
	TopTrafficSourceWidget,
	TopTrafficSourceDrivingAddToCartWidget,
	TopTrafficSourceDrivingLeadsWidget,
	TopTrafficSourceDrivingPurchasesWidget,
	TopConvertingTrafficSourceWidget,
	PagesPerVisitWidget,
	VisitLengthWidget,
	TopReturningVisitorPages,
	VisitsPerVisitorWidget,
	TopRecentTrendingPagesWidget,
	TopCategoriesWidget,
	PopularAuthorsWidget,
	TopPagesDrivingLeadsWidget,
} from './components/widgets';
import AnalyticsIcon from '../../../svg/graphics/analytics.svg';
import { GTM_SCOPE, MODULES_ANALYTICS_4 } from './datastore/constants';
import {
	AREA_MAIN_DASHBOARD_CONTENT_PRIMARY,
	AREA_MAIN_DASHBOARD_TRAFFIC_PRIMARY,
	AREA_ENTITY_DASHBOARD_TRAFFIC_PRIMARY,
	AREA_ENTITY_DASHBOARD_CONTENT_PRIMARY,
	AREA_MAIN_DASHBOARD_KEY_METRICS_PRIMARY,
	AREA_MAIN_DASHBOARD_TRAFFIC_AUDIENCE_SEGMENTATION,
} from '../../googlesitekit/widgets/default-areas';
import {
	CORE_USER,
	KM_ANALYTICS_ENGAGED_TRAFFIC_SOURCE,
	KM_ANALYTICS_LEAST_ENGAGING_PAGES,
	KM_ANALYTICS_RETURNING_VISITORS,
	KM_ANALYTICS_MOST_ENGAGING_PAGES,
	KM_ANALYTICS_NEW_VISITORS,
	KM_ANALYTICS_PAGES_PER_VISIT,
	KM_ANALYTICS_POPULAR_AUTHORS,
	KM_ANALYTICS_POPULAR_CONTENT,
	KM_ANALYTICS_POPULAR_PRODUCTS,
	KM_ANALYTICS_TOP_CATEGORIES,
	KM_ANALYTICS_TOP_CITIES,
	KM_ANALYTICS_TOP_CITIES_DRIVING_ADD_TO_CART,
	KM_ANALYTICS_TOP_CITIES_DRIVING_LEADS,
	KM_ANALYTICS_TOP_CITIES_DRIVING_PURCHASES,
	KM_ANALYTICS_TOP_DEVICE_DRIVING_PURCHASES,
	KM_ANALYTICS_TOP_CONVERTING_TRAFFIC_SOURCE,
	KM_ANALYTICS_TOP_TRAFFIC_SOURCE_DRIVING_LEADS,
	KM_ANALYTICS_TOP_COUNTRIES,
	KM_ANALYTICS_TOP_RECENT_TRENDING_PAGES,
	KM_ANALYTICS_TOP_RETURNING_VISITOR_PAGES,
	KM_ANALYTICS_TOP_TRAFFIC_SOURCE,
	KM_ANALYTICS_TOP_TRAFFIC_SOURCE_DRIVING_ADD_TO_CART,
	KM_ANALYTICS_TOP_TRAFFIC_SOURCE_DRIVING_PURCHASES,
	KM_ANALYTICS_TOP_PAGES_DRIVING_LEADS,
	KM_ANALYTICS_VISIT_LENGTH,
	KM_ANALYTICS_VISITS_PER_VISITOR,
} from '../../googlesitekit/datastore/user/constants';
import { SettingsEdit, SettingsView } from './components/settings';
import { SetupMain } from './components/setup';
import {
	DashboardAllTrafficWidgetGA4,
	DashboardOverallPageMetricsWidgetGA4,
	EnhancedMeasurementActivationBanner,
} from './components/dashboard';
import { ModulePopularPagesWidgetGA4 } from './components/module';
import {
	AudienceSegmentationIntroductoryOverlayNotification,
	AudienceTilesWidget,
	ConnectAnalyticsCTAWidget,
	InfoNoticeWidget,
	SecondaryUserSetupWidget,
} from './components/audience-segmentation/dashboard';
import DashboardMainEffectComponent from './components/DashboardMainEffectComponent';
import { CORE_MODULES } from '../../googlesitekit/modules/datastore/constants';
import {
	SITE_KIT_VIEW_ONLY_CONTEXTS,
	VIEW_CONTEXT_MAIN_DASHBOARD,
	VIEW_CONTEXT_MAIN_DASHBOARD_VIEW_ONLY,
} from '../../googlesitekit/constants';
import {
	NOTIFICATION_AREAS,
	NOTIFICATION_GROUPS,
	PRIORITY,
} from '../../googlesitekit/notifications/constants';
import AudienceSegmentationSetupCTABanner, {
	AUDIENCE_SEGMENTATION_SETUP_CTA_NOTIFICATION,
} from './components/audience-segmentation/dashboard/AudienceSegmentationSetupCTABanner';
import {
	WebDataStreamNotAvailableNotification,
	GoogleTagIDMismatchNotification,
} from './components/notifications';
import { isValidPropertyID, isValidWebDataStreamID } from './utils/validation';
import {
	LEGACY_ENHANCED_MEASUREMENT_ACTIVATION_BANNER_DISMISSED_ITEM_KEY,
	MODULE_SLUG_ANALYTICS_4,
} from './constants';
import ConversionReportingNotificationCTAWidget from './components/widgets/ConversionReportingNotificationCTAWidget';
import { AUDIENCE_SEGMENTATION_INTRODUCTORY_OVERLAY_NOTIFICATION } from './components/audience-segmentation/dashboard/AudienceSegmentationIntroductoryOverlayNotification';

export { registerStore } from './datastore';

export const registerModule = ( modules ) => {
	modules.registerModule( MODULE_SLUG_ANALYTICS_4, {
		storeName: MODULES_ANALYTICS_4,
		SettingsEditComponent: SettingsEdit,
		SettingsViewComponent: SettingsView,
		SetupComponent: SetupMain,
		DashboardMainEffectComponent,
		Icon: AnalyticsIcon,
		features: [
			__(
				'Your site will no longer send data to Google Analytics',
				'google-site-kit'
			),
			__(
				'Analytics reports in Site Kit will be disabled',
				'google-site-kit'
			),
		],
	} );
};

export const registerWidgets = ( widgets ) => {
	// Register Analytics 4 Widgets.
	widgets.registerWidget(
		'analyticsAllTrafficGA4',
		{
			Component: DashboardAllTrafficWidgetGA4,
			width: widgets.WIDGET_WIDTHS.FULL,
			priority: 1,
			wrapWidget: false,
			modules: [ MODULE_SLUG_ANALYTICS_4 ],
		},
		[
			AREA_MAIN_DASHBOARD_TRAFFIC_PRIMARY,
			AREA_ENTITY_DASHBOARD_TRAFFIC_PRIMARY,
		]
	);

	widgets.registerWidget(
		'analyticsAudienceTiles',
		{
			Component: AudienceTilesWidget,
			width: widgets.WIDGET_WIDTHS.FULL,
			priority: 1,
			wrapWidget: false,
			modules: [ MODULE_SLUG_ANALYTICS_4 ],
			isActive: ( select ) => {
				const configuredAudiences =
					select( CORE_USER ).getConfiguredAudiences();
				return !! configuredAudiences;
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
				const isAnalyticsConnected = select(
					CORE_MODULES
				).isModuleConnected( MODULE_SLUG_ANALYTICS_4 );

				// If Analytics is not connected, we can return early.
				if ( ! isAnalyticsConnected ) {
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
		'audienceConnectAnalyticsCTA',
		{
			Component: ConnectAnalyticsCTAWidget,
			width: widgets.WIDGET_WIDTHS.FULL,
			priority: 1,
			wrapWidget: false,
			modules: [ MODULE_SLUG_ANALYTICS_4 ],
			isActive: ( select ) => {
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
};

export const ANALYTICS_4_NOTIFICATIONS = {
	[ AUDIENCE_SEGMENTATION_SETUP_CTA_NOTIFICATION ]: {
		Component: AudienceSegmentationSetupCTABanner,
		priority: 130, // TODO: Revert this back to PRIORITY.SETUP_CTA_LOW after fixing https://github.com/google/site-kit-wp/issues/10890.
		areaSlug: NOTIFICATION_AREAS.DASHBOARD_TOP,
		groupID: NOTIFICATION_GROUPS.SETUP_CTAS,
		viewContexts: [ VIEW_CONTEXT_MAIN_DASHBOARD ],
		checkRequirements: async ( { select, resolveSelect } ) => {
			const analyticsConnected = await resolveSelect(
				CORE_MODULES
			).isModuleConnected( MODULE_SLUG_ANALYTICS_4 );

			if ( ! analyticsConnected ) {
				return false;
			}

			await Promise.all( [
				resolveSelect( CORE_MODULES ).isModuleConnected(
					MODULE_SLUG_ANALYTICS_4
				),
				resolveSelect( CORE_USER ).getDismissedPrompts(),
				select( CORE_USER ).getUserAudienceSettings(),
				select( MODULES_ANALYTICS_4 ).isGatheringData(),
				resolveSelect( MODULES_ANALYTICS_4 ).getAudienceSettings(),
			] );

			const isDismissed = select( CORE_USER ).isPromptDismissed(
				AUDIENCE_SEGMENTATION_SETUP_CTA_NOTIFICATION
			);

			const configuredAudiences =
				select( CORE_USER ).getConfiguredAudiences();

			const analyticsIsDataAvailableOnLoad =
				select( MODULES_ANALYTICS_4 ).isDataAvailableOnLoad();

			const audienceSegmentationSetupCompletedBy =
				select(
					MODULES_ANALYTICS_4
				).getAudienceSegmentationSetupCompletedBy();

			if (
				audienceSegmentationSetupCompletedBy !== null ||
				configuredAudiences === undefined ||
				configuredAudiences?.length ||
				! analyticsIsDataAvailableOnLoad ||
				isDismissed
			) {
				return false;
			}

			return true;
		},
		isDismissible: true,
		dismissRetries: 1,
	},
	'web-data-stream-not-available-notification': {
		Component: WebDataStreamNotAvailableNotification,
		priority: PRIORITY.ERROR_LOW,
		areaSlug: NOTIFICATION_AREAS.HEADER,
		viewContexts: [ VIEW_CONTEXT_MAIN_DASHBOARD ],
		isDismissible: true,
		checkRequirements: async ( { select, resolveSelect, dispatch } ) => {
			await Promise.all( [
				// The hasScope() selector relies on the resolution of
				// the getAuthentication() resolver.
				resolveSelect( CORE_USER ).getAuthentication(),
				// The isModuleConnected() selector relies on the resolution
				// of the getModules() resolver.
				resolveSelect( CORE_MODULES ).getModules(),
				// The getID() selector relies on the resolution
				// of the getUser() resolver.
				resolveSelect( CORE_USER ).getUser(),
				// The getOwnerID() selector relies on the resolution
				// of the getSettings() resolver.
				resolveSelect( MODULES_ANALYTICS_4 ).getSettings(),
				// Preload module data.
				resolveSelect( MODULES_ANALYTICS_4 ).getModuleData(),
				// The isWebDataStreamAvailable property is set within the
				// syncGoogleTagSettings() action.
				dispatch( MODULES_ANALYTICS_4 ).syncGoogleTagSettings(),
			] );

			const ga4ModuleConnected = select( CORE_MODULES ).isModuleConnected(
				MODULE_SLUG_ANALYTICS_4
			);
			const hasGTMScope = select( CORE_USER ).hasScope( GTM_SCOPE );

			const loggedInUserID = select( CORE_USER ).getID();
			const ga4OwnerID = select( MODULES_ANALYTICS_4 ).getOwnerID();
			const isGA4ModuleOwner =
				ga4ModuleConnected && ga4OwnerID === loggedInUserID;

			const isWebDataStreamAvailable =
				select( MODULES_ANALYTICS_4 ).isWebDataStreamAvailable();

			return (
				ga4ModuleConnected &&
				hasGTMScope &&
				isGA4ModuleOwner &&
				! isWebDataStreamAvailable
			);
		},
	},
	'google-tag-id-mismatch': {
		Component: GoogleTagIDMismatchNotification,
		priority: PRIORITY.ERROR_LOW,
		areaSlug: NOTIFICATION_AREAS.HEADER,
		viewContexts: [ VIEW_CONTEXT_MAIN_DASHBOARD ],
		isDismissible: false,
		checkRequirements: async ( { select, resolveSelect } ) => {
			await Promise.all( [
				// The hasScope() selector relies on the resolution of
				// the getAuthentication() resolver.
				resolveSelect( CORE_USER ).getAuthentication(),
				// The isModuleConnected() selector relies on the resolution
				// of the getModules() resolver.
				resolveSelect( CORE_MODULES ).getModules(),
				// The getID() selector relies on the resolution
				// of the getUser() resolver.
				resolveSelect( CORE_USER ).getUser(),
				// The getOwnerID() selector relies on the resolution
				// of the getSettings() resolver.
				resolveSelect( MODULES_ANALYTICS_4 ).getSettings(),
				resolveSelect( MODULES_ANALYTICS_4 ).getModuleData(),
			] );

			const ga4ModuleConnected = select( CORE_MODULES ).isModuleConnected(
				MODULE_SLUG_ANALYTICS_4
			);
			const hasGTMScope = select( CORE_USER ).hasScope( GTM_SCOPE );

			const loggedInUserID = select( CORE_USER ).getID();
			const ga4OwnerID = select( MODULES_ANALYTICS_4 ).getOwnerID();
			const isGA4ModuleOwner =
				ga4ModuleConnected && ga4OwnerID === loggedInUserID;

			const hasMismatchedGoogleTagID =
				select( MODULES_ANALYTICS_4 ).hasMismatchedGoogleTagID();

			return (
				ga4ModuleConnected &&
				hasGTMScope &&
				isGA4ModuleOwner &&
				hasMismatchedGoogleTagID
			);
		},
	},
	'enhanced-measurement-notification': {
		Component: EnhancedMeasurementActivationBanner,
		priority: 140, // TODO: Revert this back to PRIORITY.SETUP_CTA_LOW after fixing https://github.com/google/site-kit-wp/issues/10890.
		areaSlug: NOTIFICATION_AREAS.DASHBOARD_TOP,
		groupID: NOTIFICATION_GROUPS.SETUP_CTAS,
		viewContexts: [ VIEW_CONTEXT_MAIN_DASHBOARD ],
		isDismissible: true,
		checkRequirements: async ( { select, resolveSelect } ) => {
			await Promise.all( [
				// The isModuleConnected() selector relies on the resolution
				// of the getModules() resolver.
				resolveSelect( CORE_MODULES ).getModules(),
				// The hasModuleOwnershipOrAccess() selector relies on the resolution
				// of the getUser() resolver.
				resolveSelect( CORE_USER ).getUser(),
				// The hasModuleOwnershipOrAccess(), getPropertyID() and
				// getWebDataStreamID() selectors rely on the resolution of the
				// getSettings() resolver.
				resolveSelect( MODULES_ANALYTICS_4 ).getSettings(),
				// The isItemDismissed() selector relies on the resolution
				// of the getDismissedItems() resolver.
				resolveSelect( CORE_USER ).getDismissedItems(),
			] );

			const ga4ModuleConnected = select( CORE_MODULES ).isModuleConnected(
				MODULE_SLUG_ANALYTICS_4
			);

			const propertyID = select( MODULES_ANALYTICS_4 ).getPropertyID();

			const webDataStreamID =
				select( MODULES_ANALYTICS_4 ).getWebDataStreamID();

			const hasModuleAccess =
				ga4ModuleConnected &&
				select( CORE_MODULES ).hasModuleOwnershipOrAccess(
					MODULE_SLUG_ANALYTICS_4
				);

			// Check if the prompt with the legacy key used before the banner was refactored
			// to use the `notification ID` as the dismissal key, is dismissed.
			const isLegacyDismissed = select( CORE_USER ).isItemDismissed(
				LEGACY_ENHANCED_MEASUREMENT_ACTIVATION_BANNER_DISMISSED_ITEM_KEY
			);

			if (
				! isValidPropertyID( propertyID ) ||
				! isValidWebDataStreamID( webDataStreamID ) ||
				! hasModuleAccess ||
				isLegacyDismissed
			) {
				return false;
			}

			// The isEnhancedMeasurementStreamEnabled() selector relies on
			// the resolution of the getEnhancedMeasurementSettings() resolver.
			await resolveSelect(
				MODULES_ANALYTICS_4
			).getEnhancedMeasurementSettings( propertyID, webDataStreamID );
			const isEnhancedMeasurementStreamEnabled = select(
				MODULES_ANALYTICS_4
			).isEnhancedMeasurementStreamEnabled( propertyID, webDataStreamID );

			return isEnhancedMeasurementStreamEnabled === false;
		},
	},
	[ AUDIENCE_SEGMENTATION_INTRODUCTORY_OVERLAY_NOTIFICATION ]: {
		Component: AudienceSegmentationIntroductoryOverlayNotification,
		priority: PRIORITY.SETUP_CTA_HIGH,
		areaSlug: NOTIFICATION_AREAS.OVERLAYS,
		groupID: NOTIFICATION_GROUPS.SETUP_CTAS,
		viewContexts: [
			VIEW_CONTEXT_MAIN_DASHBOARD,
			VIEW_CONTEXT_MAIN_DASHBOARD_VIEW_ONLY,
		],
		isDismissible: true,
		checkRequirements: async ( { select, resolveSelect }, viewContext ) => {
			const ga4ModuleConnected = await resolveSelect(
				CORE_MODULES
			).isModuleConnected( MODULE_SLUG_ANALYTICS_4 );
			const ga4ModuleActive = await resolveSelect(
				CORE_MODULES
			).isModuleActive( MODULE_SLUG_ANALYTICS_4 );

			// If the module is not connected or not active, we can return early
			// to prevent additional audience settings being requested.
			if ( ! ga4ModuleConnected || ! ga4ModuleActive ) {
				return false;
			}

			const isViewOnly =
				SITE_KIT_VIEW_ONLY_CONTEXTS.includes( viewContext );

			await Promise.all( [
				// The isAudienceSegmentationWidgetHidden() selector relies on
				// the resolution of the getUserAudienceSettings() resolver.
				resolveSelect( CORE_USER ).getUserAudienceSettings(),
				// The getAudienceSegmentationSetupCompletedBy() selector relies
				// on the resolution of the getAudienceSettings() resolver.
				resolveSelect( MODULES_ANALYTICS_4 ).getAudienceSettings(),
				// The getID() selector relies on the resolution
				// of the getUser() resolver.
				resolveSelect( CORE_USER ).getUser(),
				// The canViewSharedModule() selector relies on the resolution
				// of the getCapabilities() resolver.
				isViewOnly
					? resolveSelect( CORE_USER ).getCapabilities()
					: Promise.resolve( [] ),
			] );

			const canViewModule =
				! isViewOnly ||
				select( CORE_USER ).canViewSharedModule(
					MODULE_SLUG_ANALYTICS_4
				);

			const isAudienceSegmentationWidgetHidden =
				select( CORE_USER ).isAudienceSegmentationWidgetHidden();

			const audienceSegmentationSetupCompletedBy =
				select(
					MODULES_ANALYTICS_4
				).getAudienceSegmentationSetupCompletedBy();
			const userID = select( CORE_USER ).getID();

			if (
				canViewModule &&
				isAudienceSegmentationWidgetHidden === false &&
				Number.isInteger( audienceSegmentationSetupCompletedBy ) &&
				audienceSegmentationSetupCompletedBy !== userID
			) {
				return true;
			}

			return false;
		},
	},
};

export const registerNotifications = ( notifications ) => {
	for ( const notificationID in ANALYTICS_4_NOTIFICATIONS ) {
		notifications.registerNotification(
			notificationID,
			ANALYTICS_4_NOTIFICATIONS[ notificationID ]
		);
	}
};
