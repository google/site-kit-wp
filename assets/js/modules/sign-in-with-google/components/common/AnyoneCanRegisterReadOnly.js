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
import { useSelect } from 'googlesitekit-data';
import {
	CORE_USER,
	PERMISSION_MANAGE_OPTIONS,
} from '../../../../googlesitekit/datastore/user/constants';
import { CORE_SITE } from '../../../../googlesitekit/datastore/site/constants';
import Link from '../../../../components/Link';
import SettingsGroup from '../../../../components/settings/SettingsGroup';

export default function AnyoneCanRegisterReadOnly() {
	const anyoneCanRegister = useSelect( ( select ) =>
		select( CORE_SITE ).getAnyoneCanRegister()
	);
	const settingsURL = useSelect( ( select ) =>
		select( CORE_SITE ).getAdminURL()
	);
	const canManageOptions = useSelect( ( select ) =>
		select( CORE_USER ).hasCapability( PERMISSION_MANAGE_OPTIONS )
	);
	const isMultisite = useSelect( ( select ) =>
		select( CORE_SITE ).isMultisite()
	);

	return (
		<SettingsGroup
			title={ __( 'Users can create new accounts', 'google-site-kit' ) }
		>
			<p className="googlesitekit-margin-top-0 googlesitekit-margin-bottom-0">
				{ anyoneCanRegister
					? sprintf(
							/* translators: %s: Sign in with Google service name */
							__(
								'Users can create new accounts on this site using %s. ',
								'google-site-kit'
							),
							_x(
								'Sign in with Google',
								'Service name',
								'google-site-kit'
							)
					  )
					: sprintf(
							/* translators: %s: Sign in with Google service name */
							__(
								'Only existing users can use %s to access their accounts. ',
								'google-site-kit'
							),
							_x(
								'Sign in with Google',
								'Service name',
								'google-site-kit'
							)
					  ) }
				{ canManageOptions &&
					( ! isMultisite
						? createInterpolateElement(
								__(
									'You can change this setting in <a>Settings > General > Membership.</a>',
									'google-site-kit'
								),
								{
									a: (
										<Link
											key="link"
											href={ `${ settingsURL }/options-general.php` }
										/>
									),
								}
						  )
						: createInterpolateElement(
								__(
									'You can change this setting in <a>Settings > Network Settings > Registration Settings.</a>',
									'google-site-kit'
								),
								{
									a: (
										<Link
											key="link"
											href={ `${ settingsURL }/network/settings.php` }
										/>
									),
								}
						  ) ) }
			</p>
		</SettingsGroup>
	);
}
