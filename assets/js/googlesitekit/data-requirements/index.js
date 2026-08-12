/**
 * Site Kit by Google, Copyright 2025 Google LLC
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
import { getQueryArg } from '@wordpress/url';

/**
 * Internal dependencies
 */
import { WPDataRegistry } from 'googlesitekit-data';
import { SITE_KIT_VIEW_ONLY_CONTEXTS } from '@/js/googlesitekit/constants';
import { CORE_SITE } from '@/js/googlesitekit/datastore/site/constants';
import { CORE_USER } from '@/js/googlesitekit/datastore/user/constants';
import { CORE_MODULES } from '@/js/googlesitekit/modules/datastore/constants';

/**
 * Returns a function that checks if the current user has the given scope.
 *
 * @since 1.166.0
 *
 * @param {string} scope Scope to check.
 * @return {function(WPDataRegistry): Promise<boolean>} Whether the current user has the given scope.
 */
export function requireScope( scope ) {
	return async ( { select, resolveSelect } ) => {
		await resolveSelect( CORE_USER ).getAuthentication();

		return select( CORE_USER ).hasScope( scope );
	};
}

/**
 * Returns a function that checks if the current user is authenticated.
 *
 * @since 1.166.0
 *
 * @return {function(WPDataRegistry): Promise<boolean>} Whether or not the current user is authenticated.
 */
export function requireIsAuthenticated() {
	return async ( { select, resolveSelect } ) => {
		await resolveSelect( CORE_USER ).getAuthentication();

		return true === select( CORE_USER ).isAuthenticated();
	};
}

/**
 * Returns a function that checks if the current user can view the given shared module.
 *
 * @since 1.166.0
 *
 * @param {string} slug Module slug to test.
 * @return {function(WPDataRegistry): Promise<boolean>} Whether the current user can view the given shared module.
 */
export function requireCanViewSharedModule( slug ) {
	return async ( { select, resolveSelect } ) => {
		await Promise.all( [
			// The canViewSharedModule() selector relies on the resolution of
			// the getModules() and getCapabilities() resolvers.
			resolveSelect( CORE_MODULES ).getModules(),
			resolveSelect( CORE_USER ).getCapabilities(),
		] );

		return true === select( CORE_USER ).canViewSharedModule( slug );
	};
}

/**
 * Returns a function that checks if the given module is active.
 *
 * @since 1.170.0
 *
 * @param {string} slug Module slug to test.
 * @return {function(WPDataRegistry): Promise<boolean>} Whether the given module is active or not.
 */
export function requireModuleActive( slug ) {
	return async function ( { resolveSelect } ) {
		return (
			true ===
			( await resolveSelect( CORE_MODULES ).isModuleActive( slug ) )
		);
	};
}

/**
 * Returns a function that checks if the given module is connected.
 *
 * @since 1.166.0
 *
 * @param {string} slug Module slug to test.
 * @return {function(WPDataRegistry): Promise<boolean>} Whether the given module is connected or not.
 */
export function requireModuleConnected( slug ) {
	return async function ( { resolveSelect } ) {
		return (
			true ===
			( await resolveSelect( CORE_MODULES ).isModuleConnected( slug ) )
		);
	};
}

/**
 * Returns a function that checks if the current user is the owner of the given module.
 *
 * @since 1.166.0
 *
 * @param {string} slug Module slug to test.
 * @return {function(WPDataRegistry): Promise<boolean>} Whether the given module is owned by the current user or not.
 */
export function requireModuleOwnership( slug ) {
	return async ( { resolveSelect } ) =>
		true ===
		( await resolveSelect( CORE_MODULES ).hasModuleOwnership( slug ) );
}

/**
 * Returns a function that checks if the current user has access to the given module.
 *
 * @since 1.166.0
 *
 * @param {string} slug Module slug to test.
 * @return {function(WPDataRegistry): Promise<boolean>} Whether the current user has access to the given module or not.
 */
