import React from 'react';
import { storiesOf, addDecorator } from '@storybook/react';

const GoogleSitekitWrapper = ( storyFn ) => (
	<div className="googlesitekit-plugin">
		{ storyFn() }
	</div>
)
addDecorator( GoogleSitekitWrapper );

storiesOf( 'Example Component', module )
	.add( 'Name of Variation', () => (
		<ExampleComponent props={} />
	) )
	.add( 'Name of Another Variation', () => (
		<ExampleComponent props={} />
	) );
