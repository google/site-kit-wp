/**
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
 * WordPress dependencies
 */
import { useState, Fragment } from '@wordpress/element';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import { Switch } from 'googlesitekit-components';
import { useDispatch, useSelect } from 'googlesitekit-data';
import { CORE_SITE } from '../../googlesitekit/datastore/site/constants';
import ErrorText from '../../components/ErrorText';
import LoadingWrapper from '../LoadingWrapper';
import ConfirmDisableConversionTrackingDialog from './ConfirmDisableConversionTrackingDialog';
import { useFeature } from '../../hooks/useFeature';
import useViewContext from '../../hooks/useViewContext';
import { trackEvent } from '../../util';
import PropTypes from 'prop-types';

export default function ConversionTrackingToggle( { children, loading } ) {
	const viewContext = useViewContext();
	const iceEnabled = useFeature( 'conversionInfra' );
	const [ saveError ] = useState( null );
	const [ showConfirmDialog, setShowConfirmDialog ] = useState( false );

	const isConversionTrackingEnabled = useSelect( ( select ) =>
		select( CORE_SITE ).isConversionTrackingEnabled()
	);

	const isSaving = useSelect( ( select ) =>
		select( CORE_SITE ).isFetchingSaveConversionTrackingSettings()
	);

	const { setConversionTrackingEnabled } = useDispatch( CORE_SITE );

	if ( ! iceEnabled ) {
		return null;
	}

	return (
		<Fragment>
			<LoadingWrapper loading={ loading } width="180px" height="21.3px">
				<Switch
					label={ __(
						'Enable enhanced conversion tracking',
						'google-site-kit'
					) }
					checked={ isConversionTrackingEnabled }
					disabled={ isSaving || loading }
					onClick={ () => {
						// If Conversion Tracking is currently enabled, show a confirmation
						// dialog warning users about the impact of disabling it.
						if ( isConversionTrackingEnabled ) {
							trackEvent( `${ viewContext }`, 'ect_disable' );

							setShowConfirmDialog( true );
						} else {
							trackEvent( `${ viewContext }`, 'ect_enable' );

							// Conversion Tracking is not currently enabled, so this toggle
							// enables it.
							setConversionTrackingEnabled( true );
						}
					} }
					hideLabel={ false }
				/>
			</LoadingWrapper>
			{ !! saveError && <ErrorText message={ saveError.message } /> }
			<LoadingWrapper
				className="googlesitekit-settings-conversion-tracking-switch-description--loading"
				loading={ loading }
				width="750px"
				height="42px"
				smallWidth="386px"
				smallHeight="84px"
				tabletWidth="540px"
				tabletHeight="84px"
			>
				<p className="googlesitekit-settings-module__fields-group-helper-text">
					{ children }
				</p>
			</LoadingWrapper>
			{ showConfirmDialog && (
				<ConfirmDisableConversionTrackingDialog
					onConfirm={ () => {
						trackEvent( `${ viewContext }`, 'ect_confirm_disable' );

						setConversionTrackingEnabled( false );
						setShowConfirmDialog( false );
					} }
					onCancel={ () => {
						trackEvent( `${ viewContext }`, 'ect_cancel_disable' );

						setShowConfirmDialog( false );
					} }
				/>
			) }
		</Fragment>
	);
}

ConversionTrackingToggle.propTypes = {
	children: PropTypes.node.isRequired,
	loading: PropTypes.bool,
};
