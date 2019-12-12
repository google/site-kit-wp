const ErrorComponent = () => {
	const throwError = ( event ) => {
		event.preventDefault();

		// throw new Error( 'Something bad happened. 💣' );
		const badArrayAccess = null;
		return badArrayAccess[ 1 ].length;
	};

	return (
		<div>
			<button onClick={ throwError } type="button">Throw error</button>
		</div>
	);
};

export default ErrorComponent;
