export default function Actions( { Primary, Secondary } ) {
	return (
		<div className="googlesitekit-notification__actions">
			<Primary />
			{ Secondary && <Secondary /> }
		</div>
	);
}
