/**
 * External dependencies
 */
import { storiesOf } from '@storybook/react';

/**
 * Internal dependencies
 */
import Button from '../assets/js/components/button';

storiesOf( 'Global', module )
	.add( 'Buttons', () => {
		return (
			<div>
				<p>
					<Button>
						Default Button
					</Button>
				</p>
				<p>
					<Button className="googlesitekit-button--hover">
						VRT: Default Button Hover
					</Button>
				</p>
				<p>
					<Button
						href="http://google.com"
					>
						Default Button Link
					</Button>
				</p>
				<p>
					<Button
						href="http://google.com"
						danger
					>
						Danger Button
					</Button>
				</p>
				<p>
					<Button
						disabled
					>
						Disabled Button
					</Button>
				</p>
			</div>
		);
	}, {
		options: {
			hoverSelector: '.googlesitekit-button--hover',
			postInteractionWait: 3000, // Wait for shadows to animate.
			onReadyScript: 'mouse.js',
		},
	} );
