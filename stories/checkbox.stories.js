/**
 * External dependencies
 */
import { storiesOf } from '@storybook/react';
import Checkbox from 'GoogleComponents/checkbox';

storiesOf( 'Global', module )
	.add( 'Checkbox', () => {
		return (
			<div>
				<div>
					<Checkbox>
						Checkbox
					</Checkbox>
				</div>
				<div>
					<Checkbox 
						className="googlesitekit-checkbox"
						checked={true}
					>
						Checked
					</Checkbox>
				</div>
				<div>
					<Checkbox 
						className="googlesitekit-checkbox--hover"
						disabled={true}
					>
						Disabled checkbox
					</Checkbox>
				</div>
				<div>
					<Checkbox 
						className="googlesitekit-checkbox"
						disabled={true}
						checked={true}
					>
						Checked disabled
					</Checkbox>
					
				</div>
			</div>
		);
	}, {
		options: {
			postInteractionWait: 3000, // Wait for shadows to animate.
		},
	} );
