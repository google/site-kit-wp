/**
 * WordPress dependencies
 */
import { useState } from '@wordpress/element';

/**
 * Internal dependencies
 */
import { Button } from 'googlesitekit-components';

export function ThrowError( event ) {
	if ( event ) {
		event.preventDefault();
	}

	// No emoji: the system emoji font loads lazily, which shifts the text after
	// it in visual regression screenshots.
	throw new Error(
		'Something bad happened. (On purpose; ErrorComponent was used to simulate an error.)'
	);
}

function ThrowErrorComponent( { throwErrorOnMount = false } ) {
	const [ shouldThrow, setShouldThrow ] = useState( throwErrorOnMount );

	if ( shouldThrow ) {
		ThrowError();
	}

	return (
		<Button
			onClick={ () => {
				setShouldThrow( true );
			} }
			danger
		>
			Simulate an error
		</Button>
	);
}

export default ThrowErrorComponent;
