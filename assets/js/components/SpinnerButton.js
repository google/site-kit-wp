/**
 * Site Kit by Google, Copyright 2022 Google LLC
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
import PropTypes from 'prop-types';

/**
 * WordPress dependencies
 */
import { useState, useCallback } from '@wordpress/element';

/**
 * Internal dependencies
 */
import Button from './Button';
import Spinner from './Spinner';

export default function SpinnerButton( props ) {
	const { onClick = () => {}, ...restProps } = props;

	const [ processing, setPropcessing ] = useState( false );

	const handleClick = useCallback(
		async ( ...params ) => {
			setPropcessing( true );
			await onClick?.( ...params );
			setPropcessing( false );
		},
		[ onClick ]
	);

	return (
		<Button
			trailingIcon={ <Spinner isSaving={ processing } /> }
			onClick={ handleClick }
			{ ...restProps }
		/>
	);
}

SpinnerButton.propTypes = {
	onClick: PropTypes.func,
};