export function requireModuleAccess( slug ) {
	return async ( { resolveSelect } ) =>
		true ===
		( await resolveSelect( CORE_MODULES ).hasModuleAccess( slug ) );
}

/**
 * Returns a function that checks if the given item is dismissed.
 *
 * @since 1.166.0
 *
 * @param {string} item Dismissible item ID.
 * @return {function(WPDataRegistry): Promise<boolean>} Whether the given item is dismissed or not.
 */
export function requireItemDismissed( item ) {
	return async ( { resolveSelect } ) =>
		true === ( await resolveSelect( CORE_USER ).isItemDismissed( item ) );
}

/**
 * Returns a function that checks if the audience segmentation widget is hidden.
 *
 * @since 1.166.0
 *
 * @return {function(WPDataRegistry): Promise<boolean>} Whether the widget is hidden or not.
 */
export function requireAudienceSegmentationWidgetHidden() {
	return async ( { select, resolveSelect } ) => {
		await resolveSelect( CORE_USER ).getUserAudienceSettings();

		return (
			true === select( CORE_USER ).isAudienceSegmentationWidgetHidden()
		);
	};
}

/**
 * Returns a function that checks if the given module's datastore is gathering data.
 *
 * @since 1.170.0
 *
 * @param {string} datastoreSlug Datastore slug to test.
 * @return {function(WPDataRegistry): Promise<boolean>} Whether the given datastore is gathering data or not.
 */
export function requireModuleGatheringData( datastoreSlug ) {
	return async ( { resolveSelect } ) =>
		true === ( await resolveSelect( datastoreSlug ).isGatheringData() );
}

/**
 * Returns a function that checks if the current user is authenticated.
 *
 * @since 1.174.0
 *
 * @return {function(WPDataRegistry): Promise<boolean>} Whether the current user is authenticated or not.
 */
export function requireIsAuthenticatedUser() {
	return async ( { select, resolveSelect } ) => {
		await resolveSelect( CORE_USER ).getAuthentication();

		return true === select( CORE_USER ).isAuthenticated();
	};
}

/**
 * Returns a function that checks if the current user can activate the given module.
 *
 * @since 1.170.0
 *
 * @param {string} slug Module slug to test.
 * @return {function(WPDataRegistry): Promise<boolean>} Whether the current user can activate the given module or not.
 */
export function requireCanActivateModule( slug ) {
	return async ( { resolveSelect } ) =>
		true ===
		( await resolveSelect( CORE_MODULES ).canActivateModule( slug ) );
}

/**
 * Returns a function that checks if the current user has the given capability.
 *
 * @since n.e.x.t
 *
 * @param {string} capability Capability to check.
 * @return {function(WPDataRegistry): Promise<boolean>} Whether the current user has the given capability or not.
 */
export function requireCapability( capability ) {
	return async ( { select, resolveSelect } ) => {
		await resolveSelect( CORE_USER ).getCapabilities();

		return true === select( CORE_USER ).hasCapability( capability );
	};
}

/**
 * Returns a function that checks if the current user has any unsatisfied scopes.
 *
 * @since n.e.x.t
 *
 * @return {function(WPDataRegistry): Promise<boolean>} Whether the current user has any unsatisfied scopes or not.
 */
export function requireUnsatisfiedScopes() {
	return async ( { select, resolveSelect } ) => {
		await resolveSelect( CORE_USER ).getAuthentication();

		return select( CORE_USER ).getUnsatisfiedScopes()?.length > 0;
	};
}

/**
 * Returns a function that checks if the current user has exactly the given number of unsatisfied scopes.
 *
 * @since n.e.x.t
 *
 * @param {number} count Number of unsatisfied scopes to match.
 * @return {function(WPDataRegistry): Promise<boolean>} Whether the current user has exactly the given number of unsatisfied scopes or not.
 */
export function requireUnsatisfiedScopesCount( count ) {
	return async ( { select, resolveSelect } ) => {
		await resolveSelect( CORE_USER ).getAuthentication();

		return select( CORE_USER ).getUnsatisfiedScopes()?.length === count;
	};
}

