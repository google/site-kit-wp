/**
 * ConnectGA4CTATile component.
 *
 * Site Kit by Google, Copyright 2023 Google LLC
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
import { useCallback } from '@wordpress/element';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import Data from 'googlesitekit-data';
import AnalyticsIcon from '../../../svg/graphics/analytics.svg';
import Link from '../../components/Link';
import { CORE_LOCATION } from '../../googlesitekit/datastore/location/constants';
import { CORE_SITE } from '../../googlesitekit/datastore/site/constants';
import { CORE_MODULES } from '../../googlesitekit/modules/datastore/constants';
import useViewContext from '../../hooks/useViewContext';
import { trackEvent } from '../../util';

const { useDispatch } = Data;

export default function ConnectGA4CTATile() {
	const viewContext = useViewContext();

	const { activateModule } = useDispatch( CORE_MODULES );
	const { navigateTo } = useDispatch( CORE_LOCATION );
	const { setInternalServerError } = useDispatch( CORE_SITE );

	const handleConnectGA4 = useCallback( async () => {
		const { error, response } = await activateModule( 'analytics' );

		if ( ! error ) {
			await trackEvent(
				`${ viewContext }_module-list`,
				'activate_module',
				'analytics'
			);

			navigateTo( response.moduleReauthURL );
		} else {
			setInternalServerError( {
				id: 'activate-module-error',
				description: error.message,
			} );
		}
	}, [ activateModule, navigateTo, setInternalServerError, viewContext ] );

	return (
		<div className="googlesitekit-km-connect-ga-cta-tile">
			<div className="googlesitekit-km-connect-ga-cta-tile__icon">
				<AnalyticsIcon width="32" height="32" />
			</div>
			<div className="googlesitekit-km-connect-ga-cta-tile__content">
				<p className="googlesitekit-km-connect-ga-cta-tile__text">
					{ __(
						'Google Analytics is disconnected, some of your metrics can’t be displayed',
						'google-site-kit'
					) }
				</p>
				<Link href="" onClick={ handleConnectGA4 }>
					{ __( 'Connect Google Analytics', 'google-site-kit' ) }
				</Link>
			</div>
		</div>
	);
}
