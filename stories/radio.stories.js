/**
 * External dependencies
 */
import { storiesOf } from '@storybook/react';

/**
 * Internal dependencies
 */
import Radio from '../assets/js/components/radio';

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
