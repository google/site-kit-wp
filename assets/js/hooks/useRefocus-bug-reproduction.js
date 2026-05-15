/* eslint-disable no-console */
import { useState, useCallback } from '@wordpress/element';
import { Button } from 'googlesitekit-components';
import { useRefocus } from './useRefocus';

export default function UseRefocusBugReproduction() {
	const [ internalState, setInternalState ] = useState( 0 );
	const [ syncExecutionCount, setSyncExecutionCount ] = useState( 0 );

	// This callback depends on internalState, causing a new reference whenever state changes
	const onSync = useCallback( () => {
		console.log(
			'[useRefocus] onSync callback executed!',
			'Execution count:',
			syncExecutionCount + 1
		);
		setSyncExecutionCount( ( count ) => count + 1 );
	}, [ syncExecutionCount ] ); // ⚠️ Dependency on state causes callback reference to change

	// Pass callback to useRefocus (5 second delay for quick testing)
	useRefocus( onSync, 5000 );

	function handleToggleState() {
		console.log(
			'[useRefocus-Bug-Repro] State toggled - new callback reference will be created'
		);
		setInternalState( ( prev ) => prev + 1 );
	}

	return (
		<div
			style={ {
				padding: '20px',
				border: '2px solid #e74c3c',
				borderRadius: '4px',
				backgroundColor: '#fef5e7',
				margin: '20px',
				fontFamily: 'monospace',
			} }
		>
			<h3 style={ { marginTop: 0, color: '#c0392b' } }>
				🐛 useRefocus Race Condition Bug Reproduction
			</h3>

			<div
				style={ {
					backgroundColor: '#fff',
					padding: '10px',
					borderRadius: '3px',
					marginBottom: '15px',
					fontSize: '12px',
				} }
			>
				<strong>How to reproduce:</strong>
				<ol>
					<li>
						<strong>Step 1:</strong> Click the "Leave Tab" button or
						physically switch tabs/windows (triggers blur event)
					</li>
					<li>
						<strong>Step 2:</strong> Before 5 seconds pass, click
						"Toggle State" button (triggers new callback reference)
					</li>
					<li>
						<strong>Step 3:</strong> Return to this tab/window
						(triggers focus event)
					</li>
					<li>
						<strong>Check Console:</strong> The callback should
						execute but it won't (that's the bug!)
					</li>
				</ol>
			</div>

			<div
				style={ {
					display: 'flex',
					gap: '10px',
					marginBottom: '15px',
					flexWrap: 'wrap',
				} }
			>
				<Button
					onClick={ () => {
						console.log(
							'[useRefocus-Bug-Repro] Simulating blur event - dispatching blur event to window'
						);
						window.dispatchEvent( new Event( 'blur' ) );
					} }
					variant="primary"
				>
					🔴 Leave Tab (Blur)
				</Button>
				<Button
					onClick={ () => {
						console.log(
							'[useRefocus-Bug-Repro] Simulating focus event - dispatching focus event to window'
						);
						window.dispatchEvent( new Event( 'focus' ) );
					} }
					variant="secondary"
				>
					🟢 Return to Tab (Focus)
				</Button>
				<Button onClick={ handleToggleState } variant="tertiary">
					⚠️ Toggle State (Trigger Bug)
				</Button>
			</div>

			<div
				style={ {
					backgroundColor: '#ecf0f1',
					padding: '10px',
					borderRadius: '3px',
					fontSize: '12px',
				} }
			>
				<strong>State:</strong> { internalState }
				<br />
				<strong>Sync Execution Count:</strong> { syncExecutionCount }
				<br />
				<strong style={ { color: '#c0392b' } }>
					⚠️ Notice: If you toggle state between blur and focus, the
					count won't increment on focus (BUG)
				</strong>
			</div>

			<div
				style={ {
					backgroundColor: '#d5dbdb',
					padding: '10px',
					borderRadius: '3px',
					marginTop: '15px',
					fontSize: '11px',
					fontStyle: 'italic',
				} }
			>
				📋 <strong>Console Logs to Look For:</strong>
				<br />
				✓ "[useRefocus] Blur event - waiting 5000ms before sync"
				<br />
				✓ "[useRefocus-Bug-Repro] State toggled - new callback..."
				<br />
				✓ "[useRefocus] useEffect cleanup - clearing timeout" ← Clears
				the blur timeout!
				<br />
				BUG!
			</div>
		</div>
	);
}
