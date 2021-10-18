/**
 * EntitySearchInput component.
 *
 * Site Kit by Google, Copyright 2021 Google LLC
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
import { Fragment, useCallback, useState } from '@wordpress/element';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import Button from './Button';
import VisuallyHidden from './VisuallyHidden';
import MagnifyingGlass from '../../svg/magnifying-glass.svg';

function EntitySearchInput() {
	const [ isActive, setIsActive ] = useState( false );

	const onActive = useCallback( () => {
		setIsActive( true );
	}, [] );

	const onBlur = useCallback( () => {
		setIsActive( false );
	}, [] );

	if ( isActive ) {
		return (
			<Fragment>
				<VisuallyHidden>
					<label htmlFor="entity-search-input">
						{ __( 'Page/URL Search', 'google-site-kit' ) }
					</label>
				</VisuallyHidden>
				{ /* eslint-disable-next-line jsx-a11y/no-autofocus */ }
				<input id="entity-search-input" autoFocus onBlur={ onBlur } />
			</Fragment>
		);
	}

	return (
		<div className="googlesitekit-dropdown-menu googlesitekit-dropdown-menu__icon-menu">
			<Button
				text
				onClick={ onActive }
				trailingIcon={ <MagnifyingGlass width="30" height="20" /> }
				className="mdc-button--dropdown"
			>
				{ __( 'URL Search', 'google-site-kit' ) }
			</Button>
		</div>
	);
}

export default EntitySearchInput;
