/**
 * Repeater RemoveButton component.
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
import { FC } from 'react';

/**
 * WordPress dependencies
 */
import { useContext } from '@wordpress/element';

/**
 * Internal dependencies
 */
import { Button } from 'googlesitekit-components';
import TrashIcon from '@/svg/icons/trash-outlined.svg';
import { RemoveButtonContext } from './RemoveButtonContext';

export interface RemoveButtonProps {
	'aria-label': string;
}

const RemoveButton: FC< RemoveButtonProps > = ( {
	'aria-label': ariaLabel,
} ) => {
	const context = useContext( RemoveButtonContext );

	if ( ! context ) {
		return null;
	}

	return (
		<Button
			aria-label={ ariaLabel }
			// @ts-expect-error - `Button` component typing is incomplete.
			className="googlesitekit-repeater__remove"
			icon={
				<TrashIcon
					aria-hidden="true"
					focusable="false"
					height={ 24 }
					width={ 24 }
				/>
			}
			onClick={ context.removeItem }
			type="button"
			tertiary
		/>
	);
};

export default RemoveButton;