/**
 * Returns a function that checks if there is an authentication error.
 *
 * @since n.e.x.t
 *
 * @return {function(WPDataRegistry): boolean} Whether there is an authentication error or not.
 */
export function requireAuthError() {
	return ( { select } ) => !! select( CORE_USER ).getAuthError();
}

/**
 * Returns a function that checks if the current user has access to the feature tour.
 *
 * @since n.e.x.t
 *
 * @return {function(WPDataRegistry): Promise<boolean>} Whether the current user has access to the feature tour or not.
 */
export function requireAccessToFeatureTour() {
	return async ( { select, resolveSelect } ) => {
		await Promise.all( [
			// The hasAccessToFeatureTour() selector relies on the resolution of
			// the getModules(), getAuthentication() and getCapabilities()
			// resolvers.
			resolveSelect( CORE_MODULES ).getModules(),
			resolveSelect( CORE_USER ).getAuthentication(),
			resolveSelect( CORE_USER ).getCapabilities(),
		] );

		return true === select( CORE_USER ).hasAccessToFeatureTour();
	};
}

/**
 * Returns a function that checks if the data gathering complete variant of the welcome modal is active.
 *
 * @since n.e.x.t
 *
 * @return {function(WPDataRegistry): Promise<boolean>} Whether the data gathering complete modal is active or not.
 */
export function requireDataGatheringCompleteModalActive() {
	return async ( { select, resolveSelect } ) => {
		// The isDataGatheringCompleteModalActive() selector relies on the
		// resolution of the getDismissedItems() resolver.
		await resolveSelect( CORE_USER ).getDismissedItems();

		return (
			true === select( CORE_USER ).isDataGatheringCompleteModalActive()
		);
	};
}

/**
 * Returns a function that checks if the current user is subscribed to email reporting.
 *
 * @since n.e.x.t
 *
 * @return {function(WPDataRegistry): Promise<boolean>} Whether the current user is subscribed to email reporting or not.
 */
export function requireEmailReportingSubscribed() {
	return async ( { select, resolveSelect } ) => {
		await resolveSelect( CORE_USER ).getEmailReportingSettings();

		return true === select( CORE_USER ).isEmailReportingSubscribed();
	};
}

/**
 * Returns a function that checks if there is a setup error.
 *
 * @since n.e.x.t
 *
 * @return {function(WPDataRegistry): Promise<boolean>} Whether there is a setup error or not.
 */
export function requireSetupError() {
	return async ( { select, resolveSelect } ) => {
		// The getSetupErrorMessage() selector relies on the resolution of the
		// getSiteInfo() resolver.
		await resolveSelect( CORE_SITE ).getSiteInfo();

		return !! select( CORE_SITE ).getSetupErrorMessage();
	};
}

/**
 * Returns a function that checks if consent mode is disabled.
 *
 * Consent mode is only considered disabled once its settings have loaded, so an
 * unknown state does not satisfy this requirement.
 *
 * @since n.e.x.t
 *
 * @return {function(WPDataRegistry): Promise<boolean>} Whether consent mode is disabled or not.
 */
export function requireConsentModeDisabled() {
	return async ( { select, resolveSelect } ) => {
		// The isConsentModeEnabled() selector relies on the resolution of the
		// getConsentModeSettings() resolver.
		await resolveSelect( CORE_SITE ).getConsentModeSettings();

		return false === select( CORE_SITE ).isConsentModeEnabled();
	};
}

/**
 * Returns a function that checks if Ads is connected.
 *
 * @since n.e.x.t
 *
 * @return {function(WPDataRegistry): Promise<boolean>} Whether Ads is connected or not.
 */
export function requireAdsConnected() {
	return async ( { resolveSelect } ) =>
		true === ( await resolveSelect( CORE_SITE ).isAdsConnected() );
}

