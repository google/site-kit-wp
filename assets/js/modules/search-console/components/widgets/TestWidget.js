/* eslint-disable no-console */
import Data from 'googlesitekit-data';
import { MODULES_SEARCH_CONSOLE } from '../../datastore/constants';
import { Button } from 'googlesitekit-components';
const { useDispatch, useSelect } = Data;

export default function TestWidget() {
	const testValue = useSelect( ( select ) =>
		select( MODULES_SEARCH_CONSOLE ).getTestValue()
	);

	const {
		incrementTestValue,
		incrementTestValueGeneratorFunc,
		incrementTestValueGeneratorFuncYielding,
	} = useDispatch( MODULES_SEARCH_CONSOLE );

	console.log( 'Render TestWidget with testValue: ', testValue );

	return (
		<div>
			<h1>Test Widget</h1>
			<p>Value: { testValue }</p>
			<Button
				// eslint-disable-next-line require-await
				onClick={ async () => {
					// Comment out the await and the store updates will be synchronous.
					await Promise.resolve();
					console.log( 'TestWidget: incrementTestValue() 1' );
					incrementTestValue();
					console.log( 'TestWidget: incrementTestValue() 2' );
					incrementTestValue();
					console.log( 'TestWidget: incrementTestValue() 3' );
					incrementTestValue();
					console.log( 'TestWidget: incrementTestValue() 4' );
					incrementTestValue();
					console.log( 'TestWidget: incrementTestValue() 5' );
					incrementTestValue();
				} }
			>
				Increment five times in click handler
			</Button>

			<Button
				onClick={ () => {
					console.log(
						'TestWidget: incrementTestValueGeneratorFunc()'
					);
					incrementTestValueGeneratorFunc();
				} }
			>
				Increment five times in generator function
			</Button>

			<Button
				onClick={ () => {
					console.log(
						'TestWidget: incrementTestValueGeneratorFuncYielding()'
					);
					incrementTestValueGeneratorFuncYielding();
				} }
			>
				Increment five times in generator function w/ yield
			</Button>
		</div>
	);
}
