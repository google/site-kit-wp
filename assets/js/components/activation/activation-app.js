/**
 * Activation App component.
 *
 * Site Kit by Google, Copyright 2021 Google LLC
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
import { useMount } from 'react-use';

/**
 * WordPress dependencies
 */
import { useCallback } from '@wordpress/element';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import Data from 'googlesitekit-data';
import { Button } from 'googlesitekit-components';
import Logo from '../Logo';
import { Grid, Row, Cell } from '../../material-components';
import { trackEvent } from '../../util';
import { CORE_SITE } from '../../googlesitekit/datastore/site/constants';
import {
	CORE_USER,
	PERMISSION_VIEW_DASHBOARD,
} from '../../googlesitekit/datastore/user/constants';
import { CORE_LOCATION } from '../../googlesitekit/datastore/location/constants';
import useViewContext from '../../hooks/useViewContext';
const { useSelect, useDispatch } = Data;

export function ActivationApp() {
	const { navigateTo } = useDispatch( CORE_LOCATION );
	const viewContext = useViewContext();

	const dashboardURL = useSelect( ( select ) =>
		select( CORE_SITE ).getAdminURL( 'googlesitekit-dashboard' )
	);
	const splashURL = useSelect( ( select ) =>
		select( CORE_SITE ).getAdminURL( 'googlesitekit-splash' )
	);
	const canViewDashboard = useSelect( ( select ) =>
		select( CORE_USER ).hasCapability( PERMISSION_VIEW_DASHBOARD )
	);

	useMount( () => {
		trackEvent( viewContext, 'view_notification' );
	} );

	const buttonURL = canViewDashboard ? dashboardURL : splashURL;
	const buttonLabel = canViewDashboard
		? __( 'Go to Dashboard', 'google-site-kit' )
		: __( 'Start setup', 'google-site-kit' );

	const onButtonClick = useCallback(
		async ( event ) => {
			event.preventDefault();
			const eventLabel = canViewDashboard ? 'dashboard' : 'splash';
			await trackEvent( viewContext, 'confirm_notification', eventLabel );

			navigateTo( buttonURL );
		},
		[ buttonURL, canViewDashboard, navigateTo, viewContext ]
	);

	if ( ! buttonURL ) {
		return null;
	}

	return (
		<Grid>
			<Row>
				<Cell size={ 12 }>
					<Logo />
					<h3 className="googlesitekit-heading-3 googlesitekit-activation__title">
						{ __(
							'Congratulations, the Site Kit plugin is now activated.',
							'google-site-kit'
						) }
					</h3>
					<Button
						id="start-setup-link"
						className="googlesitekit-start-setup"
						onClick={ onButtonClick }
					>
						{ buttonLabel }
					</Button>
				</Cell>
			</Row>
		</Grid>
	);
}