/**
 * Returns a function that checks if plugin auto-updates can be changed on the site.
 *
 * @since n.e.x.t
 *
 * @return {function(WPDataRegistry): Promise<boolean>} Whether plugin auto-updates can be changed or not.
 */
export function requireCanChangePluginAutoUpdates() {
	return async ( { select, resolveSelect } ) => {
		// The hasChangePluginAutoUpdatesCapacity() selector relies on the
		// resolution of the getSiteInfo() resolver.
		await resolveSelect( CORE_SITE ).getSiteInfo();

		return (
			true === select( CORE_SITE ).hasChangePluginAutoUpdatesCapacity()
		);
	};
}

/**
 * Returns a function that checks if auto-updates are enabled for Site Kit.
 *
 * @since n.e.x.t
 *
 * @return {function(WPDataRegistry): Promise<boolean>} Whether auto-updates are enabled for Site Kit or not.
 */
export function requireSiteKitAutoUpdatesEnabled() {
	return async ( { select, resolveSelect } ) => {
		// The getSiteKitAutoUpdatesEnabled() selector relies on the resolution
		// of the getSiteInfo() resolver.
		await resolveSelect( CORE_SITE ).getSiteInfo();

		return true === select( CORE_SITE ).getSiteKitAutoUpdatesEnabled();
	};
}

/**
 * Returns a function that checks if any Google Tag Gateway module is connected.
 *
 * @since n.e.x.t
 *
 * @return {function(WPDataRegistry): boolean} Whether any Google Tag Gateway module is connected or not.
 */
export function requireAnyGoogleTagGatewayModuleConnected() {
	return ( { select } ) =>
		true === select( CORE_SITE ).isAnyGoogleTagGatewayModuleConnected();
}

/**
 * Returns a function that checks if Google Tag Gateway is enabled.
 *
 * @since n.e.x.t
 *
 * @return {function(WPDataRegistry): Promise<boolean>} Whether Google Tag Gateway is enabled or not.
 */
export function requireGoogleTagGatewayEnabled() {
	return async ( { select, resolveSelect } ) => {
		// The isGoogleTagGatewayEnabled() selector relies on the resolution of
		// the getGoogleTagGatewaySettings() resolver.
		await resolveSelect( CORE_SITE ).getGoogleTagGatewaySettings();

		return true === select( CORE_SITE ).isGoogleTagGatewayEnabled();
	};
}

/**
 * Returns a function that checks if the Google Tag Gateway service is healthy.
 *
 * The health status is tri-state: it is `null` until the server requirement
 * status has been fetched, which does not satisfy this requirement.
 *
 * @since n.e.x.t
 *
 * @return {function(WPDataRegistry): Promise<boolean>} Whether the Google Tag Gateway service is healthy or not.
 */
export function requireGTGHealthy() {
	return async ( { select, resolveSelect } ) => {
		// The isGTGHealthy() selector relies on the resolution of the
		// getGoogleTagGatewaySettings() resolver.
		await resolveSelect( CORE_SITE ).getGoogleTagGatewaySettings();

		return true === select( CORE_SITE ).isGTGHealthy();
	};
}

/**
 * Returns a function that checks if the Google Tag Gateway proxy script is accessible.
 *
 * The script access status is tri-state: it is `null` until the server
 * requirement status has been fetched, which does not satisfy this requirement.
 *
 * @since n.e.x.t
 *
 * @return {function(WPDataRegistry): Promise<boolean>} Whether the Google Tag Gateway proxy script is accessible or not.
 */
export function requireGTGScriptAccessEnabled() {
	return async ( { select, resolveSelect } ) => {
		// The isScriptAccessEnabled() selector relies on the resolution of the
		// getGoogleTagGatewaySettings() resolver.
		await resolveSelect( CORE_SITE ).getGoogleTagGatewaySettings();

		return true === select( CORE_SITE ).isScriptAccessEnabled();
	};
}

