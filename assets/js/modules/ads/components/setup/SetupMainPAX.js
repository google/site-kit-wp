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

/**
 * WordPress dependencies
 */
import {
	createInterpolateElement,
	Fragment,
	useCallback,
	useEffect,
	useRef,
} from '@wordpress/element';
import { __, _x } from '@wordpress/i18n';
import { addQueryArgs } from '@wordpress/url';

/**
 * Internal dependencies
 */
import { useSelect, useDispatch, useRegistry } from 'googlesitekit-data';
import { ProgressBar, SpinnerButton } from 'googlesitekit-components';
import AdsIcon from '../../../../../svg/graphics/ads.svg';
import SetupForm from './SetupForm';
import SupportLink from '../../../../components/SupportLink';
import AdBlockerWarning from '../../../../components/notifications/AdBlockerWarning';
import { CORE_USER } from '../../../../googlesitekit/datastore/user/constants';
import { CORE_LOCATION } from '../../../../googlesitekit/datastore/location/constants';
import {
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
import { useFeature } from '../../../../hooks/useFeature';

export default function SetupMainPAX( { finishSetup } ) {
	const [ showPaxAppQueryParam, setShowPaxAppQueryParam ] =
		useQueryArg( PAX_PARAM_SETUP_STEP );
	const showPaxAppStep =
		!! showPaxAppQueryParam && parseInt( showPaxAppQueryParam, 10 );
	const paxAppRef = useRef();

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
	const { setPaxConversionID, setExtCustomerID, submitChanges } =
		useDispatch( MODULES_ADS );

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
		/* eslint-enable sitekit/acronym-case */

		// Here we save settings right away but leave final navigation to `onSetupComplete`.
		await submitChanges();
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

	const createAccount = useCallback( () => {
		if ( ! hasAdwordsScope ) {
			navigateTo( oAuthURL );
			return;
		}

		setShowPaxAppQueryParam( PAX_SETUP_STEP.LAUNCH );
	}, [ navigateTo, setShowPaxAppQueryParam, hasAdwordsScope, oAuthURL ] );

	const onLaunch = useCallback( ( app ) => {
		paxAppRef.current = app;
	}, [] );

	const isAdsPaxEnabled = useFeature( 'adsPax' );

	useEffect( () => {
		if ( isAdsPaxEnabled ) {
			createAccount();
		}
	}, [ isAdsPaxEnabled, createAccount ] );

	return (
		<div className="googlesitekit-setup-module googlesitekit-setup-module--ads">
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

				{ isAdsPaxEnabled && ! showPaxAppStep && <ProgressBar /> }

				{ ! isAdBlockerActive &&
					PAX_SETUP_STEP.LAUNCH === showPaxAppStep &&
					hasAdwordsScope && (
						<PAXEmbeddedApp
							displayMode="setup"
							onLaunch={ onLaunch }
							onCampaignCreated={ onCampaignCreated }
							onFinishAndCloseSignUpFlow={ onCompleteSetup }
						/>
					) }

				{ ! isAdsPaxEnabled &&
					! isAdBlockerActive &&
					( ! showPaxAppStep || ! hasAdwordsScope ) && (
						<Fragment>
							<p>
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
							</p>

							<SetupForm
								finishSetup={ finishSetup }
								isNavigatingToOAuthURL={
									isNavigatingToOAuthURL
								}
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
		</div>
	);
}

SetupMainPAX.defaultProps = {
	finishSetup: () => {},
};
