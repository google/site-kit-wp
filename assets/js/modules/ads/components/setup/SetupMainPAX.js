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
import classnames from 'classnames';
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
	useState,
} from '@wordpress/element';
import { __, _x } from '@wordpress/i18n';
import { addQueryArgs } from '@wordpress/url';

/**
 * Internal dependencies
 */
import { useSelect, useDispatch, useRegistry } from 'googlesitekit-data';
import { ProgressBar, SpinnerButton } from 'googlesitekit-components';
import AdsIcon from '../../../../../svg/graphics/ads.svg';
import SetupFormPAX from './SetupFormPAX';
import AdBlockerWarning from '../../../../components/notifications/AdBlockerWarning';
import { CORE_USER } from '../../../../googlesitekit/datastore/user/constants';
import { CORE_LOCATION } from '../../../../googlesitekit/datastore/location/constants';
import {
	ADS_WOOCOMMERCE_REDIRECT_MODAL_DISMISS_KEY,
	ADWORDS_SCOPE,
	MODULES_ADS,
	SUPPORT_CONTENT_SCOPE,
} from '../../datastore/constants';
import useQueryArg from '../../../../hooks/useQueryArg';
import PAXEmbeddedApp from '../common/PAXEmbeddedApp';
import { CORE_SITE } from '../../../../googlesitekit/datastore/site/constants';
import {
	PAX_PARAM_SETUP_STEP,
	PAX_SETUP_STEP,
	PAX_SETUP_SUCCESS_NOTIFICATION,
} from '../../pax/constants';
import { Cell, Row } from '../../../../material-components';
import { WooCommerceRedirectModal } from '../common';
import Link from '../../../../components/Link';

