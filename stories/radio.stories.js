import { storiesOf } from '@storybook/react';
import Radio from 'GoogleComponents/radio';

storiesOf( 'Global', module )
	.add( 'Radios', () => (
		<div>
			<div>
				<Radio
					id="radio-story"
					name="radio-story"
					value="story"
				>
					Default
				</Radio>
			</div>
			<div>
				<Radio
					id="radio-story"
					name="radio-story"
					value="story"
					checked
				>
					Checked
				</Radio>
			</div>
			<div>
				<Radio
					id="radio-story"
					name="radio-story"
					value="story"
					disabled
				>
					Disabled
				</Radio>
			</div>
		</div>
	) );
