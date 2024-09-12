/**
 * Audience Selection Panel Component Stories.
 *
 * Site Kit by Google, Copyright 2024 Google LLC
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
import fetchMock from 'fetch-mock';

/**
 * Internal dependencies
 */
import {
	AUDIENCE_CREATION_SUCCESS_NOTICE_SLUG,
	AUDIENCE_SELECTION_PANEL_OPENED_KEY,
} from './constants';
import { CORE_UI } from '../../../../../../googlesitekit/datastore/ui/constants';
import { CORE_USER } from '../../../../../../googlesitekit/datastore/user/constants';
import { ERROR_REASON_INSUFFICIENT_PERMISSIONS } from '../../../../../../util/errors';
import {
	AUDIENCE_ITEM_NEW_BADGE_SLUG_PREFIX,
	EDIT_SCOPE,
	MODULES_ANALYTICS_4,
} from '../../../../datastore/constants';
import {
	VIEW_CONTEXT_MAIN_DASHBOARD,
	VIEW_CONTEXT_MAIN_DASHBOARD_VIEW_ONLY,
} from '../../../../../../googlesitekit/constants';
import { availableAudiences } from './../../../../datastore/__fixtures__';
import { provideAnalytics4MockReport } from '../../../../utils/data-mock';
import {
	provideModuleRegistrations,
	provideUserAuthentication,
} from '../../../../../../../../tests/js/utils';
import { Provider as ViewContextProvider } from '../../../../../../components/Root/ViewContextContext';
import WithRegistrySetup from '../../../../../../../../tests/js/WithRegistrySetup';
import AudienceSelectionPanel from '.';

const syncAvailableAudiencesEndpoint = new RegExp(
	'^/google-site-kit/v1/modules/analytics-4/data/sync-audiences'
);

function Template( { viewContext } ) {
	return (
		<ViewContextProvider
			value={ viewContext || VIEW_CONTEXT_MAIN_DASHBOARD }
		>
			<AudienceSelectionPanel />
		</ViewContextProvider>
	);
}

export const Default = Template.bind( {} );
Default.storyName = 'Default';
Default.scenario = {
	label: 'Modules/Analytics4/Components/AudienceSegmentation/Dashboard/AudienceSelectionPanel/Default',
};

export const ViewOnlyUser = Template.bind( {} );
ViewOnlyUser.storyName = 'View-only user';
ViewOnlyUser.args = {
	viewContext: VIEW_CONTEXT_MAIN_DASHBOARD_VIEW_ONLY,
};
ViewOnlyUser.scenario = {
	label: 'Modules/Analytics4/Components/AudienceSegmentation/Dashboard/AudienceSelectionPanel/ViewOnlyUser',
};

export const WithSavedItems = Template.bind( {} );
WithSavedItems.storyName = 'With saved items';
WithSavedItems.args = {
	configuredAudiences: [
		'properties/12345/audiences/3',
		'properties/12345/audiences/4',
	],
};
WithSavedItems.scenario = {
	label: 'Modules/Analytics4/Components/AudienceSegmentation/Dashboard/AudienceSelectionPanel/WithSavedItems',
};

export const WithOneGroup = Template.bind( {} );
WithOneGroup.storyName = 'With one group selected';
WithOneGroup.args = {
	configuredAudiences: [ 'properties/12345/audiences/3' ],
};
WithOneGroup.scenario = {
	label: 'Modules/Analytics4/Components/AudienceSegmentation/Dashboard/AudienceSelectionPanel/WithOneGroup',
};

export const LoadingNoGroups = Template.bind( {} );
LoadingNoGroups.storyName = 'Loading state no groups selected';
LoadingNoGroups.args = {
	setupRegistry: () => {
		fetchMock.postOnce(
			syncAvailableAudiencesEndpoint,
			new Promise( () => {} ),
			{ overwriteRoutes: true }
		);
	},
};

export const LoadingWithGroups = Template.bind( {} );
LoadingWithGroups.storyName = 'Loading state with groups selected';
LoadingWithGroups.args = {
	configuredAudiences: [
		'properties/12345/audiences/3',
		'properties/12345/audiences/4',
	],
	setupRegistry: () => {
		fetchMock.postOnce(
			syncAvailableAudiencesEndpoint,
			new Promise( () => {} ),
			{ overwriteRoutes: true }
		);
	},
};