/**
 * Returns a function that checks that email reporting is not disabled at site level.
 *
 * Email reporting is only considered disabled once the site settings report it
 * as such, so an unknown state satisfies this requirement.
 *
 * @since n.e.x.t
 *
 * @return {function(WPDataRegistry): Promise<boolean>} Whether email reporting is not disabled at site level or not.
 */
export function requireSiteEmailReportingNotDisabled() {
	return async ( { select, resolveSelect } ) => {
		// The isEmailReportingEnabled() selector relies on the resolution of
		// the getEmailReportingSettings() resolver.
		await resolveSelect( CORE_SITE ).getEmailReportingSettings();

		return false !== select( CORE_SITE ).isEmailReportingEnabled();
	};
}

/**
 * Returns a function that checks if the current view context is a view-only context.
 *
 * @since n.e.x.t
 *
 * @return {function(WPDataRegistry, string): boolean} Whether the current view context is a view-only context or not.
 */
export function requireViewOnlyContext() {
	return ( registry, viewContext ) =>
		SITE_KIT_VIEW_ONLY_CONTEXTS.includes( viewContext );
}

/**
 * Returns a function that checks if the given module is viewable by the current user.
 *
 * @since n.e.x.t
 *
 * @param {string} slug Module slug to test.
 * @return {function(WPDataRegistry): Promise<boolean>} Whether the given module is viewable by the current user or not.
 */
export function requireModuleViewable( slug ) {
	return async ( { select, resolveSelect } ) => {
		await Promise.all( [
			// The getViewableModules() selector relies on the resolution of the
			// getModules() and getCapabilities() resolvers.
			resolveSelect( CORE_MODULES ).getModules(),
			resolveSelect( CORE_USER ).getCapabilities(),
		] );

		return (
			true === select( CORE_USER ).getViewableModules()?.includes( slug )
		);
	};
}

/**
 * Returns a function that checks if the given module is in the recovering state.
 *
 * @since n.e.x.t
 *
 * @param {string} slug Module slug to test.
 * @return {function(WPDataRegistry): Promise<boolean>} Whether the given module is recoverable or not.
 */
export function requireModuleRecoverable( slug ) {
	return async ( { resolveSelect } ) => {
		const recoverableModules = await resolveSelect(
			CORE_MODULES
		).getRecoverableModules();

		return !! recoverableModules?.[ slug ];
	};
}

/**
 * Returns a function that checks if there is at least one module in the recovering state.
 *
 * @since n.e.x.t
 *
 * @return {function(WPDataRegistry): Promise<boolean>} Whether there is at least one recoverable module or not.
 */
export function requireHasRecoverableModules() {
	return async ( { resolveSelect } ) => {
		const recoverableModules = await resolveSelect(
			CORE_MODULES
		).getRecoverableModules();

		return Object.keys( recoverableModules || {} ).length > 0;
	};
}

/**
 * Returns a function that checks if the given module's datastore has zero data.
 *
 * @since n.e.x.t
 *
 * @param {string} datastoreSlug Datastore slug to test.
 * @return {function(WPDataRegistry): Promise<boolean>} Whether the given datastore has zero data or not.
 */
export function requireModuleZeroData( datastoreSlug ) {
	return async ( { select, resolveSelect } ) => {
		// The hasZeroData() selector relies on the resolution of the sample
		// report.
		await resolveSelect( datastoreSlug ).getReport(
			select( datastoreSlug ).getSampleReportArgs()
		);

		return true === select( datastoreSlug ).hasZeroData();
	};
}

/**
 * Returns a function that checks the value of a query argument in the current URL.
 *
 * When no `value` is given, the requirement is satisfied if the query argument
 * is present with a truthy value.
 *
 * @since n.e.x.t
 *
 * @param {string} name    Query argument name.
 * @param {string} [value] Optional. Query argument value to match.
 * @return {function(): boolean} Whether the query argument matches or not.
 */
export function requireQueryArg( name, value ) {
	return () => {
		const queryArg = getQueryArg( location.href, name );

		return undefined === value ? !! queryArg : queryArg === value;
	};
}
