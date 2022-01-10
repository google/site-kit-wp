/**
 * AdSenseConnectCTA component.
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
 * WordPress dependencies
 */
import { __, _x } from '@wordpress/i18n';
import { ESCAPE } from '@wordpress/keycodes';
import {
	createInterpolateElement,
	useEffect,
	useCallback,
	useContext,
	useState,
} from '@wordpress/element';

/**
 * Internal dependencies
 */
import Data from 'googlesitekit-data';
import { MODULES_ADSENSE } from '../../datastore/constants';
import { Grid, Row, Cell } from '../../../../material-components';
import { ADSENSE_CTA_WIDGET_DISMISSED_ITEM_KEY } from '../../constants';
import { CORE_USER } from '../../../../googlesitekit/datastore/user/constants';
import { CORE_SITE } from '../../../../googlesitekit/datastore/site/constants';
import { CORE_MODULES } from '../../../../googlesitekit/modules/datastore/constants';
import { CORE_LOCATION } from '../../../../googlesitekit/datastore/location/constants';
import { trackEvent } from '../../../../util';
import Link from '../../../../components/Link';
import Button from '../../../../components/Button';
import Portal from '../../../../components/Portal';
import Dialog from '../../../../components/Dialog';
import AdSenseIcon from '../../../../../svg/graphics/adsense.svg';
import ViewContextContext from '../../../../components/Root/ViewContextContext';
const { useSelect, useDispatch } = Data;

export default function AdSenseConnectCTA() {
	const [ dialogActive, setDialogActive ] = useState( false );

	const { dismissItem } = useDispatch( CORE_USER );
	const { navigateTo } = useDispatch( CORE_LOCATION );
	const { activateModule } = useDispatch( CORE_MODULES );
	const { setInternalServerError } = useDispatch( CORE_SITE );

	const viewContext = useContext( ViewContextContext );

	const supportURL = useSelect( ( select ) =>
		select( CORE_SITE ).getGoogleSupportURL( {
			path: '/adsense/answer/9724',
		} )
	);
	const adminReauthURL = useSelect( ( select ) =>
		select( MODULES_ADSENSE ).getAdminReauthURL()
	);
	const isDismissingItem = useSelect( ( select ) =>
		select( CORE_USER ).isDismissingItem(
			ADSENSE_CTA_WIDGET_DISMISSED_ITEM_KEY
		)
	);
	const adSenseModuleActive = useSelect( ( select ) =>
		select( CORE_MODULES ).isModuleActive( 'adsense' )
	);
	const adSenseModuleConnected = useSelect( ( select ) =>
		select( CORE_MODULES ).isModuleConnected( 'adsense' )
	);

	const handleConnect = useCallback( async () => {
		const { response, error } = await activateModule( 'adsense' );

		if ( error ) {
			setInternalServerError( {
				id: 'setup-module-error',
				description: error.message,
			} );
			return null;
		}

		await trackEvent(
			`${ viewContext }_widget-activation-cta`,
			'activate_module',
			'adsense'
		);

		navigateTo( response.moduleReauthURL );
	}, [ activateModule, navigateTo, setInternalServerError, viewContext ] );

	const handleCompleteSetup = useCallback(
		() => navigateTo( adminReauthURL ),
		[ adminReauthURL, navigateTo ]
	);

	const handleDismissModule = useCallback( () => {
		setDialogActive( true );
	}, [] );

	const handleConfirmDialog = useCallback( async () => {
		await dismissItem( ADSENSE_CTA_WIDGET_DISMISSED_ITEM_KEY );
	}, [ dismissItem ] );

	const handleDismissDialog = useCallback( () => {
		setDialogActive( false );
	}, [] );

	useEffect( () => {
		const handleDialogClose = ( e ) => {
			// Close if Escape key is pressed.
			if ( ESCAPE === e.keyCode ) {
				setDialogActive( false );
			}
		};

		global.addEventListener( 'keyup', handleDialogClose );

		return () => {
			global.removeEventListener( 'keyup', handleDialogClose );
		};
	}, [] );

	return (
		<section className="googlesitekit-setup__wrapper googlesitekit-setup__wrapper--adsense-connect">
			<Grid>
				<Row>
					<Cell size={ 12 }>
						<p className="googlesitekit-setup__intro-title googlesitekit-overline">
							{ __( 'Connect Service', 'google-site-kit' ) }
						</p>

						<div className="googlesitekit-setup-module googlesitekit-setup-module--adsense">
							<div className="googlesitekit-setup-module__step">
								<div className="googlesitekit-setup-module__logo">
									<AdSenseIcon width="33" height="33" />
								</div>

								<h2 className="googlesitekit-heading-3 googlesitekit-setup-module__title">
									{ _x(
										'AdSense',
										'Service name',
										'google-site-kit'
									) }
								</h2>
							</div>

							<div className="googlesitekit-setup-module__step">
								<h3 className="googlesitekit-heading-4 googlesitekit-setup-module__title">
									<span>
										{ __(
											'Revenue metrics are powered by Google AdSense',
											'google-site-kit'
										) }
									</span>
								</h3>

								<p>
									{ __(
										'Earn money by placing ads on your site. Google AdSense will help you place ads in exactly the right places to optimize how much you earn from your content.',
										'google-site-kit'
									) }
								</p>

								<div className="googlesitekit-setup-module__action">
									{ ! adSenseModuleActive && (
										<Button onClick={ handleConnect }>
											{ __(
												'Connect',
												'google-site-kit'
											) }
										</Button>
									) }

									{ adSenseModuleActive &&
										! adSenseModuleConnected && (
											<Button
												onClick={ handleCompleteSetup }
											>
												{ __(
													'Complete setup',
													'google-site-kit'
												) }
											</Button>
										) }

									<Link
										onClick={ handleDismissModule }
										inherit
									>
										{ __(
											'Not interested',
											'google-site-kit'
										) }
									</Link>
								</div>

								<p className="googlesitekit-setup-module__footer-text">
									{ createInterpolateElement(
										__(
											'AdSense accounts are <a>subject to review and approval</a> by the Google AdSense team.',
											'google-site-kit'
										),
										{
											a: (
												<Link
													href={ supportURL }
													external
													hideExternalIndicator
													inherit
												/>
											),
										}
									) }
								</p>

								<Portal>
									<Dialog
										dialogActive={ dialogActive }
										handleConfirm={ handleConfirmDialog }
										handleDialog={ handleDismissDialog }
										title={ __(
											'This will remove the Revenue section from your dashboard',
											'google-site-kit'
										) }
										confirmButton={ __(
											'Yes, remove',
											'google-site-kit'
										) }
										dependentModules={ __(
											'You can always reactivate it by connecting Google AdSense in Settings',
											'google-site-kit'
										) }
										inProgress={ isDismissingItem }
									/>
								</Portal>
							</div>
						</div>
					</Cell>
				</Row>
			</Grid>
		</section>
	);
}
