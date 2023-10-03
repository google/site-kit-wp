/**
 * EnhancedMeasurementActivationBanner > SetupBanner component.
 *
 * Site Kit by Google, Copyright 2023 Google LLC
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
import { useState, useCallback, useEffect } from '@wordpress/element';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import Data from 'googlesitekit-data';
import { CORE_FORMS } from '../../../../../googlesitekit/datastore/forms/constants';
import { CORE_SITE } from '../../../../../googlesitekit/datastore/site/constants';
import { CORE_USER } from '../../../../../googlesitekit/datastore/user/constants';
import {
	EDIT_SCOPE,
	FORM_SETUP,
} from '../../../../analytics/datastore/constants';
import {
	ENHANCED_MEASUREMENT_ENABLED,
	ENHANCED_MEASUREMENT_FORM,
	MODULES_ANALYTICS_4,
} from '../../../datastore/constants';
import { ERROR_CODE_MISSING_REQUIRED_SCOPE } from '../../../../../util/errors';
import { SpinnerButton } from 'googlesitekit-components';
import BannerNotification from '../../../../../components/notifications/BannerNotification';
import SuccessGreenSVG from '../../../../../../svg/graphics/ga4-success-green.svg';
import ErrorNotice from '../../../../../components/ErrorNotice';

const { useDispatch, useSelect } = Data;

export default function SetupBanner( {
	onSubmitSuccess,
	onDismiss,
	children,
} ) {
	const [ errorNotice, setErrorNotice ] = useState( null );
	const [ isSaving, setIsSaving ] = useState( false );

	const hasEditScope = useSelect( ( select ) =>
		select( CORE_USER ).hasScope( EDIT_SCOPE )
	);

	const autoSubmit = useSelect( ( select ) =>
		select( CORE_FORMS ).getValue( FORM_SETUP, 'autoSubmit' )
	);

	const documentationURL = useSelect( ( select ) =>
		select( CORE_SITE ).getGoogleSupportURL( {
			path: '/analytics/answer/9216061',
		} )
	);

	const { submitChanges } = useDispatch( MODULES_ANALYTICS_4 );

	const { setPermissionScopeError } = useDispatch( CORE_USER );
	const { setValues } = useDispatch( CORE_FORMS );

	const commonSubmitChanges = useCallback( async () => {
		setIsSaving( true );

		setValues( ENHANCED_MEASUREMENT_FORM, {
			[ ENHANCED_MEASUREMENT_ENABLED ]: true,
		} );

		const { error } = await submitChanges();

		setIsSaving( false );

		if ( error ) {
			setErrorNotice( error );
			return;
		}

		// Ask the parent component to show the success banner.
		// This should be called last because it will unmount this component.
		onSubmitSuccess();
	}, [ setValues, submitChanges, onSubmitSuccess ] );

	const handleSubmitChanges = async () => {
		const scopes = [];

		if ( hasEditScope === false ) {
			scopes.push( EDIT_SCOPE );
		}

		// If scope not granted, trigger scope error right away. These are
		// typically handled automatically based on API responses, but
		// this particular case has some special handling to improve UX.
		if ( scopes.length > 0 ) {
			setValues( FORM_SETUP, { autoSubmit: true } );

			setPermissionScopeError( {
				code: ERROR_CODE_MISSING_REQUIRED_SCOPE,
				message: __(
					'Additional permissions are required to enable enhanced measurement for the selected web data stream.',
					'google-site-kit'
				),
				data: {
					status: 403,
					scopes,
					skipModal: true,
					redirectURL: global.location.href,
				},
			} );
			return;
		}

		await commonSubmitChanges();
	};

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
		hasEditScope,
		setValues,
		commonSubmitChanges,
		onSubmitSuccess,
		autoSubmit,
	] );

	const description = hasEditScope
		? __(
				'Enable enhanced measurement in Analytics to automatically track metrics like file downloads, video plays, form interactions, etc. No extra code required.',
				'google-site-kit'
		  )
		: __(
				'Enable enhanced measurement in Analytics to automatically track metrics like file downloads, video plays, form interactions, etc. No extra code required — you’ll be redirected to give permission for Site Kit to enable it on your behalf.',
				'google-site-kit'
		  );

	return (
		<BannerNotification
			id="googlesitekit-enhanced-measurement-activation-banner"
			className="googlesitekit-enhanced-measurement-setup-banner"
			title={ __(
				'Understand how visitors interact with your content',
				'google-site-kit'
			) }
			description={ description }
			learnMoreLabel={ __( 'Learn more', 'google-site-kit' ) }
			learnMoreURL={ documentationURL }
			ctaComponent={
				<SpinnerButton
					onClick={ handleSubmitChanges }
					isSaving={ isSaving }
				>
					{ __( 'Enable now', 'google-site-kit' ) }
				</SpinnerButton>
			}
			footer={
				<p className="googlesitekit-enhanced-measurement-setup-banner__footer-notice">
					{ __(
						'You can always add/edit this in the Site Kit Settings',
						'google-site-kit'
					) }
				</p>
			}
			dismiss={ __( 'Maybe later', 'google-site-kit' ) }
			WinImageSVG={ () => <SuccessGreenSVG /> }
			format="small"
			dismissExpires={ 1 } // Set dismissExpires to one second to enable "immediate" BannerNotification dismissal expiry, as the overall banner's dismissal is handled separately via dismissItem() / isItemDismissed().
			onDismiss={ onDismiss }
		>
			{ errorNotice && <ErrorNotice error={ errorNotice } /> }
			{ children }
		</BannerNotification>
	);
}

SetupBanner.propTypes = {
	onSubmitSuccess: PropTypes.func,
	onDismiss: PropTypes.func,
	children: PropTypes.node,
};
