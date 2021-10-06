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
import { useCallback, useState } from '@wordpress/element';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import Button from './Button';
import MagnifyingGlass from '../../svg/magnifying-glass.svg';

const EntitySearchInput = () => {
	const [ isActive, setIsActive ] = useState( false );

	const onActive = useCallback( () => {
		setIsActive( true );
	}, [] );

	const onBlur = useCallback( () => {
		setIsActive( false );
	}, [] );

	if ( isActive ) {
		return <input onBlur={ onBlur } />;
	}

	return (
		<Button
			onClick={ onActive }
			icon={ <MagnifyingGlass width="20" height="20" /> }
		>
			{ __( 'URL Search', 'google-site-kit' ) }
		</Button>
	);
};

export default EntitySearchInput;
