/**
 * FeedbackMenu component.
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
import { FC, ReactNode, RefObject } from 'react';
import { useClickAway } from 'react-use';

/**
 * WordPress dependencies
 */
import { useCallback, useRef } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { ESCAPE, TAB } from '@wordpress/keycodes';

/**
 * Internal dependencies
 */
import { Menu } from 'googlesitekit-components';
import { MenuItem } from '@/js/components/HeaderMenu';
import Typography from '@/js/components/Typography';
import { SIZE_LARGE, TYPE_LABEL } from '@/js/components/Typography/constants';
import { useKeyCodesInside } from '@/js/hooks/useKeyCodesInside';

export interface FeedbackMenuOption {
	id: string;
	label: ReactNode;
	value?: string;
}

export interface FeedbackMenuProps {
	id: string;
	isOpen: boolean;
	onClose: () => void;
	onSelect?: ( value: string | undefined ) => void;
	options: FeedbackMenuOption[];
	sourceRef?: RefObject< HTMLButtonElement | HTMLAnchorElement >;
	// eslint-disable-next-line sitekit/acronym-case -- Native DOM type.
	wrapperRef?: RefObject< HTMLElement >;
}

const FeedbackMenu: FC< FeedbackMenuProps > = ( {
	id,
	isOpen,
	onClose,
	onSelect,
	options,
	sourceRef,
	wrapperRef,
} ) => {
	const menuRef = useRef< HTMLDivElement >( null );
	const containerRef = wrapperRef || menuRef;
	const headingID = `${ id }-heading`;

	useClickAway( containerRef, () => {
		if ( isOpen ) {
			onClose();
		}
	} );

	useKeyCodesInside( [ ESCAPE, TAB ], containerRef, () => {
		if ( isOpen ) {
			onClose();
			sourceRef?.current?.focus();
		}
	} );

	const onSelected = useCallback(
		( index: number ) => {
			onSelect?.( options[ index ].value );
			onClose();
		},
		[ onClose, onSelect, options ]
	);

	return (
		// @ts-expect-error - The `Menu` component is not typed yet.
		<Menu
			aria-labelledby={ headingID }
			className="googlesitekit-feedback-menu"
			heading={
				<Typography
					as="h3"
					className="googlesitekit-feedback-menu__heading"
					id={ headingID }
					size={ SIZE_LARGE }
					type={ TYPE_LABEL }
				>
					{ __( 'Help us improve', 'google-site-kit' ) }
				</Typography>
			}
			id={ id }
			menuOpen={ isOpen }
			onSelected={ onSelected }
			ref={ menuRef }
		>
			{ options.map( ( option ) => (
				<MenuItem
					id={ option.id }
					itemClassName="googlesitekit-feedback-menu__item"
					key={ option.id }
					// @ts-expect-error - The `MenuItem` component is not typed yet.
					label={ option.label }
					labelClassName="googlesitekit-feedback-menu__item-label"
				/>
			) ) }
		</Menu>
	);
};

export default FeedbackMenu;
