/**
 * Reader Revenue Manager module data requirements.
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
 * Internal dependencies
 */
import { WPDataRegistry } from 'googlesitekit-data';
import { MODULES_READER_REVENUE_MANAGER } from '@/js/modules/reader-revenue-manager/datastore/constants';

/**
 * Returns a function that checks if the module settings are available.
 *
 * @since n.e.x.t
 *
 * @return {function(WPDataRegistry): Promise<boolean>} Whether the module settings are available or not.
 */
export function requireSettingsAvailable() {
	return async ( { resolveSelect } ) =>
		!! ( await resolveSelect(
			MODULES_READER_REVENUE_MANAGER
		).getSettings() );
}

/**
 * Returns a function that checks if the publication onboarding state matches the given state.
 *
 * @since n.e.x.t
 *
 * @param {string|undefined} state Publication onboarding state to match.
 * @return {function(WPDataRegistry): Promise<boolean>} Whether the publication onboarding state matches or not.
 */
export function requirePublicationOnboardingState( state ) {
	return async ( { select, resolveSelect } ) => {
		await resolveSelect( MODULES_READER_REVENUE_MANAGER ).getSettings();

		return (
			state ===
			select(
				MODULES_READER_REVENUE_MANAGER
			).getPublicationOnboardingState()
		);
	};
}

/**
 * Returns a function that checks if the payment option matches the given option.
 *
 * @since n.e.x.t
 *
 * @param {string} option Payment option to match.
 * @return {function(WPDataRegistry): Promise<boolean>} Whether the payment option matches or not.
 */
export function requirePaymentOption( option ) {
	return async ( { select, resolveSelect } ) => {
		await resolveSelect( MODULES_READER_REVENUE_MANAGER ).getSettings();

		return (
			option ===
			select( MODULES_READER_REVENUE_MANAGER ).getPaymentOption()
		);
	};
}

/**
 * Returns a function that checks if the publication has at least one product ID.
 *
 * @since n.e.x.t
 *
 * @return {function(WPDataRegistry): Promise<boolean>} Whether the publication has at least one product ID or not.
 */
export function requireProductIDs() {
	return async ( { select, resolveSelect } ) => {
		await resolveSelect( MODULES_READER_REVENUE_MANAGER ).getSettings();

		const productIDs = select(
			MODULES_READER_REVENUE_MANAGER
		).getProductIDs();

		return productIDs?.length > 0;
	};
}

/**
 * Returns a function that checks if the selected product ID matches the given ID.
 *
 * @since n.e.x.t
 *
 * @param {string} id Product ID to match.
 * @return {function(WPDataRegistry): Promise<boolean>} Whether the selected product ID matches or not.
 */
export function requireProductID( id ) {
	return async ( { select, resolveSelect } ) => {
		await resolveSelect( MODULES_READER_REVENUE_MANAGER ).getSettings();

		return id === select( MODULES_READER_REVENUE_MANAGER ).getProductID();
	};
}

/**
 * Returns a function that checks if the content policy state is one of the given states.
 *
 * @since n.e.x.t
 *
 * @param {Array<string>} states Content policy states to match against.
 * @return {function(WPDataRegistry): Promise<boolean>} Whether the content policy state is one of the given states or not.
 */
export function requireContentPolicyState( states ) {
	return async ( { select, resolveSelect } ) => {
		await resolveSelect( MODULES_READER_REVENUE_MANAGER ).getSettings();

		return states.includes(
			select( MODULES_READER_REVENUE_MANAGER ).getContentPolicyState()
		);
	};
}

/**
 * Returns a function that checks if the given express setup CTA was actioned.
 *
 * @since n.e.x.t
 *
 * @param {string} ctaType Express setup CTA type slug.
 * @return {function(WPDataRegistry): Promise<boolean>} Whether the given express setup CTA was actioned or not.
 */
export function requireExpressSetupCTAActioned( ctaType ) {
	return async ( { resolveSelect } ) => {
		const { lastActionedExpressSetups = {} } =
			( await resolveSelect(
				MODULES_READER_REVENUE_MANAGER
			).getUserSettings() ) || {};

		return !! lastActionedExpressSetups[ ctaType ];
	};
}

/**
 * Returns a function that checks if the given express setup CTA is already configured.
 *
 * @since n.e.x.t
 *
 * @param {string} ctaType Express setup CTA type slug.
 * @return {function(WPDataRegistry): Promise<boolean>} Whether the given express setup CTA is configured or not.
 */
export function requireExpressSetupCTAConfigured( ctaType ) {
	return async ( { resolveSelect } ) => {
		const { configuredCTAs = {} } =
			( await resolveSelect(
				MODULES_READER_REVENUE_MANAGER
			).getSettings() ) || {};

		return Object.values( configuredCTAs ).includes( ctaType );
	};
}
