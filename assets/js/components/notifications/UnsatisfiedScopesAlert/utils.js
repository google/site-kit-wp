/**
 * UnsatisfiedScopesAlert utils.
 *
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
 * External dependencies
 */
import { uniq } from 'lodash';

/**
 * WordPress dependencies
 */
import { __, sprintf } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import { listFormat } from '../../../util';

/**
 * Maps unsatisfied scopes to module names.
 *
 * @since 1.39.0
 *
 * @param {Array}  scopes  Array of unsatisfied scopes.
 * @param {Object} modules Object of all modules.
 * @return {Array} Array of module names. If a scope does not map to a module, it is set to `false`.
 */
export function mapScopesToModuleNames( scopes, modules ) {
	if ( modules === undefined ) {
		return null;
	}

	// Map of scope IDs to Site Kit module slugs.
	const scopeIDToSlug = {
		siteverification: 'site-verification',
		webmasters: 'search-console',
		analytics: 'analytics-4',
	};

	return (
		scopes
			// Map into an array of matches.
			.map( ( scope ) =>
				scope.match(
					new RegExp(
						'^https://www\\.googleapis\\.com/auth/([a-z]+)'
					)
				)
			)
			// Map each match into a module slug, if any.
			.map( ( [ , id ] ) => scopeIDToSlug[ id ] || id )
			// Map module slugs into module names. If there is no matched module, set to `false`.
			.map( ( slug ) => modules[ slug ]?.name || false )
	);
}

/**
 * Gets the appropriate message for unsatisfied scopes.
 *
 * @since n.e.x.t
 *
 * @param {Array}  unsatisfiedScopes                  Array of unsatisfied scopes.
 * @param {Object} modules                            Object of all modules.
 * @param {Object} temporaryPersistedPermissionsError Object of temporary persisted permissions error.
 * @return {Object} An object containing message and ctaLabel.
 */
export function getUnsatisfiedScopesMessage(
	unsatisfiedScopes,
	modules,
	temporaryPersistedPermissionsError
) {
	const MESSAGE_MULTIPLE = 'multiple';
	const MESSAGE_SINGULAR = 'single';
	const MESSAGE_GENERIC = 'generic';

	let messageID;
	let moduleNames;
	if (
		// Determine if all scopes are in Google API format, otherwise use generic message.
		unsatisfiedScopes.some(
			( scope ) =>
				! scope.match(
					new RegExp( '^https://www\\.googleapis\\.com/auth/' )
				)
		)
	) {
		messageID = MESSAGE_GENERIC;
	} else {
		// All scopes are in Google API format, map them to module names.
		moduleNames = mapScopesToModuleNames( unsatisfiedScopes, modules );
		// If any scope did not resolve to a module name, use the generic message.
		if ( ! moduleNames || moduleNames.some( ( name ) => name === false ) ) {
			messageID = MESSAGE_GENERIC;
		} else {
			moduleNames = uniq( moduleNames );
			messageID =
				1 < moduleNames.length ? MESSAGE_MULTIPLE : MESSAGE_SINGULAR;
		}
	}

	const title = __(
		"Site Kit can't access necessary data",
		'google-site-kit'
	);
	const ctaLabel = temporaryPersistedPermissionsError?.data
		? __( 'Grant permission', 'google-site-kit' )
		: __( 'Redo setup', 'google-site-kit' );

	let message;
	switch ( messageID ) {
		case MESSAGE_MULTIPLE:
			message = sprintf(
				/* translators: %s: List of product names */
				__(
					"Site Kit can't access all relevant data because you haven't granted all permissions requested during setup. To use Site Kit, you'll need to redo the setup for: %s – make sure to approve all permissions at the authentication stage.",
					'google-site-kit'
				),
				listFormat( moduleNames )
			);
			break;
		case MESSAGE_SINGULAR:
			message = sprintf(
				/* translators: %s: Product name */
				__(
					"Site Kit can't access the relevant data from %1$s because you haven't granted all permissions requested during setup. To use Site Kit, you'll need to redo the setup for %1$s – make sure to approve all permissions at the authentication stage.",
					'google-site-kit'
				),
				moduleNames[ 0 ]
			);
			break;
		case MESSAGE_GENERIC:
			message = __(
				"Site Kit can't access all relevant data because you haven't granted all permissions requested during setup. To use Site Kit, you'll need to redo the setup – make sure to approve all permissions at the authentication stage.",
				'google-site-kit'
			);
			break;
	}

	return { title, message, ctaLabel };
}
