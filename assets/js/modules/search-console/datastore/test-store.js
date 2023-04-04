/* eslint-disable no-console */
import Data from 'googlesitekit-data';
import { MODULES_SEARCH_CONSOLE } from './constants';
const { commonActions } = Data;

const initialState = {
	testValue: 0,
};

const actions = {
	incrementTestValue() {
		return {
			type: 'TEST_INCREMENT',
		};
	},

	*incrementTestValueGeneratorFuncYielding() {
		console.log(
			'incrementTestValueGeneratorFunc: incrementTestValue() 1'
		);
		yield actions.incrementTestValue();
		// Note, the same behaviour is observed when using yield instead of dispatch.
		// yield actions.incrementTestValue();
		console.log(
			'incrementTestValueGeneratorFunc: incrementTestValue() 2'
		);
		yield actions.incrementTestValue();
		console.log(
			'incrementTestValueGeneratorFunc: incrementTestValue() 3'
		);
		yield actions.incrementTestValue();
		console.log(
			'incrementTestValueGeneratorFunc: incrementTestValue() 4'
		);
		yield actions.incrementTestValue();
		console.log(
			'incrementTestValueGeneratorFunc: incrementTestValue() 5'
		);
		yield actions.incrementTestValue();
	},

	*incrementTestValueGeneratorFunc() {
		const registry = yield commonActions.getRegistry();

		// Comment out the await and the store updates will be synchronous.
		yield commonActions.await( Promise.resolve() );

		console.log(
			'incrementTestValueGeneratorFunc: incrementTestValue() 1'
		);
		registry.dispatch( MODULES_SEARCH_CONSOLE ).incrementTestValue();
		// Note, the same behaviour is observed when using yield instead of dispatch.
		// yield actions.incrementTestValue();
		console.log(
			'incrementTestValueGeneratorFunc: incrementTestValue() 2'
		);
		registry.dispatch( MODULES_SEARCH_CONSOLE ).incrementTestValue();
		console.log(
			'incrementTestValueGeneratorFunc: incrementTestValue() 3'
		);
		registry.dispatch( MODULES_SEARCH_CONSOLE ).incrementTestValue();
		console.log(
			'incrementTestValueGeneratorFunc: incrementTestValue() 4'
		);
		registry.dispatch( MODULES_SEARCH_CONSOLE ).incrementTestValue();
		console.log(
			'incrementTestValueGeneratorFunc: incrementTestValue() 5'
		);
		registry.dispatch( MODULES_SEARCH_CONSOLE ).incrementTestValue();
	},
};

const controls = {};

const reducer = ( state, action ) => {
	switch ( action.type ) {
		case 'TEST_INCREMENT':
			return {
				...state,
				testValue: state.testValue + 1,
			};
		default:
			return state;
	}
};

const resolvers = {};

const selectors = {
	getTestValue: ( state ) => {
		return state.testValue;
	},
};

const store = {
	initialState,
	actions,
	controls,
	reducer,
	resolvers,
	selectors,
};

export default store;
