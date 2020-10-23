/**
 * External dependencies
 */
import { storiesOf } from '@storybook/react';

/**
 * Internal dependencies
 */
import Checkbox from '../assets/js/components/Checkbox';

storiesOf( 'Global', module )
	.add( 'Checkboxes', () => {
		return (
			<div>
				<div>
					<Checkbox
						id="googlesitekit-checkbox-1"
						name="googlesitekit__checkbox"
						onChange={ () => {
							console.log( 'Checked' ); // eslint-disable-line
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
						onChange={ () => {
							console.log( 'Checked' ); // eslint-disable-line
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
						onChange={ () => {
							console.log( 'Checked' ); // eslint-disable-line
						} }
						value="value-3"
					>
						Disabled Button
					</Checkbox>
				</div>
			</div>
		);
	}, {
		options: {
			onReadyScript: 'mouse.js',
		},
	} );
