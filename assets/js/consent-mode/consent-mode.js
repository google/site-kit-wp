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

( function () {
	document.addEventListener(
		'wp_listen_for_consent_change',
		function ( event ) {
			if ( event.detail ) {
				const consentParameters = {};
				let hasConsentParameters = false;
				Object.keys( event.detail ).forEach( ( category ) => {
					if ( global._googlesitekitConsentCategoryMap[ category ] ) {
						const status = event.detail[ category ];
						const mappedStatus =
							status === 'allow' ? 'granted' : 'denied';
						const parameters =
							global._googlesitekitConsentCategoryMap[ category ];
						parameters.forEach( ( parameter ) => {
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
	);

	function updateGrantedConsent() {
		if ( ! ( global.wp_consent_type || global.wp_fallback_consent_type ) ) {
			return;
		}
		const consentParameters = {};
		let hasConsentParameters = false;
		Object.entries( global._googlesitekitConsentCategoryMap ).forEach(
			( [ category, parameters ] ) => {
				if (
					global.wp_has_consent &&
					global.wp_has_consent( category )
				) {
					parameters.forEach( ( parameter ) => {
						consentParameters[ parameter ] = 'granted';
					} );
					hasConsentParameters =
						hasConsentParameters || !! parameters.length;
				}
			}
		);
		if ( hasConsentParameters ) {
			global.gtag( 'consent', 'update', consentParameters );
		}
	}
	document.addEventListener(
		'wp_consent_type_defined',
		updateGrantedConsent
	);
	document.addEventListener( 'DOMContentLoaded', function () {
		if ( ! global.waitfor_consent_hook ) {
			updateGrantedConsent();
		}
	} );
} )();
