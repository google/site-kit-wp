/**
 * `modules/analytics-4` data store constants.
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

export const MODULES_ANALYTICS_4 = 'modules/analytics-4';

// A special Account ID value used for the "Set up a new account" option.
export const ACCOUNT_CREATE = 'account_create';

// A special Property ID value used for the "Set up a new property" option.
export const PROPERTY_CREATE = 'property_create';

export const WEBDATASTREAM_CREATE = 'webdatastream_create';

export const FORM_SETUP = 'analyticsSetup';

export const MAX_WEBDATASTREAMS_PER_BATCH = 10;

// Date range offset days for Analytics 4 report requests.
export const DATE_RANGE_OFFSET = 1;

export const GTM_SCOPE = 'https://www.googleapis.com/auth/tagmanager.readonly';

export const ENHANCED_MEASUREMENT_FORM = 'enhanced-measurement-form';
export const ENHANCED_MEASUREMENT_ENABLED = 'enhanced-measurement-enabled';
export const ENHANCED_MEASUREMENT_SHOULD_DISMISS_ACTIVATION_BANNER =
	'enhanced-measurement-should-dismiss-activation-banner';

// Form ID for the account creation form.
export const FORM_ACCOUNT_CREATE = 'analyticsAccountCreate';

export const FORM_CUSTOM_DIMENSIONS_CREATE = 'analyticsCustomDimensionsCreate';

// OAuth scope required for provisioning a Google Analytics account.
export const PROVISIONING_SCOPE =
	'https://www.googleapis.com/auth/analytics.provision';
export const EDIT_SCOPE = 'https://www.googleapis.com/auth/analytics.edit';

// Dashboard widget constants.
export const UI_DIMENSION_NAME = 'dashboardAllTrafficWidgetDimensionName';
export const UI_DIMENSION_COLOR = 'dashboardAllTrafficWidgetDimensionColor';
export const UI_DIMENSION_VALUE = 'dashboardAllTrafficWidgetDimensionValue';
export const UI_ACTIVE_ROW_INDEX = 'dashboardAllTrafficWidgetActiveRowIndex';
export const UI_ALL_TRAFFIC_LOADED = 'dashboardAllTrafficWidgetLoaded';

// Note: names and descriptions are not translated as these are not surfaced in Site Kit
// and are also subject to hard limits on the length which would be unpredictable if translated.
// See https://developers.google.com/analytics/devguides/config/admin/v1/rest/v1beta/properties.customDimensions#CustomDimension
export const CUSTOM_DIMENSION_DEFINITIONS = {
	googlesitekit_post_date: {
		parameterName: 'googlesitekit_post_date',
		displayName: 'WordPress Post Date',
		description: 'Created by Site Kit: Date when a post was published',
		scope: 'EVENT',
	},
	googlesitekit_post_author: {
		parameterName: 'googlesitekit_post_author',
		displayName: 'WordPress Post Author',
		description: 'Created by Site Kit: WordPress name of the post author',
		scope: 'EVENT',
	},
	googlesitekit_post_categories: {
		parameterName: 'googlesitekit_post_categories',
		displayName: 'WordPress Post Categories',
		description:
			'Created by Site Kit: Names of categories assigned to a post',
		scope: 'EVENT',
	},
	googlesitekit_post_type: {
		parameterName: 'googlesitekit_post_type',
		displayName: 'WordPress Post Type',
		description: 'Created by Site Kit: Content type of a post',
		scope: 'EVENT',
	},
};

// Audience enums.
export const AUDIENCE_FILTER_CLAUSE_TYPE_ENUM = {
	AUDIENCE_CLAUSE_TYPE_UNSPECIFIED: 'AUDIENCE_CLAUSE_TYPE_UNSPECIFIED',
	INCLUDE: 'INCLUDE',
	EXCLUDE: 'EXCLUDE',
};

export const AUDIENCE_FILTER_SCOPE_ENUM = {
	AUDIENCE_FILTER_SCOPE_UNSPECIFIED: 'AUDIENCE_FILTER_SCOPE_UNSPECIFIED',
	AUDIENCE_FILTER_SCOPE_WITHIN_SAME_EVENT:
		'AUDIENCE_FILTER_SCOPE_WITHIN_SAME_EVENT',
	AUDIENCE_FILTER_SCOPE_WITHIN_SAME_SESSION:
		'AUDIENCE_FILTER_SCOPE_WITHIN_SAME_SESSION',
	AUDIENCE_FILTER_SCOPE_ACROSS_ALL_SESSIONS:
		'AUDIENCE_FILTER_SCOPE_ACROSS_ALL_SESSIONS',
};

export const SITE_KIT_AUDIENCE_DEFINITIONS = {
	'new-visitors': {
		description: 'People who visited the site for the first time',
		displayName: 'New visitors',
		membershipDurationDays: -1, // The longest duration, 540 days.
		filterClauses: [
			{
				clauseType: 'INCLUDE',
				simpleFilter: {
					scope: 'AUDIENCE_FILTER_SCOPE_ACROSS_ALL_SESSIONS',
					filterExpression: {
						andGroup: {
							filterExpressions: [
								{
									orGroup: {
										filterExpressions: [
											{
												dimensionOrMetricFilter: {
													fieldName: 'newVsReturning',
													stringFilter: {
														matchType: 'EXACT',
														value: 'new',
													},
												},
											},
										],
									},
								},
								{
									orGroup: {
										filterExpressions: [
											{
												notExpression: {
													dimensionOrMetricFilter: {
														fieldName: 'groupId',
														stringFilter: {
															matchType: 'EXACT',
															value: 'created_by_googlesitekit:new_visitors',
														},
													},
												},
											},
										],
									},
								},
							],
						},
					},
				},
			},
		],
	},
	'returning-visitors': {
		description: 'People who have visited your site at least once before',
		displayName: 'Returning visitors',
		membershipDurationDays: -1, // The longest duration, 540 days.
		filterClauses: [
			{
				clauseType: 'INCLUDE',
				simpleFilter: {
					scope: 'AUDIENCE_FILTER_SCOPE_ACROSS_ALL_SESSIONS',
					filterExpression: {
						andGroup: {
							filterExpressions: [
								{
									orGroup: {
										filterExpressions: [
											{
												dimensionOrMetricFilter: {
													fieldName: 'newVsReturning',
													stringFilter: {
														matchType: 'EXACT',
														value: 'returning',
													},
												},
											},
										],
									},
								},
								{
									orGroup: {
										filterExpressions: [
											{
												notExpression: {
													dimensionOrMetricFilter: {
														fieldName: 'groupId',
														stringFilter: {
															matchType: 'EXACT',
															value: 'created_by_googlesitekit:returning_visitors',
														},
													},
												},
											},
										],
									},
								},
							],
						},
					},
				},
			},
		],
	},
};

export const AUDIENCE_SEGMENTATION_SETUP_FORM = 'audiencePermissionsSetup';
