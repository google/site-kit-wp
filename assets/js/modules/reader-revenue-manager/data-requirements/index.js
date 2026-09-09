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
