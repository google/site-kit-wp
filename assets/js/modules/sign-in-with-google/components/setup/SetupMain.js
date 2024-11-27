/**
 * Sign in with Google Main setup component.
 *
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
import { __, _x } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import { useSelect } from 'googlesitekit-data';
import { CORE_SITE } from '../../../../googlesitekit/datastore/site/constants';
import SignInWithGoogleIcon from '../../../../../svg/graphics/sign-in-with-google.svg';
import SetupForm from './SetupForm';
import Badge from '../../../../components/Badge';
import HTTPSWarning from '../../../../components/notifications/HTTPSWarning';
import { isURLUsingHTTPS } from '../../../../util/is-url-using-https';

export default function SetupMain() {
	const homeURL = useSelect( ( select ) => select( CORE_SITE ).getHomeURL() );

	return (
		<div className="googlesitekit-setup-module googlesitekit-setup-module--with-panels googlesitekit-setup-module--sign-in-with-google">
			<div className="googlesitekit-setup-module__step">
				<div className="googlesitekit-setup-module__logo">
					<SignInWithGoogleIcon width="40" height="40" />
				</div>

				<h2 className="googlesitekit-heading-3 googlesitekit-setup-module__title">
					{ _x(
						'Sign in with Google',
						'Service name',
						'google-site-kit'
					) }
					<Badge
						className="googlesitekit-beta-badge"
						label={ __( 'Beta', 'google-site-kit' ) }
					/>
				</h2>
			</div>
			<div className="googlesitekit-setup-module__step">
				<HTTPSWarning moduleSlug="sign-in-with-google" />

				{ homeURL !== undefined && isURLUsingHTTPS( homeURL ) && (
					<SetupForm />
				) }
			</div>
		</div>
	);
}
