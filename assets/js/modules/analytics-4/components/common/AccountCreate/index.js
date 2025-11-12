/**
 * AccountCreate component.
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
import PropTypes from 'prop-types';

/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import {
	useCallback,
	useState,
	useEffect,
	createInterpolateElement,
} from '@wordpress/element';
import { getQueryArg } from '@wordpress/url';

/**
 * Internal dependencies
 */
import { invalidateCache } from 'googlesitekit-api';
import { useSelect, useDispatch } from 'googlesitekit-data';
import { Button, ProgressBar } from 'googlesitekit-components';
import { useFeature } from '@/js/hooks/useFeature';
import {
	FORM_ACCOUNT_CREATE,
	EDIT_SCOPE,
	GTM_SCOPE,
	MODULES_ANALYTICS_4,
} from '@/js/modules/analytics-4/datastore/constants';
import { MODULE_SLUG_ANALYTICS_4 } from '@/js/modules/analytics-4/constants';
import { CORE_SITE } from '@/js/googlesitekit/datastore/site/constants';
import { CORE_USER } from '@/js/googlesitekit/datastore/user/constants';
import { CORE_FORMS } from '@/js/googlesitekit/datastore/forms/constants';
import { CORE_LOCATION } from '@/js/googlesitekit/datastore/location/constants';
import { ERROR_CODE_MISSING_REQUIRED_SCOPE } from '@/js/util/errors';
import { trackEvent } from '@/js/util';
import { getAccountDefaults as getAccountDefaults } from '@/js/modules/analytics-4/utils/account';
import { Cell } from '@/js/material-components';
import StoreErrorNotices from '@/js/components/StoreErrorNotices';
import TimezoneSelect from './TimezoneSelect';
import AccountField from './AccountField';
import PropertyField from './PropertyField';
import CountrySelect from './CountrySelect';
import WebDataStreamField from './WebDataStreamField';
import { EnhancedMeasurementSwitch } from '@/js/modules/analytics-4/components/common';
import useViewContext from '@/js/hooks/useViewContext';
import SetupPluginConversionTrackingNotice from '@/js/components/conversion-tracking/SetupPluginConversionTrackingNotice';
import Typography from '@/js/components/Typography';
import useFormValue from '@/js/hooks/useFormValue';
import P from '@/js/components/Typography/P';
import Link from '@/js/components/Link';
import Null from '@/js/components/Null';

