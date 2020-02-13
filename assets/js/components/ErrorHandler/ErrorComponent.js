/**
 * WordPress dependencies
 */
import { useState } from '@wordpress/element';

/**
 * Internal dependencies
 */
// eslint-disable-next-line @wordpress/dependency-group
import Button from 'GoogleComponents/button';

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
		<div>
			<Button
				danger
				onClick={ () => {
					setShouldThrow( true );
				} }
			>
				Simulate an error
			</Button>
		</div>
	);
};

export default ErrorComponent;
