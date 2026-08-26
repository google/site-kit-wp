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
 * WordPress dependencies
 */
import { createInterpolateElement } from '@wordpress/element';
import { __, _x, sprintf } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import { HelperText } from 'googlesitekit-components';
import { useSelect } from 'googlesitekit-data';
import Link from '@/js/components/Link';
import { CORE_SITE } from '@/js/googlesitekit/datastore/site/constants';
import {
	CORE_USER,
	PERMISSION_MANAGE_OPTIONS,
} from '@/js/googlesitekit/datastore/user/constants';

/**
 * Interpolates a "registration is open, manage it here" message into its
 * `<a>`/`<br/>` markup.
 *
 * Only the JSX structure is shared here, not the translatable text: each
 * caller supplies its own complete, already-translated message so the
 * sentence stays grammatically whole per locale (see the two call sites
 * below for the actual translator strings).
 *
 * @since 1.186.0
 * @private
 *
 * @param {Object}  args             Arguments.
 * @param {string}  args.message     Complete translated message, containing an `<a>`...`</a>` segment and a `<br/>` tag.
 * @param {string}  args.settingsURL URL of the settings screen the `<a>` should link to.
 * @param {boolean} args.showLink    Whether the current user can reach the settings screen; renders a plain `<span>` instead of a link when false.
 * @return {Element} Interpolated message content for use inside a HelperText.
 */
function interpolateRegistrationMessage( { message, settingsURL, showLink } ) {
	return createInterpolateElement( message, {
		a: showLink ? <Link href={ settingsURL } /> : <span />,
		br: (
			<br className="googlesitekit-sign-in-with-google-registration-message__break" />
		),
	} );
}

export default function AnyoneCanRegisterReadOnly() {
	const anyoneCanRegister = useSelect( ( select ) =>
		select( CORE_SITE ).getAnyoneCanRegister()
	);
	const anyoneCanRegisterWooCommerce = useSelect( ( select ) =>
		select( CORE_SITE ).getAnyoneCanRegisterWooCommerce()
	);
	const canManageOptions = useSelect( ( select ) =>
		select( CORE_USER ).hasCapability( PERMISSION_MANAGE_OPTIONS )
	);
	const isMultisite = useSelect( ( select ) =>
		select( CORE_SITE ).isMultisite()
	);
	const generalSettingsURL = useSelect( ( select ) =>
		select( CORE_SITE ).getAdminSettingsURL()
	);
	const wooCommerceSettingsURL = useSelect( ( select ) =>
		select( CORE_SITE ).getAdminURL( 'admin.php?page=wc-settings', {
			tab: 'account',
		} )
	);

	// WordPress registration takes precedence in the messaging below: when
	// it's open, that's the setting governing registration regardless of
	// WooCommerce. WooCommerce's own setting only matters as a fallback path
	// when WordPress registration is closed.
	const registrationOpenViaWooCommerce =
		anyoneCanRegister === false && !! anyoneCanRegisterWooCommerce;

	return (
		<div className="googlesitekit-settings-module__fields-group googlesitekit-settings-module__fields-group--read-only">
			<span>{ __( 'User registration', 'google-site-kit' ) }</span>
			{ anyoneCanRegister && (
				<HelperText persistent>
					{ interpolateRegistrationMessage( {
						message: sprintf(
							/* translators: %s: Sign in with Google service name */
							__(
								'Users can create new accounts on this site using %s. <br/>Visit <a>WordPress settings</a> to manage this membership setting.',
								'google-site-kit'
							),
							_x(
								'Sign in with Google',
								'Service name',
								'google-site-kit'
							)
						),
						settingsURL: generalSettingsURL,
						// "Anyone can register" is a genuine network-level
						// setting a site admin can't reach on multisite.
						showLink: ! ( ! canManageOptions && isMultisite ),
					} ) }
				</HelperText>
			) }
			{ registrationOpenViaWooCommerce && (
				<HelperText persistent>
					{ interpolateRegistrationMessage( {
						message: sprintf(
							/* translators: %s: Sign in with Google service name */
							__(
								'Users can create new accounts on this site using %s. <br/>Visit <a>WooCommerce settings</a> to manage this membership setting.',
								'google-site-kit'
							),
							_x(
								'Sign in with Google',
								'Service name',
								'google-site-kit'
							)
						),
						settingsURL: wooCommerceSettingsURL,
						// Unlike the WordPress branch above, this isn't gated on
						// `isMultisite`: WooCommerce's settings are always
						// per-site, so `canManageOptions` alone is sufficient.
						showLink: canManageOptions,
					} ) }
				</HelperText>
			) }
			{ anyoneCanRegister === false && ! registrationOpenViaWooCommerce && (
				<HelperText persistent>
					{ sprintf(
						/* translators: %s: Sign in with Google service name */
						__(
							'Only existing users can use %s to access their accounts.',
							'google-site-kit'
						),
						_x(
							'Sign in with Google',
							'Service name',
							'google-site-kit'
						)
					) }
				</HelperText>
			) }
		</div>
	);
}
