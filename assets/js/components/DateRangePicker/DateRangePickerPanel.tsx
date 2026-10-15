/**
 * DateRangePickerPanel component.
 *
 * Site Kit by Google, Copyright 2026 Google LLC
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
import FocusTrap from 'focus-trap-react';
import {
	CSSProperties,
	FC,
	RefObject,
	useEffect,
	useLayoutEffect,
	useRef,
	useState,
} from 'react';
import { useClickAway } from 'react-use';

/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { ESCAPE } from '@wordpress/keycodes';

/**
 * Internal dependencies
 */
import Portal from '@/js/components/Portal';
import { Button } from '@/js/googlesitekit-components';
import { useKeyCodesInside } from '@/js/hooks/useKeyCodesInside';
import { DATE_RANGE_PICKER_PANEL_ID } from './constants';

interface DateRangePickerPanelProps {
	anchorTop: number;
	anchorLeft: number;
	isApplyDisabled?: boolean;
	triggerWrapperRef: RefObject< Element | null >;
	onApply: () => void;
	onClose: () => void;
}

const DateRangePickerPanel: FC< DateRangePickerPanelProps > = ( {
	anchorTop,
	anchorLeft,
	isApplyDisabled = false,
	triggerWrapperRef,
	onApply,
	onClose,
} ) => {
	const panelRef = useRef< HTMLDivElement >( null );

	// The portal attaches its element to the document after its children mount,
	// and the focus trap needs the panel to be in the document to activate.
	const [ isMounted, setIsMounted ] = useState( false );
	useEffect( () => setIsMounted( true ), [] );

	// The anchor is in viewport coordinates, but the panel is absolutely
	// positioned within its nearest positioned ancestor (the WordPress admin
	// content area), so offset it by that ancestor's origin.
	const [ position, setPosition ] = useState( {
		top: anchorTop,
		left: anchorLeft,
	} );
	useLayoutEffect( () => {
		// Wait for the portal to attach the panel to the document, otherwise
		// it has no positioned ancestor to measure.
		if ( ! isMounted ) {
			return;
		}

		const { offsetParent } = panelRef.current || {};
		const origin = (
			offsetParent && offsetParent !== document.body
				? offsetParent
				: document.documentElement
		 ).getBoundingClientRect();

		setPosition( {
			top: anchorTop - origin.top,
			left: anchorLeft - origin.left,
		} );
	}, [ isMounted, anchorTop, anchorLeft ] );

	useClickAway( panelRef, ( event ) => {
		// Pressing the trigger toggles the panel, so leave that to its own handler.
		if ( triggerWrapperRef.current?.contains( event.target as Node ) ) {
			return;
		}

		onClose();
	} );

	useKeyCodesInside( [ ESCAPE ], panelRef, onClose );

	return (
		<Portal>
			<FocusTrap
				active={ isMounted }
				focusTrapOptions={ {
					allowOutsideClick: () => true,
					fallbackFocus: () => panelRef.current || document.body,
				} }
			>
				<div
					ref={ panelRef }
					id={ DATE_RANGE_PICKER_PANEL_ID }
					className="googlesitekit-date-range-picker__panel"
					role="dialog"
					aria-modal="true"
					aria-label={ __( 'Select date range', 'google-site-kit' ) }
					tabIndex={ -1 }
					style={
						{
							'--googlesitekit-date-picker-panel-top': `${ position.top }px`,
							'--googlesitekit-date-picker-panel-left': `${ position.left }px`,
							visibility: isMounted ? 'visible' : 'hidden',
						} as CSSProperties
					}
				>
					<div className="googlesitekit-date-range-picker__rail" />
					<div className="googlesitekit-date-range-picker__calendar-pane">
						<div className="googlesitekit-date-range-picker__calendar" />
						<div className="googlesitekit-date-range-picker__footer">
							{ /* @ts-expect-error - The `Button` component is not typed yet. */ }
							<Button onClick={ onClose } tertiary>
								{ __( 'Cancel', 'google-site-kit' ) }
							</Button>
							{ /* @ts-expect-error - The `Button` component is not typed yet. */ }
							<Button
								onClick={ onApply }
								disabled={ isApplyDisabled }
							>
								{ __( 'Apply', 'google-site-kit' ) }
							</Button>
						</div>
					</div>
				</div>
			</FocusTrap>
		</Portal>
	);
};

export default DateRangePickerPanel;
