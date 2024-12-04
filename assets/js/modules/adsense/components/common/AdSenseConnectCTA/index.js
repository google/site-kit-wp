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
import PropTypes from 'prop-types';

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
} from '@wordpress/element';

/**
 * Internal dependencies
 */
import { useSelect, useDispatch } from 'googlesitekit-data';
import { Button, SpinnerButton } from 'googlesitekit-components';
import { MODULES_ADSENSE } from '../../../datastore/constants';
import { Grid, Row, Cell } from '../../../../../material-components';
import { CORE_SITE } from '../../../../../googlesitekit/datastore/site/constants';
import { CORE_MODULES } from '../../../../../googlesitekit/modules/datastore/constants';
import { CORE_LOCATION } from '../../../../../googlesitekit/datastore/location/constants';
import { setItem } from '../../../../../googlesitekit/api/cache';
import { trackEvent } from '../../../../../util';
import ContentAutoUpdate from './ContentAutoUpdate';
import SupportLink from '../../../../../components/SupportLink';
import useViewContext from '../../../../../hooks/useViewContext';

export default function AdSenseConnectCTA( { onDismissModule } ) {
	const { navigateTo } = useDispatch( CORE_LOCATION );
	const { activateModule } = useDispatch( CORE_MODULES );
	const { setInternalServerError } = useDispatch( CORE_SITE );

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

	const adminReauthURL = useSelect( ( select ) =>
		select( MODULES_ADSENSE ).getAdminReauthURL()
	);
	const adSenseModuleActive = useSelect( ( select ) =>
		select( CORE_MODULES ).isModuleActive( 'adsense' )
	);
	const adSenseModuleConnected = useSelect( ( select ) =>
		select( CORE_MODULES ).isModuleConnected( 'adsense' )
	);

	const isConnectingAdSense = useSelect( ( select ) => {
		const isFetching = select( CORE_MODULES ).isFetchingSetModuleActivation(
			'adsense',
			true
		);

		if ( isFetching ) {
			return true;
		}

		if ( ! adminReauthURL ) {
			return false;
		}

		return select( CORE_LOCATION ).isNavigatingTo( adminReauthURL );
	} );

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

		await setItem( 'module_setup', 'adsense', { ttl: 300 } );

		navigateTo( response.moduleReauthURL );
	}, [ activateModule, navigateTo, setInternalServerError, viewContext ] );

	const handleCompleteSetup = useCallback(
		() => navigateTo( adminReauthURL ),
		[ adminReauthURL, navigateTo ]
	);

	const handleDismissModule = useCallback( () => {
		trackEvent( `${ viewContext }_adsense-cta-widget`, 'dismiss_widget' );
		onDismissModule();
	}, [ onDismissModule, viewContext ] );

	const cellProps = {
		smSize: 4,
		mdSize: 4,
		lgSize: 6,
	};

	return (
		<section
			ref={ trackingRef }
			className="googlesitekit-setup__wrapper googlesitekit-setup__wrapper--adsense-connect"
		>
			<Grid>
				<ContentAutoUpdate hasBeenInView={ hasBeenInView } />
				<Row>
					<Cell { ...cellProps }>
						<div className="googlesitekit-setup-module__action">
							{ ! adSenseModuleActive && (
								<SpinnerButton
									onClick={ handleConnect }
									isSaving={ isConnectingAdSense }
								>
									{ __( 'Connect now', 'google-site-kit' ) }
								</SpinnerButton>
							) }

							{ adSenseModuleActive && ! adSenseModuleConnected && (
								<SpinnerButton
									onClick={ handleCompleteSetup }
									isSaving={ isConnectingAdSense }
								>
									{ __(
										'Complete setup',
										'google-site-kit'
									) }
								</SpinnerButton>
							) }

							<Button tertiary onClick={ handleDismissModule }>
								{ __( 'Maybe later', 'google-site-kit' ) }
							</Button>
						</div>
					</Cell>
					<Cell
						{ ...cellProps }
						className="googlesitekit-setup-module__footer-text"
					>
						<p>
							{ createInterpolateElement(
								__(
									'AdSense accounts are <a>subject to review and approval</a> by the Google AdSense team',
									'google-site-kit'
								),
								{
									a: (
										<SupportLink
											path="/adsense/answer/9724"
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
	);
}

AdSenseConnectCTA.propTypes = {
	onDismissModule: PropTypes.func.isRequired,
};