export default function AccountCreate( { className } ) {
	const setupFlowRefreshEnabled = useFeature( 'setupFlowRefresh' );

	const [ isNavigating, setIsNavigating ] = useState( false );
	const accounts = useSelect( ( select ) =>
		select( MODULES_ANALYTICS_4 ).getAccountSummaries()
	);

	const hasResolvedAccounts = useSelect( ( select ) =>
		select( MODULES_ANALYTICS_4 ).hasFinishedResolution(
			'getAccountSummaries'
		)
	);
	const accountTicketTermsOfServiceURL = useSelect( ( select ) =>
		select( MODULES_ANALYTICS_4 ).getAccountTicketTermsOfServiceURL()
	);
	const canSubmitAccountCreate = useSelect( ( select ) =>
		select( MODULES_ANALYTICS_4 ).canSubmitAccountCreate()
	);
	const isDoingCreateAccount = useSelect( ( select ) =>
		select( MODULES_ANALYTICS_4 ).isDoingCreateAccount()
	);
	const hasEditScope = useSelect( ( select ) =>
		select( CORE_USER ).hasScope( EDIT_SCOPE )
	);
	const hasGTMScope = useSelect( ( select ) =>
		select( CORE_USER ).hasScope( GTM_SCOPE )
	);
	const hasAccountCreateForm = useSelect( ( select ) =>
		select( CORE_FORMS ).hasForm( FORM_ACCOUNT_CREATE )
	);
	const autoSubmit = useFormValue( FORM_ACCOUNT_CREATE, 'autoSubmit' );
	const siteURL = useSelect( ( select ) =>
		select( CORE_SITE ).getReferenceSiteURL()
	);
	const siteName = useSelect( ( select ) =>
		select( CORE_SITE ).getSiteName()
	);
	const timezone = useSelect( ( select ) =>
		select( CORE_SITE ).getTimezone()
	);
	const pluginConversionsDocumentationURL = useSelect( ( select ) => {
		return select( CORE_SITE ).getDocumentationLinkURL(
			'plugin-conversion-tracking'
		);
	} );

	const viewContext = useViewContext();
	const { setValues } = useDispatch( CORE_FORMS );
	const { navigateTo } = useDispatch( CORE_LOCATION );
	const { createAccount } = useDispatch( MODULES_ANALYTICS_4 );
	const { setPermissionScopeError } = useDispatch( CORE_USER );
	const { setConversionTrackingEnabled, saveConversionTrackingSettings } =
		useDispatch( CORE_SITE );

	const hasRequiredScope = hasEditScope;

	// Redirect if the accountTicketTermsOfServiceURL is set.
	useEffect( () => {
		if ( accountTicketTermsOfServiceURL ) {
			( async () => {
				await invalidateCache( 'modules', MODULE_SLUG_ANALYTICS_4 );
				navigateTo( accountTicketTermsOfServiceURL );
			} )();
		}
	}, [ accountTicketTermsOfServiceURL, navigateTo ] );

	// Set form defaults on initial render.
	useEffect( () => {
		// Only set the form if not already present in store.
		// e.g. after a snapshot has been restored.
		if ( ! hasAccountCreateForm ) {
			setValues(
				FORM_ACCOUNT_CREATE,
				getAccountDefaults( {
					siteName,
					siteURL,
					timezone,
				} )
			);
		}
	}, [ hasAccountCreateForm, siteName, siteURL, timezone, setValues ] );

	const showProgress = getQueryArg( location.href, 'showProgress' );

	const handleSubmit = useCallback( async () => {
		const scopes = [];

		if ( ! hasEditScope ) {
			scopes.push( EDIT_SCOPE );
		}
		// The GTM scope should be granted for GTE support, but
		// it is possible for it not to be at this point.
		// This saves an extra OAuth flow and is necessary for the
		// Google tag sync at the end of the post-provisioning flow.
		if ( ! hasGTMScope ) {
			scopes.push( GTM_SCOPE );
		}

		// If scope not granted, trigger scope error right away. These are
		// typically handled automatically based on API responses, but
		// this particular case has some special handling to improve UX.
		if ( scopes.length > 0 ) {
			// When state is restored, auto-submit the request again.
			setValues( FORM_ACCOUNT_CREATE, { autoSubmit: true } );
			setPermissionScopeError( {
				code: ERROR_CODE_MISSING_REQUIRED_SCOPE,
				message: __(
					'Additional permissions are required to create a new Analytics account.',
					'google-site-kit'
				),
				data: {
					status: 403,
					scopes,
					skipModal: true,
				},
			} );
			return;
		}

		setValues( FORM_ACCOUNT_CREATE, { autoSubmit: false } );
		await trackEvent(
			`${ viewContext }_analytics`,
			'create_account',
			'proxy'
		);

		const { error } = await createAccount( {
			showProgress: showProgress === 'true',
		} );
		if ( ! error ) {
			setConversionTrackingEnabled( true );
			await saveConversionTrackingSettings();
			setIsNavigating( true );
		}
	}, [
		hasEditScope,
		hasGTMScope,
		setValues,
		viewContext,
		createAccount,
		showProgress,
		setPermissionScopeError,
		setConversionTrackingEnabled,
		saveConversionTrackingSettings,
	] );

	// If the user ends up back on this component with the required scope granted,
	// and already submitted the form, trigger the submit again.
	useEffect( () => {
		if ( hasRequiredScope && autoSubmit ) {
			handleSubmit();
		}
	}, [ hasRequiredScope, autoSubmit, handleSubmit ] );

	// If the user clicks "Back", rollback settings to restore saved values, if any.
	const { rollbackSettings } = useDispatch( MODULES_ANALYTICS_4 );
	const handleBack = useCallback(
		() => rollbackSettings(),
		[ rollbackSettings ]
	);

	if (
		isDoingCreateAccount ||
		isNavigating ||
		! hasResolvedAccounts ||
		hasRequiredScope === undefined
	) {
		return <ProgressBar />;
	}

	const isInitialSetupFlow = !! showProgress && setupFlowRefreshEnabled;

	return (
		<div className={ className }>
			<StoreErrorNotices
				moduleSlug="analytics-4"
				storeName={ MODULES_ANALYTICS_4 }
			/>

			{ ! isInitialSetupFlow && (
				<Typography as="h3" type="title" size="large">
					{ __( 'Create your Analytics account', 'google-site-kit' ) }
				</Typography>
			) }

			<P size={ isInitialSetupFlow ? 'large' : undefined }>
				{ __(
					'We’ve pre-filled the required information for your new account. Confirm or edit any details:',
					'google-site-kit'
				) }
			</P>

			<div className="googlesitekit-setup-module__inputs">
				<Cell size={ 6 }>
					<AccountField />
				</Cell>
				<Cell size={ 6 }>
					<PropertyField />
				</Cell>
				<Cell size={ 6 }>
					<WebDataStreamField />
				</Cell>
			</div>

			<div className="googlesitekit-setup-module__inputs">
				<Cell size={ 6 }>
					<CountrySelect />
				</Cell>

				<Cell size={ 6 }>
					<TimezoneSelect />
				</Cell>
			</div>

			<div className="googlesitekit-setup-module__inputs">
				<EnhancedMeasurementSwitch
					formName={ FORM_ACCOUNT_CREATE }
					className="googlesitekit-margin-bottom-0"
				/>

				<SetupPluginConversionTrackingNotice
					message={ createInterpolateElement(
						__(
							'To track how visitors interact with your site, Site Kit will enable plugin conversion tracking. You can always disable it in settings. <LearnMoreLink />',
							'google-site-kit'
						),
						{
							LearnMoreLink: setupFlowRefreshEnabled ? (
								<Link
									href={ pluginConversionsDocumentationURL }
									external
								>
									{ __( 'Learn more', 'google-site-kit' ) }
								</Link>
							) : (
								<Null />
							),
						}
					) }
				/>
			</div>

			<P
				className="googlesitekit-analytics-setup__analytics-create-account-info"
				size={ setupFlowRefreshEnabled ? 'small' : undefined }
			>
				{ hasRequiredScope && (
					<span>
						{ __(
							'You will be redirected to Google Analytics to accept the terms of service.',
							'google-site-kit'
						) }
					</span>
				) }
				{ ! hasRequiredScope && (
					<span>
						{ __(
							'You will need to give Site Kit permission to create an Analytics account on your behalf and also accept the Google Analytics terms of service.',
							'google-site-kit'
						) }
					</span>
				) }
			</P>

			<div className="googlesitekit-setup-module__action">
				<Button
					disabled={ ! canSubmitAccountCreate }
					onClick={ handleSubmit }
				>
					{ __( 'Create Account', 'google-site-kit' ) }
				</Button>

				{ accounts && !! accounts.length && (
					<Button
						className="googlesitekit-setup-module__sub-action"
						onClick={ handleBack }
						tertiary
					>
						{ __( 'Back', 'google-site-kit' ) }
					</Button>
				) }
			</div>
		</div>
	);
}

AccountCreate.propTypes = {
	className: PropTypes.string,
};
