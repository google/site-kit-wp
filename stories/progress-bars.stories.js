/**
 * External dependencies
 */
import { storiesOf } from '@storybook/react';
import ProgressBar from 'GoogleComponents/progress-bar';

storiesOf( 'Global', module )
	.add( 'Progress Bars', () => (
		<div>
			<p>Default</p>
			<ProgressBar />
			<p>Small</p>
			<ProgressBar small />
			<p>Small Compress</p>
			<ProgressBar small compress />
		</div>
	), {
		options: {
			misMatchThreshold: 10, // Handle animation differences.
		},
	} );
