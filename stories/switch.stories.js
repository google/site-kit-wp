/**
 * External dependencies
 */
import { storiesOf } from '@storybook/react';
import Switch from 'GoogleComponents/switch';

storiesOf( 'Global', module )
	.add( 'Switches', () => (
		<div>
			<div>
				<Switch
					id="switch-story"
					label="Unswitched"
					hideLabel={ false }
				/>
			</div>
			<div>
				<Switch
					id="switch-story"
					label="Switched"
					hideLabel={ false }
					checked
				/>
			</div>
			<div>
				<Switch
					id="switch-story"
					label="Hidden Label"
					checked
				/>
			</div>
		</div>
	) );
