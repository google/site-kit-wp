/**
 * `modules/analytics` data store: settings.
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
 * External dependencies
 */
import invariant from 'invariant';

/**
 * Internal dependencies
 */
import Data from 'googlesitekit-data';
import API from 'googlesitekit-api';
import { CORE_FORMS } from '../../../googlesitekit/datastore/forms/constants';
import { CORE_USER } from '../../../googlesitekit/datastore/user/constants';
import {
	MODULES_ANALYTICS_4,
	PROPERTY_CREATE as GA4_PROPERTY_CREATE,
	WEBDATASTREAM_CREATE,
} from '../../analytics-4/datastore/constants';
import { GA4_AUTO_SWITCH_DATE } from '../../analytics-4/constants';
import {
	INVARIANT_DOING_SUBMIT_CHANGES,
	INVARIANT_SETTINGS_NOT_CHANGED,
} from '../../../googlesitekit/data/create-settings-store';
import {
	isValidAccountID,
	isValidInternalWebPropertyID,
	isValidPropertySelection,
	isValidProfileSelection,
	isValidPropertyID,
	isValidProfileName,
	isValidAdsConversionID,
} from '../util';
import { stringToDate } from '../../../util';
import {
	MODULES_ANALYTICS,
	PROPERTY_CREATE,
	PROFILE_CREATE,
	FORM_SETUP,
	DASHBOARD_VIEW_GA4,
	DASHBOARD_VIEW_UA,
	GA4_DASHBOARD_VIEW_NOTIFICATION_ID,
} from './constants';
import { createStrictSelect } from '../../../googlesitekit/data/utils';
import { CORE_MODULES } from '../../../googlesitekit/modules/datastore/constants';
import { MODULES_TAGMANAGER } from '../../tagmanager/datastore/constants';
import { isFeatureEnabled } from '../../../features';
import ga4Reporting from '../../../feature-tours/ga4-reporting';

const { createRegistrySelector } = Data;

// Invariant error messages.
export const INVARIANT_INVALID_ACCOUNT_ID =
	'a valid accountID is required to submit changes';
export const INVARIANT_INVALID_PROPERTY_SELECTION =
	'a valid propertyID is required to submit changes';
export const INVARIANT_INVALID_PROFILE_SELECTION =
	'a valid profileID is required to submit changes';
export const INVARIANT_INVALID_CONVERSION_ID =
	'a valid adsConversionID is required to submit changes';
export const INVARIANT_INVALID_PROFILE_NAME =
	'a valid profile name is required to submit changes';
export const INVARIANT_INVALID_INTERNAL_PROPERTY_ID =
	'cannot submit changes with incorrect internal webPropertyID';

async function submitGA4Changes( { select, dispatch } ) {
	if ( ! select( MODULES_ANALYTICS_4 ).haveSettingsChanged() ) {
		return {};
	}

	return await dispatch( MODULES_ANALYTICS_4 ).submitChanges();
}

