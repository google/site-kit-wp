/**
 * ViewOnlyMenu > Description component.
 *
 * Site Kit by Google, Copyright 2022 Google LLC
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
import { createInterpolateElement, useCallback } from '@wordpress/element';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import Data from 'googlesitekit-data';
import { CORE_LOCATION } from '../../googlesitekit/datastore/location/constants';
import { CORE_SITE } from '../../googlesitekit/datastore/site/constants';
import {
	CORE_USER,
	PERMISSION_AUTHENTICATE,
} from '../../googlesitekit/datastore/user/constants';
import { trackEvent } from '../../util';
import Button from '../../components/Button';
import Link from '../../components/Link';
import useViewContext from '../../hooks/useViewContext';
const { useDispatch, useSelect } = Data;

export default function Description() {
	const viewContext = useViewContext();

	const canAuthenticate = useSelect( ( select ) =>
		select( CORE_USER ).hasCapability( PERMISSION_AUTHENTICATE )
	);

	const proxySetupURL = useSelect( ( select ) =>
		select( CORE_SITE ).getProxySetupURL()
	);

	const isConnected = useSelect( ( select ) =>
		select( CORE_SITE ).isConnected()
	);

	const { navigateTo } = useDispatch( CORE_LOCATION );

	const onButtonClick = useCallback(
		async ( event ) => {
			event.preventDefault();

			if ( proxySetupURL ) {
				await trackEvent( viewContext, 'start_user_setup', 'proxy' );
			}

			if ( proxySetupURL && ! isConnected ) {
				await trackEvent( viewContext, 'start_site_setup', 'proxy' );
			}

			navigateTo( proxySetupURL );
		},
		[ proxySetupURL, isConnected, navigateTo, viewContext ]
	);

	const description = canAuthenticate
		? createInterpolateElement(
				__(
					"You can see stats from all shared Google services, but you can't make any changes. <strong>Sign in to connect more services and control sharing access.</strong>",
					'google-site-kit'
				),
				{
					strong: <strong />,
				}
		  )
		: createInterpolateElement(
				__(
					"You can see stats from all shared Google services, but you can't make any changes. <a>Learn more</a>",
					'google-site-kit'
				),
				{
					a: (
						<Link
							href="https://sitekit.withgoogle.com/documentation/using-site-kit/dashboard-sharing/"
							external
							aria-label={ __(
								'Learn more about dashboard sharing',
								'google-site-kit'
							) }
						/>
					),
				}
		  );

	return (
		<li className="googlesitekit-view-only-menu__list-item googlesitekit-view-only-menu__description">
			<p>{ description }</p>
			{ canAuthenticate && (
				<Button onClick={ onButtonClick }>
					{ __( 'Sign in with Google', 'google-site-kit' ) }
				</Button>
			) }
		</li>
	);
}
