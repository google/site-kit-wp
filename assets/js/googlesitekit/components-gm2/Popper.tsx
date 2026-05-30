/**
 * Popper component.
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
import { Popper as MuiPopper } from '@material-ui/core';
import classnames from 'classnames';
import { FC } from 'react';
import { useKey } from 'react-use';

/**
 * WordPress dependencies
 */
import { useCallback, useEffect, useRef } from '@wordpress/element';

export type PopperPlacement =
	| 'top'
	| 'top-start'
	| 'top-end'
	| 'bottom'
	| 'bottom-start'
	| 'bottom-end';

const DEFAULT_AUTO_DISMISS_MS = 4000;
const DEFAULT_OFFSET = 9;
const POPPER_STYLE = { zIndex: 99999 };

interface PopperProps {
	// eslint-disable-next-line sitekit/acronym-case
	anchorEl: HTMLElement | null;
	onClose: () => void;
	placement?: PopperPlacement;
	autoDismissMs?: number;
	offset?: number;
	resetKey?: number | string;
	className?: string;
}

/**
 * Renders a floating notification panel anchored to an element. It closes
 * after a delay, on an outside click, or when the user presses Escape.
 *
 * @since n.e.x.t
 *
 * @param props                 Component props.
 * @param props.anchorEl        Anchor element. The popper opens when it is set, and closes when it is null.
 * @param props.onClose         Callback run when the popper should close.
 * @param [props.placement]     Placement relative to anchor, defaults to `top-end`.
 * @param [props.autoDismissMs] Auto-dismiss delay in ms, defaults to 4000. Pass 0 to disable.
 * @param [props.offset]        Gap between anchor and popper in px, defaults to 9.
 * @param [props.resetKey]      Changing this value resets the auto-dismiss timer.
 * @param props.children        Popper content.
 * @param [props.className]     Additional CSS class for the content wrapper.
 * @return React element, or null when `anchorEl` is null.
 */
const Popper: FC< PopperProps > = ( {
	anchorEl,
	onClose,
	placement = 'top-end',
	autoDismissMs = DEFAULT_AUTO_DISMISS_MS,
	offset = DEFAULT_OFFSET,
	resetKey,
	children,
	className,
} ) => {
	const isOpen = Boolean( anchorEl );
	const contentRef = useRef< HTMLDivElement >( null );
	const timerRef = useRef< ReturnType< typeof setTimeout > >();
	const onCloseRef = useRef( onClose );
	onCloseRef.current = onClose;

	const clearTimer = useCallback( () => {
		if ( timerRef.current !== undefined ) {
			clearTimeout( timerRef.current );
			timerRef.current = undefined;
		}
	}, [] );

	const startTimer = useCallback( () => {
		clearTimer();
		if ( autoDismissMs <= 0 ) {
			return;
		}
		timerRef.current = setTimeout( () => {
			onCloseRef.current();
		}, autoDismissMs );
	}, [ autoDismissMs, clearTimer ] );

	useEffect( () => {
		if ( isOpen ) {
			startTimer();
		}
		return clearTimer;
	}, [ isOpen, resetKey, startTimer, clearTimer ] );

	useEffect( () => {
		const ownerDoc = anchorEl?.ownerDocument ?? document;

		function handleMouseDown( event: MouseEvent ) {
			const target = event.target as Node;
			if ( contentRef.current?.contains( target ) ) {
				return;
			}
			if ( anchorEl?.contains( target ) ) {
				return;
			}
			onCloseRef.current();
		}

		if ( isOpen ) {
			ownerDoc.addEventListener( 'mousedown', handleMouseDown );
		}

		return () => {
			ownerDoc.removeEventListener( 'mousedown', handleMouseDown );
		};
	}, [ isOpen, anchorEl ] );

	useKey(
		( event ) => isOpen && event.key === 'Escape',
		() => onCloseRef.current()
	);

	function handleInteractStart() {
		clearTimer();
	}

	function handleInteractEnd() {
		if ( isOpen ) {
			startTimer();
		}
	}

	function handleBlur( event: React.FocusEvent ) {
		if ( contentRef.current?.contains( event.relatedTarget as Node ) ) {
			return;
		}
		handleInteractEnd();
	}

	return (
		<MuiPopper
			open={ isOpen }
			anchorEl={ anchorEl }
			placement={ placement }
			style={ POPPER_STYLE }
			// MUI Popper sets `role="tooltip"` by default. Clear it because this is a notification panel, not a tooltip.
			role={ undefined }
			modifiers={ {
				offset: { offset: `0, ${ offset }` },
				preventOverflow: { boundariesElement: 'window' },
			} }
			disablePortal
		>
			<div
				ref={ contentRef }
				className={ classnames( 'googlesitekit-popper', className ) }
				onMouseEnter={ handleInteractStart }
				onMouseLeave={ handleInteractEnd }
				onFocus={ handleInteractStart }
				onBlur={ handleBlur }
			>
				{ children }
			</div>
		</MuiPopper>
	);
};

export default Popper;