export const WithInsufficientPermissionsError = Template.bind( {} );
WithInsufficientPermissionsError.storyName = 'Insufficient permissions error';
WithInsufficientPermissionsError.args = {
	setupRegistry: () => {
		const error = {
			code: 'test_error',
			message: 'Error message.',
			data: { reason: ERROR_REASON_INSUFFICIENT_PERMISSIONS },
		};

		fetchMock.postOnce(
			syncAvailableAudiencesEndpoint,
			{
				body: error,
				status: 403,
			},
			{
				overwriteRoutes: true,
			}
		);
	},
};
WithInsufficientPermissionsError.scenario = {
	label: 'Modules/Analytics4/Components/AudienceSegmentation/Dashboard/AudienceSelectionPanel/WithInsufficientPermissionsError',
};

export const AudienceSyncError = Template.bind( {} );
AudienceSyncError.storyName = 'Audience sync error';
AudienceSyncError.args = {
	setupRegistry: () => {
		const error = {
			code: 'test_error',
			message: 'Error message.',
			data: {},
		};

		fetchMock.postOnce(
			syncAvailableAudiencesEndpoint,
			{
				body: error,
				status: 400,
			},
			{
				overwriteRoutes: true,
			}
		);
	},
};
AudienceSyncError.scenario = {
	label: 'Modules/Analytics4/Components/AudienceSegmentation/Dashboard/AudienceSelectionPanel/AudienceSyncError',
};

export const UserCountError = Template.bind( {} );
UserCountError.storyName = 'User count retrieval error';
UserCountError.args = {
	setupRegistry: ( registry ) => {
		const { getConfigurableAudiences, getAudiencesUserCountReportOptions } =
			registry.select( MODULES_ANALYTICS_4 );

		const error = {
			code: 'test_error',
			message: 'Error message.',
			data: {},
		};

		const configurableAudiences = getConfigurableAudiences();

		const reportOptions = getAudiencesUserCountReportOptions(
			configurableAudiences
		);

		registry
			.dispatch( MODULES_ANALYTICS_4 )
			.receiveError( error, 'getReport', [ reportOptions ] );
	},
};
UserCountError.scenario = {
	label: 'Modules/Analytics4/Components/AudienceSegmentation/Dashboard/AudienceSelectionPanel/UserCountError',
};

export const AudienceCreationNotice = Template.bind( {} );
AudienceCreationNotice.storyName = 'Audience creation notice';
AudienceCreationNotice.args = {
	configuredAudiences: availableAudiences.reduce(
		( acc, audience ) =>
			audience.audienceType !== 'SITE_KIT_AUDIENCE'
				? [ ...acc, audience.name ]
				: acc,
		[]
	),
	availableAudiences: availableAudiences.filter(
		( audience ) => audience.audienceType !== 'SITE_KIT_AUDIENCE'
	),
};
AudienceCreationNotice.scenario = {
	label: 'Modules/Analytics4/Components/AudienceSegmentation/Dashboard/AudienceSelectionPanel/AudienceCreationNotice',
};

export const AudienceCreationNoticeWithMissingScope = Template.bind( {} );
AudienceCreationNoticeWithMissingScope.storyName =
	'Audience creation notice with missing scope';
AudienceCreationNoticeWithMissingScope.args = {
	configuredAudiences: availableAudiences.reduce(
		( acc, audience ) =>
			audience.audienceType !== 'SITE_KIT_AUDIENCE'
				? [ ...acc, audience.name ]
				: acc,
		[]
	),
	availableAudiences: availableAudiences.filter(
		( audience ) => audience.audienceType !== 'SITE_KIT_AUDIENCE'
	),
	setupRegistry: ( registry ) => {
		provideUserAuthentication( registry, {
			grantedScopes: [],
		} );
	},
};
AudienceCreationNoticeWithMissingScope.scenario = {};

export const AudienceCreationNoticeOneAdded = Template.bind( {} );
AudienceCreationNoticeOneAdded.storyName =
	'Audience creation notice with one audience created';
AudienceCreationNoticeOneAdded.args = {
	configuredAudiences: availableAudiences.reduce(
		( acc, audience ) =>
			audience.name !== 'properties/12345/audiences/3' // New visitors
				? [ ...acc, audience.name ]
				: acc,
		[]
	),
	availableAudiences: availableAudiences.filter(
		( audience ) => audience.name !== 'properties/12345/audiences/3' // New visitors
	),
	setupRegistry: ( registry ) => {
		registry
			.dispatch( CORE_UI )
			.setValue( AUDIENCE_CREATION_SUCCESS_NOTICE_SLUG, true );
	},
};
AudienceCreationNoticeOneAdded.scenario = {
	label: 'Modules/Analytics4/Components/AudienceSegmentation/Dashboard/AudienceSelectionPanel/AudienceCreationNoticeOneAdded',
};

