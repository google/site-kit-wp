/**
 * WordPress dependencies
 */
import { useState } from '@wordpress/element';

/**
 * Internal dependencies
 */
import Button from '../button';

export const ThrowError = ( event ) => {
	if ( event ) {
		event.preventDefault();
	}

	throw new Error( 'Something bad happened. 💣 (On purpose; ErrorComponent was used to simulate an error.)' );
};

const ErrorComponent = () => {
	const [ shouldThrow, setShouldThrow ] = useState( false );

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
};

export default ErrorComponent;
