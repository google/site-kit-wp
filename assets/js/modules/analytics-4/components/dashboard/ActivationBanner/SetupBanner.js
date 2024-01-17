/**
 * SetupBanner component.
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
import { Fragment, useCallback, useEffect, useState } from '@wordpress/element';
import { addQueryArgs } from '@wordpress/url';
import { __, sprintf } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import { ProgressBar, SpinnerButton } from 'googlesitekit-components';
import Data from 'googlesitekit-data';
import BannerNotification from '../../../../../components/notifications/BannerNotification';
import {
	WebDataStreamSelect,
	PropertySelect,
	UseSnippetSwitch,
} from '../../../../analytics-4/components/common';
import ErrorNotice from '../../../../../components/ErrorNotice';
import {
	MODULES_ANALYTICS_4,
	PROPERTY_CREATE,
} from '../../../datastore/constants';
import useExistingTagEffect from '../../../../analytics-4/hooks/useExistingTagEffect';
import {
	EDIT_SCOPE,
	FORM_SETUP,
	MODULES_ANALYTICS,
} from '../../../../analytics/datastore/constants';
import { CORE_USER } from '../../../../../googlesitekit/datastore/user/constants';
import {
	ACTIVATION_ACKNOWLEDGEMENT_TOOLTIP_STATE_KEY,
	GA4_ACTIVATION_BANNER_STATE_KEY,
} from '../../../constants';
import { useTooltipState } from '../../../../../components/AdminMenuTooltip/useTooltipState';
import { useShowTooltip } from '../../../../../components/AdminMenuTooltip/useShowTooltip';
import { AdminMenuTooltip } from '../../../../../components/AdminMenuTooltip/AdminMenuTooltip';
import { getBannerDismissalExpiryTime } from '../../../utils/banner-dismissal-expiry';
import { Cell, Grid, Row } from '../../../../../material-components';
import { CORE_FORMS } from '../../../../../googlesitekit/datastore/forms/constants';
import { ERROR_CODE_MISSING_REQUIRED_SCOPE } from '../../../../../util/errors';
import useViewContext from '../../../../../hooks/useViewContext';
import { trackEvent } from '../../../../../util';
import { SetupBannerFooter } from './SetupBannerFooter';
import { VARIANT } from './constants';
const { useDispatch, useSelect } = Data;

export default function SetupBanner( { onSubmitSuccess } ) {
	const [ errorNotice, setErrorNotice ] = useState( null );
	const [ variant, setVariant ] = useState( null );
	const [ isSaving, setIsSaving ] = useState( false );
	const [ viewNotificationSent, setViewNotificationSent ] = useState( false );

	const viewContext = useViewContext();
	const eventCategory = `${ viewContext }_ga4-setup-notification`;

	const { submitChanges, selectProperty, matchAndSelectProperty } =
		useDispatch( MODULES_ANALYTICS_4 );

	const accountID = useSelect( ( select ) =>
		select( MODULES_ANALYTICS ).getAccountID()
	);
	const properties = useSelect( ( select ) =>
		select( MODULES_ANALYTICS_4 ).getProperties( accountID )
	);

	// Call getAccounts to ensure it can be resolved before rendering the PropertySelect
	// component, to avoid showing a ProgressBar in the PropertySelect.
	const accounts = useSelect( ( select ) =>
		select( MODULES_ANALYTICS ).getAccounts()
	);

	const getPropertyID = useSelect(
		( select ) => select( MODULES_ANALYTICS_4 ).getPropertyID
	);

	const getMeasurementID = useSelect(
		( select ) => select( MODULES_ANALYTICS_4 ).getMeasurementID
	);

	const determineVariant = useCallback( async () => {
		// Ensure variant is only set once, to avoid flickering between variants. For example
		// when properties.length is zero we are in the "no existing property" variant, and we
		// want to avoid changing to the "existing property" variant mid-way through the form
		// submission as a result of adding a property.
		if ( variant !== null ) {
			return;
		}

		if ( properties === undefined ) {
			return;
		}

		if ( properties.length === 0 ) {
			setVariant( VARIANT.NO_EXISTING_PROPERTY );
			selectProperty( PROPERTY_CREATE );
			return;
		}

		if ( accounts === undefined ) {
			return;
		}

		if ( ! getPropertyID() ) {
			// Ensure the PropertySelect dropdown will be populated with a selected option.
			await matchAndSelectProperty( accountID, PROPERTY_CREATE );
		}

		setVariant( VARIANT.EXISTING_PROPERTY );
	}, [
		accountID,
		accounts,
		getPropertyID,
		matchAndSelectProperty,
		properties,
		selectProperty,
		variant,
	] );

	useEffect( () => {
		if ( ! variant ) {
			determineVariant();
		}
	}, [ variant, determineVariant ] );

	const hasEditScope = useSelect( ( select ) =>
		select( CORE_USER ).hasScope( EDIT_SCOPE )
	);
	const existingTag = useSelect( ( select ) =>
		select( MODULES_ANALYTICS_4 ).getExistingTag()
	);
	const autoSubmit = useSelect( ( select ) =>
		select( CORE_FORMS ).getValue( FORM_SETUP, 'autoSubmit' )
	);

	useExistingTagEffect();

	const referenceDateString = useSelect( ( select ) =>
		select( CORE_USER ).getReferenceDate()
	);

	const { setPermissionScopeError } = useDispatch( CORE_USER );
	const { setValues } = useDispatch( CORE_FORMS );

	const commonSubmitChanges = useCallback( async () => {
		setIsSaving( true );

		const { error } = await submitChanges();

		setIsSaving( false );

		if ( error ) {
			setErrorNotice( error );
			return;
		}

		// Ask the parent component to show the success banner.
		// This should be called last because it will unmount this component.
		onSubmitSuccess();
	}, [ submitChanges, onSubmitSuccess ] );

	const handleSubmitChanges = useCallback( async () => {
		const scopes = [];

		if (
			hasEditScope === false &&
			( getPropertyID() === PROPERTY_CREATE || ! getMeasurementID() )
		) {
			scopes.push( EDIT_SCOPE );
		}

		if (
			variant === VARIANT.NO_EXISTING_PROPERTY ||
			getPropertyID() === PROPERTY_CREATE
		) {
			trackEvent( eventCategory, 'create_property' );
		} else {
			trackEvent( eventCategory, 'connect_property' );
		}

		// If scope not granted, trigger scope error right away. These are
		// typically handled automatically based on API responses, but
		// this particular case has some special handling to improve UX.
		if ( scopes.length > 0 ) {
			setValues( FORM_SETUP, { autoSubmit: true } );
			setValues( GA4_ACTIVATION_BANNER_STATE_KEY, {
				returnToSetupStep: true,
			} );

			const redirectURL = addQueryArgs( global.location.href, {
				notification: 'ga4_setup',
			} );

			setPermissionScopeError( {
				code: ERROR_CODE_MISSING_REQUIRED_SCOPE,
				message: __(
					'Additional permissions are required to create a new GA4 property',
					'google-site-kit'
				),
				data: {
					status: 403,
					scopes,
					skipModal: true,
					redirectURL,
				},
			} );
			return;
		}

		await commonSubmitChanges();
	}, [
		eventCategory,
		variant,
		hasEditScope,
		setPermissionScopeError,
		setValues,
		commonSubmitChanges,
		// Here we pass the selectors through to avoid creating a new
		// callback when the property ID changes on creation.
		getPropertyID,
		getMeasurementID,
	] );

	// If the user lands back on this component with autoSubmit and the edit scope,
	// resubmit the form.
	useEffect( () => {
		async function handleAutoSubmit() {
			// Auto-submit should only auto-invoke once.
			setValues( FORM_SETUP, { autoSubmit: false } );

			await commonSubmitChanges();
		}

		if ( autoSubmit && hasEditScope ) {
			handleAutoSubmit();
		}
	}, [
		autoSubmit,
		hasEditScope,
		setValues,
		commonSubmitChanges,
		onSubmitSuccess,
	] );

	useEffect( () => {
		// Only trigger the view event if the notification is visible and we haven't
		// already sent this notification.
		if ( ! viewNotificationSent && ! autoSubmit && !! variant ) {
			trackEvent( eventCategory, 'view_notification' );
			// Don't send the view event again.
			setViewNotificationSent( true );
		}
	}, [ eventCategory, autoSubmit, variant, viewNotificationSent ] );

	const { isTooltipVisible } = useTooltipState(
		ACTIVATION_ACKNOWLEDGEMENT_TOOLTIP_STATE_KEY
	);

	const showTooltip = useShowTooltip(
		ACTIVATION_ACKNOWLEDGEMENT_TOOLTIP_STATE_KEY
	);

	if ( variant === null ) {
		// Wrap in the googlesitekit-publisher-win class to ensure the output is treated in the same way as BannerNotification,
		// with only one instance visible on the screen at a time.
		return (
			<div className="googlesitekit-publisher-win">
				<Grid>
					<Row>
						<Cell size={ 12 }>
							<ProgressBar />
						</Cell>
					</Row>
				</Grid>
			</div>
		);
	}

	if ( isTooltipVisible ) {
		return (
			<Fragment>
				<AdminMenuTooltip
					title={ __(
						'You can connect Google Analytics 4 later here',
						'google-site-kit'
					) }
					content={ __(
						'You can configure the Google Analytics 4 property inside the Site Kit Settings later',
						'google-site-kit'
					) }
					dismissLabel={ __( 'Remind me later', 'google-site-kit' ) }
					tooltipStateKey={
						ACTIVATION_ACKNOWLEDGEMENT_TOOLTIP_STATE_KEY
					}
				/>
			</Fragment>
		);
	}

	let title;
	let ctaLabel;
	let children;

	if ( variant === VARIANT.EXISTING_PROPERTY ) {
		title = __(
			'Connect the Google Analytics 4 property that’s associated with your existing Universal Analytics property',
			'google-site-kit'
		);
		ctaLabel = __( 'Connect', 'google-site-kit' );
		children = (
			<div className="googlesitekit-ga4-setup-banner__field-group">
				<PropertySelect />
				<WebDataStreamSelect />

				{ existingTag && (
					<UseSnippetSwitch
						description={
							<Fragment>
								<p>
									{ sprintf(
										/* translators: %s: existing tag ID */
										__(
											'A tag %s for the selected property already exists on the site.',
											'google-site-kit'
										),
										existingTag
									) }
								</p>
								<p>
									{ __(
										'Make sure you remove it if you decide to place the same GA4 tag via Site Kit, otherwise they will be duplicated.',
										'google-site-kit'
									) }
								</p>
							</Fragment>
						}
					/>
				) }
			</div>
		);
	} else {
		title = __(
			'No existing Google Analytics 4 property found, Site Kit will help you create a new one and insert it on your site',
			'google-site-kit'
		);
		ctaLabel = __( 'Create property', 'google-site-kit' );
	}

	return (
		<BannerNotification
			id="ga4-activation-banner"
			className="googlesitekit-ga4-setup-banner"
			title={ title }
			ctaComponent={
				<SpinnerButton
					onClick={ handleSubmitChanges }
					isSaving={ isSaving }
				>
					{ ctaLabel }
				</SpinnerButton>
			}
			footer={ <SetupBannerFooter variant={ variant } /> }
			dismiss={ __( 'Cancel', 'google-site-kit' ) }
			dismissExpires={ getBannerDismissalExpiryTime(
				referenceDateString
			) }
			onDismiss={ showTooltip }
		>
			{ errorNotice && <ErrorNotice error={ errorNotice } /> }
			{ children }
		</BannerNotification>
	);
}