export async function submitChanges( registry ) {
	const { select, dispatch } = registry;

	const ga4ReportingEnabled = isFeatureEnabled( 'ga4Reporting' );

	const isUAEnabled = select( CORE_FORMS ).getValue( FORM_SETUP, 'enableUA' );

	if ( ! ga4ReportingEnabled || isUAEnabled ) {
		let propertyID = select( MODULES_ANALYTICS ).getPropertyID();
		if ( propertyID === PROPERTY_CREATE ) {
			const accountID = select( MODULES_ANALYTICS ).getAccountID();
			const { response: property, error } = await dispatch(
				MODULES_ANALYTICS
			).createProperty( accountID );

			if ( error ) {
				return { error };
			}

			propertyID = property.id;
			dispatch( MODULES_ANALYTICS ).setPropertyID( property.id );
			dispatch( MODULES_ANALYTICS ).setInternalWebPropertyID(
				// eslint-disable-next-line sitekit/acronym-case
				property.internalWebPropertyId
			);
		}

		const profileID = select( MODULES_ANALYTICS ).getProfileID();
		if ( profileID === PROFILE_CREATE ) {
			const profileName = select( CORE_FORMS ).getValue(
				FORM_SETUP,
				'profileName'
			);
			const accountID = select( MODULES_ANALYTICS ).getAccountID();
			const { response: profile, error } = await dispatch(
				MODULES_ANALYTICS
			).createProfile( accountID, propertyID, { profileName } );

			if ( error ) {
				return { error };
			}

			dispatch( MODULES_ANALYTICS ).setProfileID( profile.id );
		}
	}

	// If `ga4Reporting` is enabled, the dashboard view is set to UA
	// and UA is not enabled, we need to set the dashboard view to GA4.
	let dashboardView = select( MODULES_ANALYTICS ).getDashboardView();
	if (
		ga4ReportingEnabled &&
		dashboardView === DASHBOARD_VIEW_UA &&
		! isUAEnabled
	) {
		dispatch( MODULES_ANALYTICS ).setDashboardView( DASHBOARD_VIEW_GA4 );
		dashboardView = DASHBOARD_VIEW_GA4;
	}

	const ga4PropertyID = select( MODULES_ANALYTICS_4 ).getPropertyID();
	const ga4StreamID = select( MODULES_ANALYTICS_4 ).getWebDataStreamID();

	if (
		ga4PropertyID === GA4_PROPERTY_CREATE ||
		ga4StreamID === WEBDATASTREAM_CREATE
	) {
		const { error } = await submitGA4Changes( registry );
		if ( error ) {
			return { error };
		}
	}

	// This action shouldn't be called if settings haven't changed,
	// but this prevents errors in tests.
	if ( select( MODULES_ANALYTICS ).haveSettingsChanged() ) {
		const { error } = await dispatch( MODULES_ANALYTICS ).saveSettings();
		if ( error ) {
			return { error };
		}
	}

	await API.invalidateCache( 'modules', 'analytics' );

	const { error } = await submitGA4Changes( registry );
	if ( error ) {
		return { error };
	}

	if ( dashboardView === DASHBOARD_VIEW_GA4 ) {
		if ( ! select( CORE_USER ).isTourDismissed( ga4Reporting.slug ) ) {
			dispatch( CORE_USER ).dismissTour( ga4Reporting.slug );
		}

		await registry
			.__experimentalResolveSelect( CORE_USER )
			.getDismissedItems();
		if (
			! select( CORE_USER ).isItemDismissed(
				GA4_DASHBOARD_VIEW_NOTIFICATION_ID
			)
		) {
			dispatch( CORE_USER ).dismissItem(
				GA4_DASHBOARD_VIEW_NOTIFICATION_ID
			);
		}
	}

	return {};
}

export function rollbackChanges( { select, dispatch } ) {
	dispatch( MODULES_ANALYTICS_4 ).rollbackChanges();

	dispatch( CORE_FORMS ).setValues( FORM_SETUP, { enableGA4: undefined } );

	if ( select( MODULES_ANALYTICS ).haveSettingsChanged() ) {
		dispatch( MODULES_ANALYTICS ).rollbackSettings();
	}
}

export function validateCanSubmitChanges( select ) {
	const strictSelect = createStrictSelect( select );
	const {
		getAccountID,
		getAdsConversionID,
		getInternalWebPropertyID,
		getProfileID,
		getPropertyID,
		haveSettingsChanged,
		isDoingSubmitChanges,
	} = strictSelect( MODULES_ANALYTICS );

	// Note: these error messages are referenced in test assertions.
	invariant( ! isDoingSubmitChanges(), INVARIANT_DOING_SUBMIT_CHANGES );

	invariant(
		haveSettingsChanged() ||
			select( MODULES_ANALYTICS_4 ).haveSettingsChanged(),
		INVARIANT_SETTINGS_NOT_CHANGED
	);

	invariant(
		isValidAccountID( getAccountID() ),
		INVARIANT_INVALID_ACCOUNT_ID
	);

	const isUAEnabled = select( CORE_FORMS ).getValue( FORM_SETUP, 'enableUA' );
	// Do not require selecting a property or profile if `ga4Reporting` is enabled.
	// Only validate UA settings if `ga4Reporting` is not enabled OR `enableUA` is enabled.
	if ( ! isFeatureEnabled( 'ga4Reporting' ) || isUAEnabled ) {
		invariant(
			isValidPropertySelection( getPropertyID() ),
			INVARIANT_INVALID_PROPERTY_SELECTION
		);
		invariant(
			isValidProfileSelection( getProfileID() ),
			INVARIANT_INVALID_PROFILE_SELECTION
		);

		if ( getProfileID() === PROFILE_CREATE ) {
			const profileName = select( CORE_FORMS ).getValue(
				FORM_SETUP,
				'profileName'
			);
			invariant(
				isValidProfileName( profileName ),
				INVARIANT_INVALID_PROFILE_NAME
			);
		}

		// If the property ID is valid (non-create) the internal ID must be valid as well.
		invariant(
			! isValidPropertyID( getPropertyID() ) ||
				isValidInternalWebPropertyID( getInternalWebPropertyID() ),
			INVARIANT_INVALID_INTERNAL_PROPERTY_ID
		);
	}

	if ( getAdsConversionID() ) {
		invariant(
			isValidAdsConversionID( getAdsConversionID() ),
			INVARIANT_INVALID_CONVERSION_ID
		);
	}

	if ( select( MODULES_ANALYTICS ).canUseGA4Controls() ) {
		select( MODULES_ANALYTICS_4 ).__dangerousCanSubmitChanges();
	}
}

