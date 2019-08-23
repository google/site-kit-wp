/**
 * External dependencies
 */
import React, { Component } from 'react';
import { storiesOf, addDecorator } from '@storybook/react';

const GoogleSitekitWrapper = ( storyFn ) => (
	<div className="googlesitekit-plugin">
		{ storyFn() }
	</div>
);
addDecorator( GoogleSitekitWrapper );

class ExampleComponent extends Component {
	render() {
		return null;
	}
}

storiesOf( 'Example Component', module )
	.add( 'Name of Variation', () => (
		<ExampleComponent />
	) )
	.add( 'Name of Another Variation', () => (
		<ExampleComponent />
	) );
