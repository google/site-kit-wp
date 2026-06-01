/**
 * Sign in with Google compatibility error messages.
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
 * External dependencies
 */
import { FC } from 'react';

/**
 * WordPress dependencies
 */
import { Fragment } from '@wordpress/element';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import P from '@/js/components/Typography/P';
import { SignInWithGoogleCompatibilityErrors } from '@/js/modules/sign-in-with-google/components/types';

export interface CompatibilityErrorsProps {
	errors?: SignInWithGoogleCompatibilityErrors;
}

const CompatibilityErrors: FC< CompatibilityErrorsProps > = ( { errors } ) => {
	// This component is used to display compatibility errors for Sign in with Google.
	if ( errors === undefined || Object.keys( errors ).length === 0 ) {
		return null;
	}

	return (
		<Fragment>
			{ !! errors.host_wordpress_dot_com && (
				// @ts-expect-error The `P` Typography component is not yet typed.
				<P>
					{ __(
						'Sign in with Google does not function on sites hosted on WordPress.com.',
						'google-site-kit'
					) }
				</P>
			) }

			{ !! errors.wp_login_inaccessible && ( // @ts-expect-error The `P` Typography component is not yet typed.
				<P>
					{ __(
						'Your login page (wp-login.php) is not accessible at the expected location. This can prevent Sign in with Google from functioning correctly.',
						'google-site-kit'
					) }
				</P>
			) }

			{ !! errors.conflicting_plugins && (
				<Fragment>
					{ /* @ts-expect-error The `P` Typography component is not yet typed. */ }
					<P>
						{ __(
							'The following plugins may prevent Sign in with Google from working properly:',
							'google-site-kit'
						) }
					</P>
					<ul>
						{ Object.values( errors.conflicting_plugins ).map(
							( { pluginName } ) => (
								<li key={ pluginName }>{ pluginName }</li>
							)
						) }
					</ul>
				</Fragment>
			) }
		</Fragment>
	);
};

export default CompatibilityErrors;
