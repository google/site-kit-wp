/**
 * Analytics Setup form.
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
import {
	createInterpolateElement,
	useCallback,
	useEffect,
} from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { addQueryArgs, getQueryArg } from '@wordpress/url';

/**
 * Internal dependencies
 */
import { useSelect, useDispatch } from 'googlesitekit-data';
import { SpinnerButton } from 'googlesitekit-components';
import {
	FORM_SETUP,
	EDIT_SCOPE,
	ENHANCED_MEASUREMENT_ENABLED,
	ENHANCED_MEASUREMENT_FORM,
	MODULES_ANALYTICS_4,
} from '@/js/modules/analytics-4/datastore/constants';
import { CORE_USER } from '@/js/googlesitekit/datastore/user/constants';
import { CORE_FORMS } from '@/js/googlesitekit/datastore/forms/constants';
import { CORE_LOCATION } from '@/js/googlesitekit/datastore/location/constants';
import { isPermissionScopeError } from '@/js/util/errors';
import SetupFormFields from './SetupFormFields';
import StoreErrorNotices from '@/js/components/StoreErrorNotices';

import useViewContext from '@/js/hooks/useViewContext';
import { trackEvent } from '@/js/util';
import { CORE_SITE } from '@/js/googlesitekit/datastore/site/constants';
import SetupEnhancedConversionTrackingNotice from '@/js/components/conversion-tracking/SetupEnhancedConversionTrackingNotice';
import useFormValue from '@/js/hooks/useFormValue';
import { useFeature } from '@/js/hooks/useFeature';
import Link from '@/js/components/Link';
import Null from '@/js/components/Null';

export default function SetupForm( { finishSetup } ) {
	const hasEditScope = useSelect( ( select ) =>
		select( CORE_USER ).hasScope( EDIT_SCOPE )
	);
	const autoSubmit = useFormValue( FORM_SETUP, 'autoSubmit' );
	const canSubmitChanges = useSelect( ( select ) =>
		select( MODULES_ANALYTICS_4 ).canSubmitChanges()
	);
	const isSaving = useSelect(
		( select ) =>
			select( MODULES_ANALYTICS_4 ).isDoingSubmitChanges() ||
			select( CORE_LOCATION ).isNavigating()
	);
	const viewContext = useViewContext();
	const setupFlowRefreshEnabled = useFeature( 'setupFlowRefresh' );

	const showProgress = getQueryArg( location.href, 'showProgress' );

	const keyMetricsSetupURL = useSelect( ( select ) => {
		if ( ! setupFlowRefreshEnabled ) {
			return undefined;
		}

		const url = select( CORE_SITE ).getAdminURL(
			'googlesitekit-key-metrics-setup'
		);

		return showProgress
			? addQueryArgs( url, {
					showProgress: 'true',
			  } )
			: url;
	} );

	const enhancedConversionsDocumentationURL = useSelect( ( select ) => {
		return select( CORE_SITE ).getDocumentationLinkURL(
			'plugin-conversion-tracking'
		);
	} );

	const { setValues } = useDispatch( CORE_FORMS );
	const { submitChanges } = useDispatch( MODULES_ANALYTICS_4 );
	const { setConversionTrackingEnabled, saveConversionTrackingSettings } =
		useDispatch( CORE_SITE );

	const isEnhancedMeasurementEnabled = useFormValue(
		ENHANCED_MEASUREMENT_FORM,
		ENHANCED_MEASUREMENT_ENABLED
	);

	const submitForm = useCallback(
		async ( event ) => {
			event.preventDefault();
			// Disable autoSubmit unconditionally to prevent
			// automatic invocation more than once.
			setValues( FORM_SETUP, { autoSubmit: false } );

			const { error } = await submitChanges();

			if ( isPermissionScopeError( error ) ) {
				setValues( FORM_SETUP, { autoSubmit: true } );
			}

			if ( ! error ) {
				setConversionTrackingEnabled( true );
				await saveConversionTrackingSettings();

				if ( isEnhancedMeasurementEnabled === true ) {
					await trackEvent(
						`${ viewContext }_analytics`,
						'ga4_setup_enhanced_measurement_enabled'
					);
				}
				finishSetup( keyMetricsSetupURL );
			}
		},
		[
			finishSetup,
			keyMetricsSetupURL,
			isEnhancedMeasurementEnabled,
			setConversionTrackingEnabled,
			saveConversionTrackingSettings,
			setValues,
			submitChanges,
			viewContext,
		]
	);

	// If the user lands back on this component with autoSubmit and the edit scope,
	// resubmit the form.
	useEffect( () => {
		if ( autoSubmit && hasEditScope ) {
			submitForm( { preventDefault: () => {} } );
		}
	}, [ hasEditScope, autoSubmit, submitForm ] );

	return (
		<form
			className="googlesitekit-analytics-setup__form"
			onSubmit={ submitForm }
		>
			<StoreErrorNotices
				moduleSlug="analytics-4"
				storeName={ MODULES_ANALYTICS_4 }
			/>
			<SetupFormFields />

			<SetupEnhancedConversionTrackingNotice
				message={ createInterpolateElement(
					__(
						'To track how visitors interact with your site, Site Kit will enable plugin conversion tracking. You can always disable it in settings. <LearnMoreLink />',
						'google-site-kit'
					),
					{
						LearnMoreLink: setupFlowRefreshEnabled ? (
							<Link
								href={ enhancedConversionsDocumentationURL }
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

			<div className="googlesitekit-setup-module__action">
				<SpinnerButton
					disabled={ ! canSubmitChanges || isSaving }
					isSaving={ isSaving }
				>
					{ setupFlowRefreshEnabled
						? __( 'Set up', 'google-site-kit' )
						: __( 'Complete setup', 'google-site-kit' ) }
				</SpinnerButton>
			</div>
		</form>
	);
}

SetupForm.propTypes = {
	finishSetup: PropTypes.func,
};

SetupForm.defaultProps = {
	finishSetup: () => {},
};
