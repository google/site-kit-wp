/**
 * External dependencies
 */
import { storiesOf } from '@storybook/react';

/**
 * Internal dependencies
 */
import Switch from '../assets/js/components/switch';

storiesOf( 'Global', module )
	.add( 'Switches', () => (
		<div>
			<div>
				<Switch
					label="Unswitched"
					hideLabel={ false }
				/>
			</div>
			<div>
				<Switch
					label="Switched"
					hideLabel={ false }
					checked
				/>
			</div>
			<div>
				<Switch
					label="Hidden Label"
					checked
				/>
			</div>
		</div>
	) );
