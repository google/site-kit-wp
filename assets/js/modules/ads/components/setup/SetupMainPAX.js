/**
 * Ads Main PAX setup component.
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
 * External dependencies
 */
import { useCallbackOne } from 'use-memo-one';
import { useMount } from 'react-use';

/**
 * WordPress dependencies
 */
import {
	createInterpolateElement,
	Fragment,
	useCallback,
	useRef,
} from '@wordpress/element';
import { __, _x } from '@wordpress/i18n';
import { addQueryArgs } from '@wordpress/url';

/**
 * Internal dependencies
 */
import Data from 'googlesitekit-data';
import { SpinnerButton } from 'googlesitekit-components';
import AdsIcon from '../../../../../svg/graphics/ads.svg';
import SetupForm from './SetupForm';
import SupportLink from '../../../../components/SupportLink';
import AdBlockerWarning from '../common/AdBlockerWarning';
import { CORE_USER } from '../../../../googlesitekit/datastore/user/constants';
import { CORE_LOCATION } from '../../../../googlesitekit/datastore/location/constants';
import {
	ADWORDS_SCOPE,
	MODULES_ADS,
	PAX_SETUP_STEP,
} from '../../datastore/constants';
import useQueryArg from '../../../../hooks/useQueryArg';
import PAXEmbeddedApp from '../common/PAXEmbeddedApp';
const { useSelect, useDispatch } = Data;

const PARAM_SHOW_PAX = 'pax';

