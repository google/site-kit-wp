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
 * External dependencies
 */
import { useIntersection } from 'react-use';

/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import {
	createInterpolateElement,
	useEffect,
	useCallback,
	useRef,
	useState,
	Fragment,
} from '@wordpress/element';

/**
 * Internal dependencies
 */
import Data from 'googlesitekit-data';
import { MODULES_ADSENSE } from '../../../datastore/constants';
import { Grid, Row, Cell } from '../../../../../material-components';
import { ADSENSE_CTA_WIDGET_DISMISSED_ITEM_KEY } from '../../../constants';
import { CORE_USER } from '../../../../../googlesitekit/datastore/user/constants';
import { CORE_SITE } from '../../../../../googlesitekit/datastore/site/constants';
import { CORE_MODULES } from '../../../../../googlesitekit/modules/datastore/constants';
import { CORE_LOCATION } from '../../../../../googlesitekit/datastore/location/constants';
import { trackEvent } from '../../../../../util';
import ContentAutoUpdate from './ContentAutoUpdate';
import ContentSwipeable from './ContentSwipeable';
import Link from '../../../../../components/Link';
import Button from '../../../../../components/Button';
import Tooltip from '../../../../../components/Tooltip';
import useViewContext from '../../../../../hooks/useViewContext';
import {
	useBreakpoint,
	BREAKPOINT_SMALL,
} from '../../../../../hooks/useBreakpoint';
const { useSelect, useDispatch } = Data;

export default function AdSenseConnectCTA() {
	const [ { isTooltipVisible, rehideAdminMenu }, setShowTooltip ] = useState(
		{
			isTooltipVisible: false,
			rehideAdminMenu: false,
		}
	);

	const { dismissItem } = useDispatch( CORE_USER );
	const { navigateTo } = useDispatch( CORE_LOCATION );
	const { activateModule } = useDispatch( CORE_MODULES );
	const { setInternalServerError } = useDispatch( CORE_SITE );

	const breakpoint = useBreakpoint();

	const viewContext = useViewContext();
	const trackingRef = useRef();

	const [ hasBeenInView, setHasBeenInView ] = useState( false );
	const intersectionEntry = useIntersection( trackingRef, {
		threshold: 0.25,
	} );
	const inView = !! intersectionEntry?.intersectionRatio;
	useEffect( () => {
		if ( inView && ! hasBeenInView ) {
			trackEvent( `${ viewContext }_adsense-cta-widget`, 'widget_view' );
			setHasBeenInView( true );
		}
	}, [ inView, viewContext, hasBeenInView ] );

	const supportURL = useSelect( ( select ) =>
		select( CORE_SITE ).getGoogleSupportURL( {
			path: '/adsense/answer/9724',
		} )
	);
	const adminReauthURL = useSelect( ( select ) =>
		select( MODULES_ADSENSE ).getAdminReauthURL()
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
			`${ viewContext }_adsense-cta-widget`,
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
		trackEvent( `${ viewContext }_adsense-cta-widget`, 'dismiss_widget' );

		// Check if the WordPress admin menu is open, and if not, open it.
		const isAdminMenuOpen = !! document.querySelector(
			'#wpwrap.wp-responsive-open'
		);
		if ( ! isAdminMenuOpen ) {
			document.getElementById( 'wp-admin-bar-menu-toggle' )?.click();
		}

		setShowTooltip( {
			isTooltipVisible: true,
			rehideAdminMenu: ! isAdminMenuOpen,
		} );
	}, [ viewContext ] );

	const handleDismissTooltip = useCallback( async () => {
		// If the WordPress admin menu was closed, re-close it.
		if ( rehideAdminMenu ) {
			document.getElementById( 'wp-admin-bar-menu-toggle' )?.click();
		}

		await trackEvent(
			`${ viewContext }_adsense-cta-widget`,
			'dismiss_tooltip'
		);
		await dismissItem( ADSENSE_CTA_WIDGET_DISMISSED_ITEM_KEY );
	}, [ dismissItem, rehideAdminMenu, viewContext ] );

	const cellProps = {
		smSize: 4,
		mdSize: 4,
		lgSize: 6,
	};

	return (
		<Fragment>
			{ ! isTooltipVisible && (
				<section
					ref={ trackingRef }
					className="googlesitekit-setup__wrapper googlesitekit-setup__wrapper--adsense-connect"
				>
					<Grid>
						{ breakpoint === BREAKPOINT_SMALL && (
							<ContentSwipeable />
						) }
						{ breakpoint !== BREAKPOINT_SMALL && (
							<ContentAutoUpdate />
						) }
						<Row>
							<Cell { ...cellProps }>
								<div className="googlesitekit-setup-module__action">
									{ ! adSenseModuleActive && (
										<Button onClick={ handleConnect }>
											{ __(
												'Connect now',
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

									<Link onClick={ handleDismissModule }>
										{ __(
											'Maybe later',
											'google-site-kit'
										) }
									</Link>
								</div>
							</Cell>
							<Cell
								{ ...cellProps }
								className="googlesitekit-setup-module__footer-text"
							>
								<p>
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
												/>
											),
										}
									) }
								</p>
							</Cell>
						</Row>
					</Grid>
				</section>
			) }
			{ isTooltipVisible && (
				<Tooltip
					title={ __(
						'You can always connect AdSense from here later',
						'google-site-kit'
					) }
					content={ __(
						'The Monetization section will be added back to your dashboard if you connect AdSense in Settings later.',
						'google-site-kit'
					) }
					dismissLabel={ __( 'Got it', 'google-site-kit' ) }
					target="#adminmenu [href*='page=googlesitekit-settings']"
					onDismiss={ handleDismissTooltip }
				/>
			) }
		</Fragment>
	);
}
