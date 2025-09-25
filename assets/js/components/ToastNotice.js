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
import { useMount } from 'react-use';

/**
 * WordPress dependencies
 */
import { useState } from '@wordpress/element';

/**
 * Internal dependencies
 */
import Notice from './Notice';
import { TYPES } from './Notice/constants';

export default function ToastNotice( { title, onDismiss } ) {
	const [ isHidden, setIsHidden ] = useState( false );

	useMount( () => {
		setTimeout( () => {
			setIsHidden( true );
			onDismiss?.();
		}, 5500 );
	} );

	if ( isHidden ) {
		return null;
	}

	return (
		<Notice
			className="googlesitekit-toast-notice"
			title={ title }
			type={ TYPES.SUCCESS }
		/>
	);
}
