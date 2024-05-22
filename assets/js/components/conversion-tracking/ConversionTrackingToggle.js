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
import {
	createInterpolateElement,
	useState,
	Fragment,
} from '@wordpress/element';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import { Switch } from 'googlesitekit-components';
import Data from 'googlesitekit-data';
import { CORE_SITE } from '../../googlesitekit/datastore/site/constants';
import ErrorText from '../../components/ErrorText';
import Link from '../Link';
import LoadingWrapper from '../LoadingWrapper';
import ConfirmDisableConversionTrackingDialog from './ConfirmDisableConversionTrackingDialog';
import { useFeature } from '../../hooks/useFeature';
import PropTypes from 'prop-types';

const { useDispatch, useSelect } = Data;

export default function ConversionTrackingToggle( { loading } ) {
	const iceEnabled = useFeature( 'conversionInfra' );
	const [ saveError ] = useState( null );
	const [ showConfirmDialog, setShowConfirmDialog ] = useState( false );

	const isConversionTrackingEnabled = useSelect( ( select ) =>
		select( CORE_SITE ).isConversionTrackingEnabled()
	);

	const conversionTrackingDocumentationURL = useSelect( ( select ) =>
		select( CORE_SITE ).getDocumentationLinkURL(
			'enhanced-conversion-tracking'
		)
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
							setShowConfirmDialog( true );
						} else {
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
					{ createInterpolateElement(
						__(
							'Conversion tracking allows you to measure additional events on your site from other plugins that Site Kit integrates with to optimize your campaign performance. <a>Learn more</a>',
							'google-site-kit'
						),
						{
							a: (
								<Link
									href={ conversionTrackingDocumentationURL }
									external
									aria-label={ __(
										'Learn more about conversion tracking',
										'google-site-kit'
									) }
								/>
							),
						}
					) }
				</p>
			</LoadingWrapper>
			{ showConfirmDialog && (
				<ConfirmDisableConversionTrackingDialog
					onConfirm={ () => {
						setConversionTrackingEnabled( false );
						setShowConfirmDialog( false );
					} }
					onCancel={ () => {
						setShowConfirmDialog( false );
					} }
				/>
			) }
		</Fragment>
	);
}

ConversionTrackingToggle.propTypes = {
	loading: PropTypes.bool,
};
