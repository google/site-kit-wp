/**
 * External dependencies
 */
import { isEqual } from 'lodash';

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
	savedItemSlugs,
	selectedItemSlugs,
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
		<footer className="googlesitekit-km-selection-panel-footer">
			{ saveError && <ErrorNotice error={ saveError } /> }
			<div className="googlesitekit-km-selection-panel-footer__content">
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
					<p className="googlesitekit-km-selection-panel-footer__metric-count">
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
									<span className="googlesitekit-km-selection-panel-footer__metric-count--max-count" />
								),
							}
						) }
					</p>
				) }
				<div className="googlesitekit-km-selection-panel-footer__actions">
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
