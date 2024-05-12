/**
 * Selection Panel Footer component.
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
import { isEqual } from 'lodash';
import PropTypes from 'prop-types';

/**
 * WordPress dependencies
 */
import {
	createInterpolateElement,
	useCallback,
	useEffect,
	useMemo,
	useState,
} from '@wordpress/element';
import { __, sprintf } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import { Button, SpinnerButton } from 'googlesitekit-components';
import ErrorNotice from '../ErrorNotice';
import { safelySort } from '../../util';

export default function SelectionPanelFooter( {
	savedItemSlugs = [],
	selectedItemSlugs = [],
	saveSettings,
	saveError,
	itemLimitError,
	minSelectedItemCount,
	maxSelectedItemCount,
	isBusy,
	onSaveSuccess,
	onCancel,
	isOpen,
	closeFn,
} ) {
	const [ finalButtonText, setFinalButtonText ] = useState( null );
	const [ wasSaved, setWasSaved ] = useState( false );

	const haveSettingsChanged = useMemo( () => {
		// Arrays need to be sorted to match in `isEqual`.
		return ! isEqual(
			safelySort( selectedItemSlugs ),
			safelySort( savedItemSlugs )
		);
	}, [ savedItemSlugs, selectedItemSlugs ] );

	const currentButtonText =
		savedItemSlugs?.length > 0 && haveSettingsChanged
			? __( 'Apply changes', 'google-site-kit' )
			: __( 'Save selection', 'google-site-kit' );

	const onSaveClick = useCallback( async () => {
		const { error } = await saveSettings( selectedItemSlugs );

		if ( ! error ) {
			onSaveSuccess();

			// Close the panel after saving.
			closeFn();

			// Lock the button label while panel is closing.
			setFinalButtonText( currentButtonText );
			setWasSaved( true );
		}
	}, [
		saveSettings,
		selectedItemSlugs,
		onSaveSuccess,
		closeFn,
		currentButtonText,
	] );

	const onCancelClick = useCallback( () => {
		closeFn();
		onCancel();
	}, [ closeFn, onCancel ] );

	const [ prevIsOpen, setPrevIsOpen ] = useState( null );

	useEffect( () => {
		if ( prevIsOpen !== null ) {
			// If current isOpen is true, and different from prevIsOpen
			// meaning it transitioned from false to true and it is not
			// in closing transition, we should reset the button label
			// locked when save button was clicked.
			if ( prevIsOpen !== isOpen ) {
				if ( isOpen ) {
					setFinalButtonText( null );
					setWasSaved( false );
				}
			}
		}

		setPrevIsOpen( isOpen );
	}, [ isOpen, prevIsOpen ] );

	const selectedItemCount = selectedItemSlugs?.length || 0;

	return (
		<footer className="googlesitekit-selection-panel-footer">
			{ saveError && <ErrorNotice error={ saveError } /> }
			<div className="googlesitekit-selection-panel-footer__content">
				{ haveSettingsChanged && itemLimitError ? (
					<ErrorNotice
						error={ {
							message: itemLimitError,
						} }
						noPrefix={
							selectedItemCount < minSelectedItemCount ||
							selectedItemCount > maxSelectedItemCount
						}
					/>
				) : (
					<p className="googlesitekit-selection-panel-footer__item-count">
						{ createInterpolateElement(
							sprintf(
								/* translators: 1: Number of selected metrics. 2: Maximum number of metrics that can be selected. */
								__(
									'%1$d selected <MaxCount>(up to %2$d)</MaxCount>',
									'google-site-kit'
								),
								selectedItemCount,
								maxSelectedItemCount
							),
							{
								MaxCount: (
									<span className="googlesitekit-selection-panel-footer__item-count--max-count" />
								),
							}
						) }
					</p>
				) }
				<div className="googlesitekit-selection-panel-footer__actions">
					<Button
						tertiary
						onClick={ onCancelClick }
						disabled={ isBusy }
					>
						{ __( 'Cancel', 'google-site-kit' ) }
					</Button>
					<SpinnerButton
						onClick={ onSaveClick }
						isSaving={ isBusy }
						disabled={
							selectedItemCount < minSelectedItemCount ||
							selectedItemCount > maxSelectedItemCount ||
							isBusy ||
							( ! isOpen && wasSaved )
						}
					>
						{ finalButtonText || currentButtonText }
					</SpinnerButton>
				</div>
			</div>
		</footer>
	);
}

SelectionPanelFooter.propTypes = {
	savedItemSlugs: PropTypes.array,
	selectedItemSlugs: PropTypes.array,
	saveSettings: PropTypes.func,
	saveError: PropTypes.object,
	itemLimitError: PropTypes.string,
	minSelectedItemCount: PropTypes.number,
	maxSelectedItemCount: PropTypes.number,
	isBusy: PropTypes.bool,
	onSaveSuccess: PropTypes.func,
	onCancel: PropTypes.func,
	isOpen: PropTypes.bool,
	closeFn: PropTypes.func,
};
