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
} from './components/dashboard';
import { ModulePopularPagesWidgetGA4 } from './components/module';
import {
	AudienceTilesWidget,
	ConnectAnalyticsCTAWidget,
	InfoNoticeWidget,
	SecondaryUserSetupWidget,
} from './components/audience-segmentation/dashboard';
import DashboardMainEffectComponent from './components/DashboardMainEffectComponent';
import { CORE_MODULES } from '../../googlesitekit/modules/datastore/constants';
import AudienceSegmentationSetupSuccessSubtleNotification, {
	AUDIENCE_SEGMENTATION_SETUP_SUCCESS_NOTIFICATION,
} from './components/audience-segmentation/dashboard/AudienceSegmentationSetupSuccessSubtleNotification';
import { NOTIFICATION_AREAS } from '../../googlesitekit/notifications/datastore/constants';
import { VIEW_CONTEXT_MAIN_DASHBOARD } from '../../googlesitekit/constants';
import { isFeatureEnabled } from '../../features';
import WebDataStreamNotAvailableNotification, {
	WEB_DATA_STREAM_NOT_AVAILABLE_NOTIFICATION,
} from '../../components/notifications/WebDataStreamNotAvailableNotification';
import { CORE_SITE } from '../../googlesitekit/datastore/site/constants';

export { registerStore } from './datastore';

export const registerModule = ( modules ) => {
	modules.registerModule( 'analytics-4', {
		storeName: MODULES_ANALYTICS_4,
		SettingsEditComponent: SettingsEdit,
		SettingsViewComponent: SettingsView,
		SetupComponent: SetupMain,
		DashboardMainEffectComponent,
		Icon: AnalyticsIcon,
		features: [
			__( 'Audience overview', 'google-site-kit' ),
			__( 'Top pages', 'google-site-kit' ),
			__( 'Top acquisition channels', 'google-site-kit' ),
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
			modules: [ 'analytics-4' ],
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
			modules: [ 'analytics-4' ],
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
			modules: [ 'analytics-4' ],
			isActive: ( select ) => {
				const isAnalyticsConnected =
					select( CORE_MODULES ).isModuleConnected( 'analytics-4' );

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
			modules: [ 'analytics-4' ],
			isActive: ( select ) => {
				const isAnalyticsConnected =
					select( CORE_MODULES ).isModuleConnected( 'analytics-4' );
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
			modules: [ 'analytics-4' ],
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
			modules: [ 'analytics-4' ],
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
			modules: [ 'analytics-4' ],
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
			modules: [ 'analytics-4' ],
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
			modules: [ 'analytics-4' ],
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
			modules: [ 'analytics-4' ],
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
			modules: [ 'analytics-4' ],
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
			modules: [ 'analytics-4' ],
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
			modules: [ 'analytics-4' ],
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
			modules: [ 'analytics-4' ],
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
			modules: [ 'analytics-4' ],
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
			modules: [ 'analytics-4' ],
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
			modules: [ 'analytics-4' ],
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
			modules: [ 'analytics-4' ],
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
			modules: [ 'analytics-4' ],
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
			modules: [ 'analytics-4' ],
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
			modules: [ 'analytics-4' ],
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
			modules: [ 'analytics-4' ],
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
			modules: [ 'analytics-4' ],
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
			modules: [ 'analytics-4' ],
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
			modules: [ 'analytics-4' ],
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
			modules: [ 'analytics-4' ],
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
			modules: [ 'analytics-4' ],
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
			modules: [ 'analytics-4' ],
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
			modules: [ 'analytics-4' ],
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
			modules: [ 'analytics-4' ],
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
			modules: [ 'analytics-4' ],
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
			modules: [ 'analytics-4' ],
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
			modules: [ 'analytics-4' ],
			isActive: ( select ) =>
				select( CORE_USER ).isKeyMetricActive(
					KM_ANALYTICS_TOP_COUNTRIES
				),
		},
		[ AREA_MAIN_DASHBOARD_KEY_METRICS_PRIMARY ]
	);
};

export const registerNotifications = ( notifications ) => {
	if ( isFeatureEnabled( 'audienceSegmentation' ) ) {
		notifications.registerNotification(
			AUDIENCE_SEGMENTATION_SETUP_SUCCESS_NOTIFICATION,
			{
				Component: AudienceSegmentationSetupSuccessSubtleNotification,
				priority: 10,
				areaSlug: NOTIFICATION_AREAS.BANNERS_BELOW_NAV,
				viewContexts: [ VIEW_CONTEXT_MAIN_DASHBOARD ],
				checkRequirements: async ( { select, resolveSelect } ) => {
					const analyticsConnected = await resolveSelect(
						CORE_MODULES
					).isModuleConnected( 'analytics-4' );

					if ( ! analyticsConnected ) {
						return false;
					}

					await resolveSelect( MODULES_ANALYTICS_4 ).getSettings();
					const configuredAudiences =
						select( CORE_USER ).getConfiguredAudiences();

					// Only show this notification if the user has a set of configured audiences.
					return Array.isArray( configuredAudiences );
				},
				isDismissible: true,
			}
		);
	}

	notifications.registerNotification(
		WEB_DATA_STREAM_NOT_AVAILABLE_NOTIFICATION,
		{
			Component: WebDataStreamNotAvailableNotification,
			priority: 10,
			areaSlug: NOTIFICATION_AREAS.BANNERS_ABOVE_NAV,
			viewContexts: [ VIEW_CONTEXT_MAIN_DASHBOARD ],
			isDismissible: true,
			checkRequirements: async ( { select, resolveSelect } ) => {
				await Promise.all( [
					// The isAuthenticated(), hasScope() and getUnsatisfiedScopes() selectors
					// rely on the resolution of the getAuthentication() resolver.
					resolveSelect( CORE_USER ).getAuthentication(),
					// The isModuleConnected() selector relies on the resolution
					// of the getModules() resolver.
					resolveSelect( CORE_MODULES ).getModules(),
					// The hasScope() selector relies on the resolution
					// of the getUser() resolver.
					resolveSelect( CORE_USER ).getUser(),
					// The getOwnerID() selector relies on the resolution
					// of the getConnection() resolver.
					resolveSelect( CORE_SITE ).getConnection(),
				] );

				const ga4ModuleConnected =
					select( CORE_MODULES ).isModuleConnected( 'analytics-4' );
				const hasGTMScope = select( CORE_USER ).hasScope( GTM_SCOPE );

				const loggedInUserID = select( CORE_USER ).getID();
				const ga4OwnerID = select( MODULES_ANALYTICS_4 ).getOwnerID();
				const isGA4ModuleOwner = () => {
					// Bail early if we're in view-only dashboard or the GA4 module is not connected.
					if ( ! ga4ModuleConnected ) {
						return false;
					}

					return ga4OwnerID === loggedInUserID;
				};

				const isWebDataStreamAvailable =
					select( MODULES_ANALYTICS_4 ).isWebDataStreamAvailable();

				return (
					ga4ModuleConnected &&
					hasGTMScope &&
					isGA4ModuleOwner &&
					! isWebDataStreamAvailable
				);
			},
		}
	);
};
