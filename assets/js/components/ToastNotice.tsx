/**
 * ToastNotice component.
 *
 * Site Kit by Google, Copyright 2025 Google LLC
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
import { useMount, useUnmount } from 'react-use';
import { FC, ReactNode } from 'react';

/**
 * WordPress dependencies
 */
import { useState, useRef } from '@wordpress/element';

/**
 * Internal dependencies
 */
import Notice from './Notice';
import { TYPES } from './Notice/constants';

export interface ToastNoticeProps {
	/**
	 * The title of the notice, used to render a `<Title>` element inside
	 * the `<Notice>` component ultimately rendered by this Toast.
	 */
	title: ReactNode;
	/**
	 * Function to be called when the notice is dismissed, either by timeout or
	 * by user interaction.
	 */
	onDismiss?: () => void;
}

/**
 * Renders a notice that automatically disappears after a short period of time.
 *
 * @since 1.163.0
 *
 * @param props           Props for the component.
 * @param props.title     Title of the notice.
 * @param props.onDismiss Function to be called when the notice is dismissed/unmounted.
 * @return                The rendered component.
 */
const ToastNotice: FC< ToastNoticeProps > = ( { title, onDismiss } ) => {
	const [ isHidden, setIsHidden ] = useState( false );
	const timeout = useRef< NodeJS.Timeout >();

	useMount( () => {
		timeout.current = setTimeout( () => {
			setIsHidden( true );
			onDismiss?.();
		}, 5500 );
	} );

	useUnmount( () => {
		onDismiss?.();
		clearTimeout( timeout.current );
	} );

	if ( isHidden ) {
		return null;
	}

	return (
		<Notice
			// @ts-expect-error - The `Notice` component is not yet typed.
			className="googlesitekit-toast-notice"
			title={ title }
			type={ TYPES.SUCCESS }
		/>
	);
};

export default ToastNotice;
