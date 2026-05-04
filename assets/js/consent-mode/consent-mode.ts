/**
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
import { isEqual } from 'lodash';

( function () {
	function actionConsentChange( event: Event ) {
		const detail = ( event as CustomEvent< Record< string, string > > )
			.detail;
		if ( detail ) {
			const consentParameters: Record< string, string > = {};
			let hasConsentParameters = false;
			Object.keys( detail ).forEach( ( category ) => {
				if ( global._googlesitekitConsentCategoryMap[ category ] ) {
					const status = detail[ category ];
					const mappedStatus =
						status === 'allow' ? 'granted' : 'denied';
					const parameters =
						global._googlesitekitConsentCategoryMap[ category ];
					parameters.forEach( ( parameter: string ) => {
						consentParameters[ parameter ] = mappedStatus;
					} );
					hasConsentParameters = !! parameters.length;
				}
			} );
			if ( hasConsentParameters ) {
				global.gtag( 'consent', 'update', consentParameters );
			}
		}
	}

	global.document.addEventListener(
		'wp_listen_for_consent_change',
		actionConsentChange
	);

	function updateGrantedConsent() {
		if ( ! ( global.wp_consent_type || global.wp_fallback_consent_type ) ) {
			return;
		}
		const consentParameters: Record< string, string > = {};
		let hasConsentParameters = false;
		Object.entries( global._googlesitekitConsentCategoryMap ).forEach(
			( [ category, parameters ] ) => {
				if (
					global.wp_has_consent &&
					global.wp_has_consent( category )
				) {
					parameters.forEach( ( parameter: string ) => {
						consentParameters[ parameter ] = 'granted';
					} );
					hasConsentParameters =
						hasConsentParameters || !! parameters.length;
				}
			}
		);
		if (
			hasConsentParameters &&
			// Prevent duplicate calls to gtag, only updating if the consent parameters have changed.
			! isEqual( consentParameters, global._googlesitekitConsents )
		) {
			global.gtag( 'consent', 'update', consentParameters );
			global._googlesitekitConsents = consentParameters;
		}
	}

	global.document.addEventListener(
		'wp_consent_type_defined',
		updateGrantedConsent
	);

	global.document.addEventListener( 'DOMContentLoaded', () => {
		if ( ! global.waitfor_consent_hook ) {
			updateGrantedConsent();
		}
	} );
} )();
