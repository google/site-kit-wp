/**
 * External dependencies
 */
import { storiesOf } from '@storybook/react';

/**
 * Internal dependencies
 */
import Checkbox from '../assets/js/components/Checkbox';

storiesOf( 'Global', module )
	.add( 'Checkboxes', () => (
		<div>
			<div>
				<Checkbox
					id="googlesitekit-checkbox-1"
					name="googlesitekit__checkbox"
					onChange={ ( e ) => {
						global.console.log( e.target.value );
					} }
					value="value-1"
				>
					Default Checkbox
				</Checkbox>
			</div>

			<div>
				<Checkbox
					checked
					name="googlesitekit__checkbox"
					id="googlesitekit-checkbox-2"
					onChange={ ( e ) => {
						global.console.log( e.target.value );
					} }
					value="value-2"
				>
					Checked Checkbox
				</Checkbox>
			</div>

			<div>
				<Checkbox
					disabled
					id="googlesitekit-checkbox-3"
					name="googlesitekit__checkbox"
					onChange={ ( e ) => {
						global.console.log( e.target.value );
					} }
					value="value-3"
				>
					Disabled Button
				</Checkbox>
			</div>
		</div>
	), {
		options: {
			onReadyScript: 'mouse.js',
		},
	} );
