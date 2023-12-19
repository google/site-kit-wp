/**
 * WordPress dependencies
 */
import { useState } from '@wordpress/element';

/**
 * Internal dependencies
 */
import { Button } from 'googlesitekit-components';

export const ThrowError = ( event ) => {
	if ( event ) {
		event.preventDefault();
	}

	throw new Error(
		'Something bad happened. 💣 (On purpose; ErrorComponent was used to simulate an error.)'
	);
};

function ThrowErrorComponent( { throwErrorOnMount = false } ) {
	const [ shouldThrow, setShouldThrow ] = useState( throwErrorOnMount );

	if ( shouldThrow ) {
		ThrowError();
	}

	return (
		<Button
			danger
			onClick={ () => {
				setShouldThrow( true );
			} }
		>
			Simulate an error
		</Button>
	);
}

export default ThrowErrorComponent;
