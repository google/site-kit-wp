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
import { DAY_IN_SECONDS, trackEvent } from '../../util';
import useViewContext from '../../hooks/useViewContext';

const { useDispatch, useSelect } = Data;

export default function ConversionTrackingToggle( { loading } ) {
	const viewContext = useViewContext();

	const [ saveError, setSaveError ] = useState( null );
	const [ showConfirmDialog, setShowConfirmDialog ] = useState( false );

	const isConversionTrackingEnabled = useSelect( ( select ) =>
		select( CORE_SITE ).isConversionTrackingEnabled()
	);

	const isSaving = useSelect( ( select ) =>
		select( CORE_SITE ).isFetchingSaveConversionTrackingSettings()
	);

	const { setConversionTrackingEnabled, saveConversionTrackingSettings } =
		useDispatch( CORE_SITE );

	const usingProxy = useSelect( ( select ) =>
		select( CORE_SITE ).isUsingProxy()
	);
	const { triggerSurvey } = useDispatch( CORE_USER );

	return (
		<Fragment>
			<div>
				{
					<LoadingWrapper
						loading={ loading }
						width="180px"
						height="21.3px"
					>
						<Switch
							label={ __(
								'Enable consent mode',
								'google-site-kit'
							) }
							checked={ isConversionTrackingEnabled }
							disabled={ loading || isSaving }
							onClick={ () => {
								// If Consent Mode is currently enabled, show a confirmation
								// dialog warning users about the impact of disabling it.
								if ( isConversionTrackingEnabled ) {
									trackEvent(
										`${ viewContext }_CoTr`,
										'cotr_disable'
									);

									setShowConfirmDialog( true );
								} else {
									trackEvent(
										`${ viewContext }_CoTr`,
										'cotr_enable'
									);

									// Consent Mode is not currently enabled, so this toggle
									// enables it.
									setConversionTrackingEnabled( true );
									saveSettings();
								}
							} }
							hideLabel={ false }
						/>
					</LoadingWrapper>
				}
				{ saveError && <ErrorText message={ saveError.message } /> }
				{ ! loading && isConversionTrackingEnabled && (
					<p className="googlesitekit-settings-conversion-tracking-switch__enabled-notice">
						{ __(
							'Conversion tracking enabled.',
							'google-site-kit'
						) }
					</p>
				) }
				{
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
						<p>
							{ createInterpolateElement(
								__(
									'Conversion tracking will... <br />Some more info... <a>Learn more</a>',
									'google-site-kit'
								),
								{
									br: <br />,
									a: (
										<Link
											href="#"
											external
											aria-label={ __(
												'Learn more about conversion tracking',
												'google-site-kit'
											) }
											onClick={ async () => {
												await trackEvent(
													`${ viewContext }_CoTr`,
													'cotr_learn_more'
												);
											} }
										/>
									),
								}
							) }
						</p>
					</LoadingWrapper>
				}
			</div>
			{ showConfirmDialog && (
				<ConfirmDisableConversionTrackingDialog
					onConfirm={ () => {
						trackEvent(
							`${ viewContext }_CoTr`,
							'confirm_disconnect'
						);

						setConversionTrackingEnabled( false );
						setShowConfirmDialog( false );
						saveSettings();
					} }
					onCancel={ () => {
						trackEvent(
							`${ viewContext }_CoTr`,
							'cancel_disconnect'
						);

						setShowConfirmDialog( false );
					} }
				/>
			) }
		</Fragment>
	);
}
