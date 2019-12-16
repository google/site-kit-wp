export const ThrowError = ( event ) => {
	event.preventDefault();

	// throw new Error( 'Something bad happened. 💣' );
	const badArrayAccess = null;
	return badArrayAccess[ 1 ].length;
};

const ErrorComponent = () => {
	return (
		<div>
			<button onClick={ ThrowError } type="button">Throw error</button>
		</div>
	);
};

export default ErrorComponent;