/**
 * Gets the value of canUseSnippet based on the gaPropertyID of tagmanager module and propertyID.
 *
 * @since 1.75.0
 *
 * @return {boolean|undefined} Computed value of canUseSnippet. `undefined` if not loaded.
 */
export const getCanUseSnippet = createRegistrySelector( ( select ) => () => {
	const analyticsSettings = select( MODULES_ANALYTICS ).getSettings();

	if ( ! analyticsSettings ) {
		return undefined;
	}

	const isTagManagerAvailable =
		select( CORE_MODULES ).isModuleAvailable( 'tagmanager' );
	const isTagManagerConnected =
		isTagManagerAvailable &&
		select( CORE_MODULES ).isModuleConnected( 'tagmanager' );

	if ( ! isTagManagerConnected || ! select( MODULES_TAGMANAGER ) ) {
		return analyticsSettings.canUseSnippet;
	}

	const tagManagerUseSnippet = select( MODULES_TAGMANAGER ).getUseSnippet();

	if ( ! tagManagerUseSnippet ) {
		return analyticsSettings.canUseSnippet;
	}

	const gtmGAPropertyID = select( MODULES_TAGMANAGER ).getGAPropertyID();

	if ( isValidPropertyID( gtmGAPropertyID ) ) {
		return gtmGAPropertyID !== analyticsSettings.propertyID;
	}

	return analyticsSettings.canUseSnippet;
} );

/**
 * Gets the value of dashboardView from the Analytics settings.
 *
 * @since 1.98.0
 * @since 1.107.0 Hardwire to `true` after the GA4 auto-switch date, if GA4 is connected.
 *
 * @return {boolean|undefined} True if the dashboard view is GA4, false if it is UA, or undefined if not loaded.
 */
export const isGA4DashboardView = createRegistrySelector( ( select ) => () => {
	const ga4ReportingEnabled = isFeatureEnabled( 'ga4Reporting' );

	if ( ! ga4ReportingEnabled ) {
		return false;
	}

	const ga4ModuleConnected =
		select( CORE_MODULES ).isModuleConnected( 'analytics-4' );

	if ( ga4ModuleConnected === undefined ) {
		return undefined;
	}

	if ( ! ga4ModuleConnected ) {
		return false;
	}

	const referenceDate = select( CORE_USER ).getReferenceDate();

	if (
		stringToDate( referenceDate ) >= stringToDate( GA4_AUTO_SWITCH_DATE )
	) {
		return true;
	}

	const dashboardView = select( MODULES_ANALYTICS ).getDashboardView();

	if ( dashboardView === undefined ) {
		return undefined;
	}

	return dashboardView === DASHBOARD_VIEW_GA4;
} );

/**
 * Determines whether the user should be prompted to switch to GA4 Dashboard View.
 *
 * @since 1.98.0
 *
 * @return {boolean} True if the user should be prompted to switch to the GA4 Dashboard View, false otherwise, or undefined if not loaded.
 */
export const shouldPromptGA4DashboardView = createRegistrySelector(
	( select ) => () => {
		const ga4ReportingEnabled = isFeatureEnabled( 'ga4Reporting' );

		if ( ! ga4ReportingEnabled ) {
			return false;
		}

		const ga4ModuleConnected =
			select( CORE_MODULES ).isModuleConnected( 'analytics-4' );

		if ( ga4ModuleConnected === undefined ) {
			return undefined;
		}

		if ( ! ga4ModuleConnected ) {
			return false;
		}

		const ga4DashboardView =
			select( MODULES_ANALYTICS ).isGA4DashboardView();

		if ( ga4DashboardView === undefined ) {
			return undefined;
		}

		// Don't prompt if the user is already on the GA4 Dashboard.
		if ( ga4DashboardView ) {
			return false;
		}

		const ga4GatheringData =
			select( MODULES_ANALYTICS_4 ).isGatheringData();

		if ( ga4GatheringData === undefined ) {
			return undefined;
		}

		// Don't prompt if GA4 is still gathering data.
		if ( ga4GatheringData ) {
			return false;
		}

		return true;
	}
);