export default function SetupMainPAX( { finishSetup } ) {
	const [ showPaxAppQueryParam, setShowPaxAppQueryParam ] =
		useQueryArg( PARAM_SHOW_PAX );
	const showPaxAppStep =
		!! showPaxAppQueryParam && parseInt( showPaxAppQueryParam, 10 );
	const paxAppRef = useRef();

	const isAdBlockerActive = useSelect( ( select ) =>
		select( CORE_USER ).isAdBlockerActive()
	);
	const hasAdwordsScope = useSelect( ( select ) =>
		select( CORE_USER ).hasScope( ADWORDS_SCOPE )
	);
	const hasPaxSettings = useSelect( ( select ) => {
		const { getPaxConversionID, getExtCustomerID } = select( MODULES_ADS );

		return getPaxConversionID() && getExtCustomerID();
	} );

	const redirectURL = addQueryArgs( global.location.href, {
		[ PARAM_SHOW_PAX ]: PAX_SETUP_STEP.LAUNCH,
	} );

	const oAuthURL = useSelect( ( select ) =>
		select( CORE_USER ).getConnectURL( {
			additionalScopes: [ ADWORDS_SCOPE ],
			redirectURL,
		} )
	);
	const isNavigatingToOAuthURL = useSelect( ( select ) => {
		if ( ! oAuthURL ) {
			return false;
		}

		return select( CORE_LOCATION ).isNavigatingTo( oAuthURL );
	} );

	const { navigateTo } = useDispatch( CORE_LOCATION );
	const { setPaxConversionID, setExtCustomerID, submitChanges } =
		useDispatch( MODULES_ADS );

	useMount( () => {
		if ( PAX_SETUP_STEP.FINISHED === showPaxAppStep ) {
			// If the PAX query param indicates the setup is finished on page load,
			// set the step back to the PAX launch, as values are only temporarly
			// saved in state after PAX campaign setup signal is received.
			setShowPaxAppQueryParam( PAX_SETUP_STEP.LAUNCH );
		}
	} );

	// Callback to be executed when a campaign is created in PAX.
	//
	// We use `useCallbackOne` to ensure the function is only created once
	// and not recreated when React potentially uncaches the callback causing
	// it to be recreated and trigger the PAX app to re-render.
	const onCampaignCreated = useCallbackOne( async () => {
		if ( ! paxAppRef?.current ) {
			return;
		}

		/* eslint-disable sitekit/acronym-case */
		// Disabling rule because function and property names
		// are expected in current format by PAX API.
		const { accountService, conversionTrackingIdService } =
			paxAppRef.current.getServices();
		const customerData = await accountService.getAccountId( {} );
		const conversionTrackingData =
			await conversionTrackingIdService.getConversionTrackingId( {} );

		if (
			! customerData.externalCustomerId &&
			! conversionTrackingData.conversionTrackingId
		) {
			return;
		}

		setExtCustomerID( customerData.externalCustomerId );
		setPaxConversionID( conversionTrackingData.conversionTrackingId );
		//setShowPaxAppQueryParam( PAX_SETUP_STEP.FINISHED );
		/* eslint-enable sitekit/acronym-case */
	}, [ setExtCustomerID, setPaxConversionID ] );

	const onCompleteSetup = useCallback( async () => {
		const { error } = await submitChanges();

		if ( error ) {
			return;
		}
		setShowPaxAppQueryParam( PAX_SETUP_STEP.FINISHED );
		finishSetup();
	}, [ submitChanges, setShowPaxAppQueryParam, finishSetup ] );

	const createAccount = useCallback( () => {
		if ( ! hasAdwordsScope ) {
			navigateTo( oAuthURL );
			return;
		}

		setShowPaxAppQueryParam( PAX_SETUP_STEP.LAUNCH );
	}, [ navigateTo, setShowPaxAppQueryParam, hasAdwordsScope, oAuthURL ] );

	return (
		<div className="googlesitekit-setup-module googlesitekit-setup-module--ads">
			<div className="googlesitekit-setup-module__step">
				<div className="googlesitekit-setup-module__logo">
					<AdsIcon width="33" height="33" />
				</div>

				<h2 className="googlesitekit-heading-3 googlesitekit-setup-module__title">
					{ _x( 'Ads', 'Service name', 'google-site-kit' ) }
				</h2>
			</div>
			<AdBlockerWarning />

			{ ! isAdBlockerActive &&
				PAX_SETUP_STEP.FINISHED === showPaxAppStep && (
					<div className="googlesitekit-setup-module__action">
						<SpinnerButton
							isSaving={ isNavigatingToOAuthURL }
							disabled={
								isNavigatingToOAuthURL ||
								! paxAppRef?.current ||
								! hasPaxSettings
							}
							onClick={ onCompleteSetup }
						>
							{ __( 'Complete setup', 'google-site-kit' ) }
						</SpinnerButton>
					</div>
				) }
			{ ! isAdBlockerActive &&
				PAX_SETUP_STEP.LAUNCH === showPaxAppStep &&
				hasAdwordsScope && (
					<Fragment>
						<PAXEmbeddedApp
							displayMode="setup"
							onLaunch={ ( app ) => {
								paxAppRef.current = app;
							} }
							onCampaignCreated={ onCampaignCreated }
							onFinishAndCloseSignUpFlow={ onCompleteSetup }
						/>
					</Fragment>
				) }

			{ ! isAdBlockerActive &&
				( ! showPaxAppStep || ! hasAdwordsScope ) && (
					<Fragment>
						<div className="googlesitekit-setup-module__description">
							{ createInterpolateElement(
								__(
									'Add your conversion ID below. Site Kit will place it on your site so you can track the performance of your Google Ads campaigns. <a>Learn more</a>',
									'google-site-kit'
								),
								{
									a: (
										<SupportLink
											path="/google-ads/thread/108976144/where-i-can-find-google-conversion-id-begins-with-aw"
											external
										/>
									),
								}
							) }
							<br />
							{ __(
								'You can always change this later in Site Kit Settings.',
								'google-site-kit'
							) }
						</div>

						<SetupForm
							finishSetup={ finishSetup }
							isNavigatingToOAuthURL={ isNavigatingToOAuthURL }
							createAccountCTA={
								<Fragment>
									<SpinnerButton
										onClick={ createAccount }
										disabled={ isNavigatingToOAuthURL }
										isSaving={ isNavigatingToOAuthURL }
										inverse
									>
										{ __(
											'Create an account',
											'google-site-kit'
										) }
									</SpinnerButton>
									{ ! hasAdwordsScope && (
										<p className="googlesitekit-setup-module__permission-notice">
											{ __(
												'You’ll be asked to grant Site Kit additional permissions during the account creation process to create a new Ads account.',
												'google-site-kit'
											) }
										</p>
									) }
								</Fragment>
							}
						/>
					</Fragment>
				) }
		</div>
	);
}

SetupMainPAX.defaultProps = {
	finishSetup: () => {},
};
