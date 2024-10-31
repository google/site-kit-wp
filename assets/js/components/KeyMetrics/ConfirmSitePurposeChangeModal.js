/**
 * ConfirmSitePurposeChangeModal component.
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
import { useCallback, useState } from '@wordpress/element';

/**
 * Internal dependencies
 */
import {
	Button,
	Dialog,
	DialogContent,
	DialogFooter,
	DialogTitle,
	SpinnerButton,
} from 'googlesitekit-components';
import { useSelect, useDispatch } from 'googlesitekit-data';
import {
	CORE_USER,
	FORM_USER_INPUT_PREVIOUS_PURPOSE,
} from '../../googlesitekit/datastore/user/constants';
import { CORE_FORMS } from '../../googlesitekit/datastore/forms/constants';
import { KEY_METRICS_WIDGETS } from './key-metrics-widgets';

function ConfirmSitePurposeChangeModal( {
	dialogActive = false,
	handleDialog = null,
} ) {
	const [ isSaving, setIsSaving ] = useState( false );

	const { setValues } = useDispatch( CORE_FORMS );

	const previousPurpose = useSelect( ( select ) =>
		select( CORE_FORMS ).getValue(
			FORM_USER_INPUT_PREVIOUS_PURPOSE,
			'purpose'
		)
	);

	const currentMetrics = useSelect( ( select ) => {
		if ( undefined === previousPurpose ) {
			return select( CORE_USER ).getKeyMetrics();
		}

		return select( CORE_USER ).getAnswerBasedMetrics( previousPurpose );
	} );

	const userInputSettings = useSelect( ( select ) => {
		return select( CORE_USER ).getUserInputSettings();
	} );

	const purpose = userInputSettings?.purpose?.values?.[ 0 ];

	const newMetrics = useSelect( ( select ) => {
		return select( CORE_USER ).getAnswerBasedMetrics( purpose );
	} );

	const { saveUserInputSettings } = useDispatch( CORE_USER );

	const saveChanges = useCallback( async () => {
		setIsSaving( true );
		await saveUserInputSettings();
		setIsSaving( false );
		handleDialog();
		setValues( FORM_USER_INPUT_PREVIOUS_PURPOSE, {
			purpose: undefined,
		} );
	}, [ saveUserInputSettings, handleDialog, setIsSaving, setValues ] );

	return (
		<Dialog
			open={ dialogActive }
			aria-describedby={ undefined }
			tabIndex="-1"
			className="googlesitekit-dialog-confirm-site-purpose-change"
		>
			<DialogTitle>
				{ __( 'Tailored metrics suggestions', 'google-site-kit' ) }
			</DialogTitle>
			<p>
				{ __(
					'You have changed your website purpose. We can suggest new tailored metrics for you based on your answers or you can keep your current metrics selection on your dashboard.',
					'google-site-kit'
				) }
				<br />
				{ __(
					'You can always edit your metrics selection from the dashboard.',
					'google-site-kit'
				) }
			</p>
			<DialogContent>
				<div className="mdc-layout-grid__inner">
					<div className="mdc-layout-grid__cell mdc-layout-grid__cell--span-6-desktop mdc-layout-grid__cell--span-4-tablet mdc-layout-grid__cell--span-4-phone">
						<h3>{ __( 'Current metrics', 'google-site-kit' ) }</h3>
						{ !! currentMetrics && (
							<ul className="mdc-list mdc-list--underlined mdc-list--non-interactive">
								{ currentMetrics.map( ( item ) => (
									<li key={ item } className="mdc-list-item">
										<span className="mdc-list-item__text">
											{
												KEY_METRICS_WIDGETS[ item ]
													?.title
											}
										</span>
									</li>
								) ) }
							</ul>
						) }
					</div>
					<div className="mdc-layout-grid__cell mdc-layout-grid__cell--span-6-desktop mdc-layout-grid__cell--span-4-tablet mdc-layout-grid__cell--span-4-phone">
						<h3>
							{ __( 'New tailored metrics', 'google-site-kit' ) }
						</h3>
						{ !! newMetrics && (
							<ul className="mdc-list mdc-list--underlined mdc-list--non-interactive">
								{ newMetrics.map( ( item ) => (
									<li key={ item } className="mdc-list-item">
										<span className="mdc-list-item__text">
											{
												KEY_METRICS_WIDGETS[ item ]
													?.title
											}
										</span>
									</li>
								) ) }
							</ul>
						) }
					</div>
				</div>
			</DialogContent>
			<DialogFooter>
				<Button
					className="mdc-dialog__cancel-button"
					tertiary
					onClick={ handleDialog }
				>
					{ __( 'Keep current selection', 'google-site-kit' ) }
				</Button>
				<SpinnerButton isSaving={ isSaving } onClick={ saveChanges }>
					{ __( 'Update metrics selection', 'google-site-kit' ) }
				</SpinnerButton>
			</DialogFooter>
		</Dialog>
	);
}

ConfirmSitePurposeChangeModal.displayName = 'Dialog';

ConfirmSitePurposeChangeModal.propTypes = {
	dialogActive: PropTypes.bool,
	handleDialog: PropTypes.func,
};

export default ConfirmSitePurposeChangeModal;
