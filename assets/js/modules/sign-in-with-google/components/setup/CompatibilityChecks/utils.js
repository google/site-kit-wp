/**
 * CompatibilityChecks utils.
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
 * WordPress dependencies
 */
import { __, sprintf } from '@wordpress/i18n';

/**
 * Normalizes the conflicting plugins data to an array of plugin info objects.
 *
 * @since n.e.x.t
 *
 * @param {Object|Array} conflictingPlugins Plugins data keyed by slug or array.
 * @return {Array} Array of plugin info objects.
 */
function normalizeConflictingPlugins( conflictingPlugins ) {
	if ( Array.isArray( conflictingPlugins ) ) {
		return conflictingPlugins;
	}

	if (
		conflictingPlugins &&
		typeof conflictingPlugins === 'object' &&
		Object.keys( conflictingPlugins ).length > 0
	) {
		return Object.values( conflictingPlugins );
	}

	return [];
}

/**
 * Gets error messages from compatibility errors.
 *
 * @since n.e.x.t
 *
 * @param {*} errors Compatibility errors.
 * @return {Array} Array of error messages.
 */
export function getErrorMessage( errors ) {
	const ERROR_WP_LOGIN_INACCESSIBLE = 'ERROR_WP_LOGIN_INACCESSIBLE';
	const ERROR_WPCOM = 'ERROR_WPCOM';
	const ERROR_CONFLICTING_PLUGINS = 'ERROR_CONFLICTING_PLUGINS';

	const SLUG_TO_ERROR = {
		wp_login_inaccessible: ERROR_WP_LOGIN_INACCESSIBLE,
		host_wordpress_dot_com: ERROR_WPCOM,
		conflicting_plugins: ERROR_CONFLICTING_PLUGINS,
	};

	const errorMessages = [];

	for ( const [ slug, value ] of Object.entries( errors ) ) {
		const errorCode = SLUG_TO_ERROR[ slug ];

		switch ( errorCode ) {
			case ERROR_WP_LOGIN_INACCESSIBLE:
				errorMessages.push(
					__(
						'Your login page (wp-login.php) is not accessible at the expected location. This can prevent Sign in with Google from functioning correctly.',
						'google-site-kit'
					)
				);
				break;

			case ERROR_WPCOM:
				errorMessages.push(
					__(
						'Sign in with Google does not function on sites hosted on wordpress.com.',
						'google-site-kit'
					)
				);
				break;

			case ERROR_CONFLICTING_PLUGINS: {
				const plugins = normalizeConflictingPlugins( value );

				for ( const plugin of plugins ) {
					const { pluginName, conflictMessage } = plugin || {};

					if ( conflictMessage ) {
						errorMessages.push( conflictMessage );
						continue;
					}

					if ( pluginName ) {
						errorMessages.push(
							sprintf(
								/* translators: %s: plugin name */
								__(
									'%s can interfere with Sign in with Google. When this plugin is active, Sign in with Google may not function properly',
									'google-site-kit'
								),
								pluginName
							)
						);
					}
				}
				break;
			}
			default:
				break;
		}
	}

	return errorMessages;
}
