/**
 * Tag Manager Setup Form component.
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
import PropTypes from 'prop-types';

/**
 * WordPress dependencies
 */
import { Fragment, useEffect, useCallback, useState } from '@wordpress/element';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import { useSelect, useDispatch } from 'googlesitekit-data';
import { Button, SpinnerButton } from 'googlesitekit-components';
import {
	MODULES_TAGMANAGER,
	FORM_SETUP,
	EDIT_SCOPE,
	SETUP_MODE_WITH_ANALYTICS,
} from '@/js/modules/tagmanager/datastore/constants';
import { CORE_FORMS } from '@/js/googlesitekit/datastore/forms/constants';
import { CORE_USER } from '@/js/googlesitekit/datastore/user/constants';
import { CORE_MODULES } from '@/js/googlesitekit/modules/datastore/constants';
import { CORE_LOCATION } from '@/js/googlesitekit/datastore/location/constants';
import { isPermissionScopeError } from '@/js/util/errors';
import { setItem } from '@/js/googlesitekit/api/cache';
import {
	AccountSelect,
	AMPContainerSelect,
	ContainerNames,
	FormInstructions,
	WebContainerSelect,
	TagCheckProgress,
} from '@/js/modules/tagmanager/components/common';
import SetupErrorNotice from './SetupErrorNotice';
import SetupUseSnippetSwitch from './SetupUseSnippetSwitch';
import { MODULE_SLUG_ANALYTICS_4 } from '@/js/modules/analytics-4/constants';
import useFormValue from '@/js/hooks/useFormValue';