export const AudienceCreationSuccessNotice = Template.bind( {} );
AudienceCreationSuccessNotice.storyName = 'Audience creation success notice';
AudienceCreationSuccessNotice.args = {
	setupRegistry: ( registry ) => {
		registry
			.dispatch( CORE_UI )
			.setValue( AUDIENCE_CREATION_SUCCESS_NOTICE_SLUG, true );
	},
};
AudienceCreationSuccessNotice.scenario = {
	label: 'Modules/Analytics4/Components/AudienceSegmentation/Dashboard/AudienceSelectionPanel/AudienceCreationSuccessNotice',
};

export const WithNewBadges = Template.bind( {} );
WithNewBadges.storyName = 'With "New" badges';
WithNewBadges.args = {
	setupRegistry: ( registry ) => {
		registry.dispatch( CORE_USER ).receiveGetExpirableItems( {} );
	},
};
WithNewBadges.scenario = {
	label: 'Modules/Analytics4/Components/AudienceSegmentation/Dashboard/AudienceSelectionPanel/WithNewBadges',
};

export default {
	title: 'Modules/Analytics4/Components/AudienceSegmentation/Dashboard/AudienceSelectionPanel',
	component: AudienceSelectionPanel,
	decorators: [
		( Story, { args } ) => {
			const reportOptions = {
				endDate: '2024-03-27',
				startDate: '2024-02-29',
				dimensions: [ { name: 'audienceResourceName' } ],
				dimensionFilters: {
					audienceResourceName: (
						args?.availableAudiences || availableAudiences
					)
						.filter(
							( { audienceSlug } ) =>
								'purchasers' !== audienceSlug
						)
						.map( ( { name } ) => name ),
				},
				metrics: [ { name: 'totalUsers' } ],
			};

			const setupRegistry = ( registry ) => {
				provideUserAuthentication( registry, {
					grantedScopes: [ EDIT_SCOPE ],
				} );

				registry.dispatch( CORE_USER ).setReferenceDate( '2024-03-28' );

				// Mock the sync available audiences endpoint since it is required that it's resolution is finished
				// so items can go out of the loading state.
				fetchMock.postOnce(
					syncAvailableAudiencesEndpoint,
					{
						body: args?.availableAudiences || availableAudiences,
						status: 200,
					},
					{ overwriteRoutes: false }
				);

				provideModuleRegistrations( registry );

				registry.dispatch( MODULES_ANALYTICS_4 ).receiveGetSettings( {
					accountID: '12345',
					propertyID: '34567',
					measurementID: '56789',
					webDataStreamID: '78901',
				} );

				registry
					.dispatch( MODULES_ANALYTICS_4 )
					.setAvailableAudiences(
						args?.availableAudiences || availableAudiences
					);

				registry
					.dispatch( CORE_USER )
					.setConfiguredAudiences( args?.configuredAudiences || [] );

				provideAnalytics4MockReport( registry, reportOptions );

				registry
					.dispatch( MODULES_ANALYTICS_4 )
					.receiveIsGatheringData( false );

				registry
					.dispatch( MODULES_ANALYTICS_4 )
					.receiveResourceDataAvailabilityDates( {
						audience: availableAudiences.reduce(
							( acc, { audienceSlug, name } ) => {
								if ( 'purchasers' === audienceSlug ) {
									acc[ name ] = 0;
								} else {
									acc[ name ] = 20201220;
								}

								return acc;
							},
							{}
						),
						customDimension: {},
						property: {},
					} );

				// Prevent displaying "New" badges by default.
				registry.dispatch( CORE_USER ).receiveGetExpirableItems(
					availableAudiences.reduce(
						( acc, { name } ) => ( {
							...acc,
							[ `${ AUDIENCE_ITEM_NEW_BADGE_SLUG_PREFIX }${ name }` ]: 0,
						} ),
						{}
					)
				);

				registry
					.dispatch( CORE_UI )
					.setValue( AUDIENCE_SELECTION_PANEL_OPENED_KEY, true );

				args?.setupRegistry?.( registry );
			};

			return (
				<WithRegistrySetup func={ setupRegistry }>
					<Story />
				</WithRegistrySetup>
			);
		},
	],
};