export default function SetupMainPAX( { finishSetup } ) {
	const [ openDialog, setOpenDialog ] = useState( false );
	const [ showPaxAppQueryParam, setShowPaxAppQueryParam ] =
		useQueryArg( PAX_PARAM_SETUP_STEP );
	const showPaxAppStep =
		!! showPaxAppQueryParam && parseInt( showPaxAppQueryParam, 10 );
	const paxAppRef = useRef();

	const [ shouldShowProgressBar, setShouldShowProgressBar ] =
		useState( false );

	const isAdBlockerActive = useSelect( ( select ) =>
		select( CORE_USER ).isAdBlockerActive()
	);
	const hasAdwordsScope = useSelect( ( select ) =>
		select( CORE_USER ).hasScope( ADWORDS_SCOPE )
	);

	const oAuthURL = useSelect( ( select ) => {
		const redirectURL = addQueryArgs( global.location.href, {
			[ PAX_PARAM_SETUP_STEP ]: PAX_SETUP_STEP.LAUNCH,
		} );
		return select( CORE_USER ).getConnectURL( {
			additionalScopes: [ ADWORDS_SCOPE, SUPPORT_CONTENT_SCOPE ],
			redirectURL,
		} );
	} );

	const isNavigatingToOAuthURL = useSelect( ( select ) => {
		if ( ! oAuthURL ) {
			return false;
		}

		return select( CORE_LOCATION ).isNavigatingTo( oAuthURL );
	} );

	const { navigateTo } = useDispatch( CORE_LOCATION );
	const {
		setPaxConversionID,
		setCustomerID,
		setExtCustomerID,
		setFormattedExtCustomerID,
		setUserID,
		setAccountOverviewURL,
		submitChanges,
	} = useDispatch( MODULES_ADS );

	useMount( () => {
		if ( PAX_SETUP_STEP.FINISHED === showPaxAppStep ) {
			// If the PAX query param indicates the setup is finished on page load,
			// set the step back to the PAX launch, as values are only temporarily
			// saved in state after PAX campaign setup signal is received.
			setShowPaxAppQueryParam( PAX_SETUP_STEP.LAUNCH );
		}
	} );

	const { setConversionTrackingEnabled, saveConversionTrackingSettings } =
		useDispatch( CORE_SITE );

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
		const googleAdsURLData = await accountService.getGoogleAdsUrl( {} );
		const conversionTrackingData =
			await conversionTrackingIdService.getConversionTrackingId( {} );

		if (
			! customerData.externalCustomerId &&
			! conversionTrackingData.conversionTrackingId
		) {
			return;
		}

		setUserID( customerData.userId );
		setCustomerID( customerData.customerId );
		setExtCustomerID( customerData.externalCustomerId );
		setFormattedExtCustomerID( customerData.formattedExternalCustomerId );
		setPaxConversionID( conversionTrackingData.conversionTrackingId );
		setAccountOverviewURL( googleAdsURLData.accountOverviewUrl );
		/* eslint-enable sitekit/acronym-case */

		// Here we save settings right away but leave final navigation to `onSetupComplete`.
		const { error } = await submitChanges();

		if ( ! error ) {
			setConversionTrackingEnabled( true );
			await saveConversionTrackingSettings();
		}
	}, [ setExtCustomerID, setPaxConversionID ] );

	const registry = useRegistry();
	const onCompleteSetup = useCallbackOne( async () => {
		// Encapsulate dependencies to avoid function changing after launch.
		const { select, resolveSelect } = registry;
		await resolveSelect( CORE_SITE ).getSiteInfo();
		const redirectURL = select( CORE_SITE ).getAdminURL(
			'googlesitekit-dashboard',
			{
				notification: PAX_SETUP_SUCCESS_NOTIFICATION,
			}
		);
		finishSetup( redirectURL );
	}, [ registry, finishSetup ] );

	const isWooCommerceRedirectModalDismissed = useSelect( ( select ) =>
		select( CORE_USER ).isItemDismissed(
			ADS_WOOCOMMERCE_REDIRECT_MODAL_DISMISS_KEY
		)
	);
	const isWooCommerceActivated = useSelect( ( select ) =>
		select( MODULES_ADS ).isWooCommerceActivated()
	);

	const createAccount = useCallback( () => {
		setShouldShowProgressBar( true );

		if ( ! hasAdwordsScope ) {
			navigateTo( oAuthURL );
			return;
		}

		setShowPaxAppQueryParam( PAX_SETUP_STEP.LAUNCH );

		setShouldShowProgressBar( false );
	}, [ navigateTo, setShowPaxAppQueryParam, hasAdwordsScope, oAuthURL ] );

	const onLaunch = useCallback( ( app ) => {
		paxAppRef.current = app;
	}, [] );

	const onSetupCallback = useCallback( () => {
		if ( isWooCommerceActivated && ! isWooCommerceRedirectModalDismissed ) {
			setOpenDialog( true );
			return;
		}

		createAccount();
	}, [
		isWooCommerceActivated,
		isWooCommerceRedirectModalDismissed,
		setOpenDialog,
		createAccount,
	] );

	const setupNewAdsAccountSupportURL = useSelect( ( select ) =>
		select( CORE_SITE ).getDocumentationLinkURL(
			'ads-set-up-a-new-ads-account'
		)
	);
	const setupExistingAdsAccountSupportURL = useSelect( ( select ) =>
		select( CORE_SITE ).getDocumentationLinkURL(
			'ads-connect-an-existing-ads-account'
		)
	);

	return (
		<div
			className={ classnames(
				'googlesitekit-setup-module',
				'googlesitekit-setup-module--ads',
				{
					'has-pax-flow':
						! isAdBlockerActive &&
						PAX_SETUP_STEP.LAUNCH === showPaxAppStep &&
						hasAdwordsScope,
				}
			) }
		>
			<div className="googlesitekit-setup-module__step">
				<div className="googlesitekit-setup-module__logo">
					<AdsIcon width="40" height="40" />
				</div>

				<h2 className="googlesitekit-heading-3 googlesitekit-setup-module__title">
					{ _x( 'Ads', 'Service name', 'google-site-kit' ) }
				</h2>
			</div>
			<div className="googlesitekit-setup-module__step">
				<AdBlockerWarning moduleSlug="ads" />

				{ shouldShowProgressBar && <ProgressBar /> }

				{ ! isAdBlockerActive &&
					PAX_SETUP_STEP.LAUNCH === showPaxAppStep &&
					hasAdwordsScope && (
						<Row>
							<Cell mdSize={ 12 } lgSize={ 12 }>
								<PAXEmbeddedApp
									displayMode="setup"
									onLaunch={ onLaunch }
									onCampaignCreated={ onCampaignCreated }
									onFinishAndCloseSignUpFlow={
										onCompleteSetup
									}
								/>
							</Cell>
						</Row>
					) }

				{ ! isAdBlockerActive &&
					( ! showPaxAppStep || ! hasAdwordsScope ) && (
						<Fragment>
							<Row className="googlesitekit-setup-module--ads--setup-container">
								<Cell
									smSize={ 8 }
									mdSize={ 8 }
									lgSize={ 5 }
									className="align-top"
								>
									<h3>
										{ __(
											'Set up a new Ads account',
											'google-site-kit'
										) }
									</h3>
									<p className="instructions">
										{ createInterpolateElement(
											__(
												'Create your first Ads campaign, add billing information, and choose your conversion goals. To create a new Ads account, you’ll need to grant Site Kit additional permissions during the account creation process. <a>Learn more</a>',
												'google-site-kit'
											),
											{
												a: (
													<Link
														href={
															setupNewAdsAccountSupportURL
														}
														external
													/>
												),
											}
										) }
									</p>
									<Fragment>
										<SpinnerButton
											onClick={ onSetupCallback }
											disabled={ isNavigatingToOAuthURL }
											isSaving={ isNavigatingToOAuthURL }
										>
											{ __(
												'Start setup wizard',
												'google-site-kit'
											) }
										</SpinnerButton>
									</Fragment>
								</Cell>
								<Cell
									className="divider"
									smSize={ 8 }
									mdSize={ 8 }
									lgSize={ 2 }
								>
									<span className="divider-line" />
									<span className="divider-label">
										{ __( 'OR', 'google-site-kit' ) }
									</span>
								</Cell>
								<Cell smSize={ 8 } mdSize={ 8 } lgSize={ 5 }>
									<h3>
										{ __(
											'Connect an existing Ads account',
											'google-site-kit'
										) }
									</h3>
									<p className="instructions">
										{ createInterpolateElement(
											__(
												'To track conversions for your Ads campaign, you need to add your Conversion ID to Site Kit. You can always change the Conversion ID later in Site Kit Settings. <a>Learn more</a>',
												'google-site-kit'
											),
											{
												a: (
													<Link
														href={
															setupExistingAdsAccountSupportURL
														}
														external
													/>
												),
												br: <br />,
											}
										) }
									</p>
									<SetupFormPAX
										finishSetup={ finishSetup }
										isNavigatingToOAuthURL={
											isNavigatingToOAuthURL
										}
									/>
								</Cell>
							</Row>
						</Fragment>
					) }
			</div>
			{ openDialog && (
				<WooCommerceRedirectModal
					onClose={ () => setOpenDialog( false ) }
					onContinue={ createAccount }
					dialogActive
				/>
			) }
		</div>
	);
}

SetupMainPAX.defaultProps = {
	finishSetup: () => {},
};