export default function SetupForm( { finishSetup } ) {
	const canSubmitChanges = useSelect( ( select ) =>
		select( MODULES_TAGMANAGER ).canSubmitChanges()
	);
	const currentGTMGoogleTagID = useSelect( ( select ) =>
		select( MODULES_TAGMANAGER ).getCurrentGTMGoogleTagID()
	);
	const analyticsModuleAvailable = useSelect( ( select ) =>
		select( CORE_MODULES ).isModuleAvailable( MODULE_SLUG_ANALYTICS_4 )
	);
	const analyticsModuleActive = useSelect( ( select ) =>
		select( CORE_MODULES ).isModuleActive( MODULE_SLUG_ANALYTICS_4 )
	);
	const hasEditScope = useSelect( ( select ) =>
		select( CORE_USER ).hasScope( EDIT_SCOPE )
	);
	// Only select the initial autosubmit + submitMode once from form state which will already be set if a snapshot was restored.
	const initialAutoSubmit = useFormValue( FORM_SETUP, 'autoSubmit' );
	const initialSubmitMode = useFormValue( FORM_SETUP, 'submitMode' );

	const hasExistingTag = useSelect( ( select ) =>
		select( MODULES_TAGMANAGER ).hasExistingTag()
	);

	const submitInProgress = useFormValue( FORM_SETUP, 'submitInProgress' );
	const isSaving = useSelect(
		( select ) =>
			select( MODULES_TAGMANAGER ).isDoingSubmitChanges() ||
			select( CORE_LOCATION ).isNavigating() ||
			submitInProgress
	);

	// This flag is be used to determine whether to show the loading spinner
	// within the "Continue to Analytics setup" button when setting up GTM with Analytics.
	// It prevents the spinner from showing when the user opts to set up GTM without Analytics.
	const [ isSavingWithAnalytics, setIsSavingWithAnalytics ] =
		useState( false );

	const { setValues } = useDispatch( CORE_FORMS );
	const { activateModule } = useDispatch( CORE_MODULES );
	const { submitChanges } = useDispatch( MODULES_TAGMANAGER );
	const submitForm = useCallback(
		async ( { submitMode } = {} ) => {
			async function throwOnError( func ) {
				const { error } = ( await func() ) || {};
				if ( error ) {
					throw error;
				}
			}
			// We'll use form state to persist the chosen submit choice
			// in order to preserve support for auto-submit.
			setValues( FORM_SETUP, { submitMode, submitInProgress: true } );

			try {
				await throwOnError( () => submitChanges() );
				// If submitChanges was successful, disable autoSubmit (in case it was restored).
				setValues( FORM_SETUP, { autoSubmit: false } );

				// If submitting with Analytics setup, and Analytics is not active,
				// activate it, and navigate to its reauth/setup URL to proceed with its setup.
				if (
					submitMode === SETUP_MODE_WITH_ANALYTICS &&
					! analyticsModuleActive
				) {
					const { response, error } = await activateModule(
						MODULE_SLUG_ANALYTICS_4
					);
					if ( error ) {
						throw error;
					}

					await setItem( 'module_setup', MODULE_SLUG_ANALYTICS_4, {
						ttl: 300,
					} );

					// Reauth/setup URL needs to come from async activateModule action to be fresh.
					finishSetup( response.moduleReauthURL );
				} else {
					// If we got here, call finishSetup to navigate to the success screen.
					finishSetup();
				}
			} catch ( err ) {
				if ( isPermissionScopeError( err ) ) {
					setValues( FORM_SETUP, { autoSubmit: true } );
				}
			}
			// Mark the submit as no longer in progress in all cases.
			setValues( FORM_SETUP, { submitInProgress: false } );
		},
		[
			finishSetup,
			analyticsModuleActive,
			activateModule,
			submitChanges,
			setValues,
		]
	);

	// If the user lands back on this component with autoSubmit and the edit scope,
	// resubmit the form.
	useEffect( () => {
		if ( initialAutoSubmit && hasEditScope ) {
			submitForm( { submitMode: initialSubmitMode } );
		}
	}, [ hasEditScope, initialAutoSubmit, submitForm, initialSubmitMode ] );

	const isSetupWithAnalytics = !! (
		currentGTMGoogleTagID &&
		analyticsModuleAvailable &&
		! analyticsModuleActive
	);

	// Form submit behavior now varies based on which button is clicked.
	// Only the main buttons will trigger the form submit so here we only handle the default action.
	const onSubmit = useCallback(
		( event ) => {
			event.preventDefault();
			const submitMode = isSetupWithAnalytics
				? SETUP_MODE_WITH_ANALYTICS
				: '';
			submitForm( { submitMode } );
		},
		[ submitForm, isSetupWithAnalytics ]
	);
	// Click handler for secondary option when setting up with option to include Analytics.
	const onSetupWithoutAnalytics = useCallback(
		() => submitForm(),
		[ submitForm ]
	);

	return (
		<form
			className="googlesitekit-tagmanager-setup__form"
			onSubmit={ onSubmit }
		>
			<SetupErrorNotice />
			<FormInstructions isSetup />

			<div className="googlesitekit-setup-module__inputs">
				<AccountSelect />

				<WebContainerSelect />

				<AMPContainerSelect />

				<TagCheckProgress />
			</div>

			<ContainerNames />

			{ hasExistingTag && <SetupUseSnippetSwitch /> }

			<div className="googlesitekit-setup-module__action">
				{ isSetupWithAnalytics && (
					<Fragment>
						<SpinnerButton
							disabled={ ! canSubmitChanges }
							isSaving={ isSavingWithAnalytics && isSaving }
							// Show the spinner only when saving GA4 and GTM together.
							onClick={ () => setIsSavingWithAnalytics( true ) }
						>
							{ __(
								'Continue to Analytics setup',
								'google-site-kit'
							) }
						</SpinnerButton>
						{ /*
						This <button> below should not trigger a form submit
						when clicked, hence the `type="button"`.
						*/ }
						<Button
							className="googlesitekit-setup-module__sub-action"
							type="button"
							onClick={ onSetupWithoutAnalytics }
							disabled={ ! canSubmitChanges }
							tertiary
						>
							{ __(
								'Complete setup without Analytics',
								'google-site-kit'
							) }
						</Button>
					</Fragment>
				) }
				{ ! isSetupWithAnalytics && (
					<SpinnerButton
						disabled={ ! canSubmitChanges || isSaving }
						isSaving={ isSaving }
					>
						{ __( 'Complete setup', 'google-site-kit' ) }
					</SpinnerButton>
				) }
			</div>
		</form>
	);
}

SetupForm.propTypes = {
	finishSetup: PropTypes.func,
};
