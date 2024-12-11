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
import { createInterpolateElement, Fragment } from '@wordpress/element';
import { __, _x, sprintf } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import { useSelect } from 'googlesitekit-data';
import {
	CORE_USER,
	PERMISSION_MANAGE_OPTIONS,
} from '../../../../googlesitekit/datastore/user/constants';
import { CORE_SITE } from '../../../../googlesitekit/datastore/site/constants';
import {
	BREAKPOINT_SMALL,
	useBreakpoint,
} from '../../../../hooks/useBreakpoint';
import { HelperText } from 'googlesitekit-components';
import Link from '../../../../components/Link';

export default function AnyoneCanRegisterReadOnly() {
	const breakpoint = useBreakpoint();

	const anyoneCanRegister = useSelect( ( select ) =>
		select( CORE_SITE ).getAnyoneCanRegister()
	);
	const canManageOptions = useSelect( ( select ) =>
		select( CORE_USER ).hasCapability( PERMISSION_MANAGE_OPTIONS )
	);
	const isMultisite = useSelect( ( select ) =>
		select( CORE_SITE ).isMultisite()
	);
	const generalSettingsURL = useSelect(
		( select ) =>
			new URL(
				isMultisite ? 'network/settings.php' : 'options-general.php',
				select( CORE_SITE ).getAdminURL()
			).href
	);

	return (
		<div className="googlesitekit-settings-module__fields-group googlesitekit-settings-module__fields-group--read-only">
			<span>
				{ __( 'Anyone can register WP setting', 'google-site-kit' ) }
			</span>
			{ anyoneCanRegister && (
				<HelperText persistent>
					{ createInterpolateElement(
						sprintf(
							/* translators: %s: Sign in with Google service name */
							__(
								'Users can create new accounts on this site using %s. <br/>Visit <a>WP settings</a> page to manage this membership setting.',
								'google-site-kit'
							),
							_x(
								'Sign in with Google',
								'Service name',
								'google-site-kit'
							)
						),
						{
							a:
								! canManageOptions && isMultisite ? (
									<span />
								) : (
									<Link
										key="link"
										href={ generalSettingsURL }
									/>
								),
							br:
								breakpoint !== BREAKPOINT_SMALL ? (
									<br />
								) : (
									<Fragment />
								),
						}
					) }
				</HelperText>
			) }
			{ anyoneCanRegister === false && (
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
