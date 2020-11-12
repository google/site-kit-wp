/**
 * External dependencies
 */
import { RuleTester } from 'eslint';

/**
 * Internal dependencies
 */
import rule from './jsdoc-requires-since';

const ruleTester = new RuleTester( {
	parserOptions: {
		sourceType: 'module',
		ecmaVersion: 6,
	},
} );

ruleTester.run( 'jsdoc-requires-since', rule, {
	valid: [
		{
			code: `
/**
 * Wraps children components with a fresh test registry,
 * which can be configured by its callback prop.
 *
 * @since 1.7.1
 * @private
 *
 * @param {?Object}   props          Component props.
 * @return {string} A test string.
 */
export function WithTestRegistry( props ) {
	return 'test';
}
      `,
		},
		{
			code: `
/**
 * Wraps children components with a fresh test registry,
 * which can be configured by its callback prop.
 *
 * @since n.e.x.t
 * @since 1.8.0 Added a feature.
 * @since 1.7.1 Originally introduced.
 * @private
 *
 * @param {?Object} props Component props.
 * @return {string} A test string.
 */
export function coolFunction( props ) {
	return 'test';
}
      `,
		},
		{
			code: `
/**
 * Wraps children components with a fresh test registry,
 * which can be configured by its callback prop.
 *
 * @since 1.9.1
 * @since 1.8.0 Added a feature.
 * @since 1.7.1 Originally introduced.
 * @private
 *
 * @param {?Object} props Component props.
 * @return {string} A test string.
 */
export function coolFunction( props ) {
	return 'test';
}
      `,
		},
		{
			code: `
/**
 * Wraps children components with a fresh test registry,
 * which can be configured by its callback prop.
 *
 * @since 1.9.1 Added another feature.
 * @since 1.8.0 Added a feature.
 * @since 1.7.1 Originally introduced.
 * @private
 *
 * @param {?Object} props Component props.
 * @return {string} A test string.
 */
export function coolFunction( props ) {
	return 'test';
}
      `,
		},
		{
			code: `
/**
 * Wraps children components with a fresh test registry,
 * which can be configured by its callback prop.
 *
 * @since n.e.x.t Added another feature.
 * @since 1.8.0 Added a feature.
 * @since 1.7.1 Originally introduced.
 * @private
 *
 * @param {?Object} props Component props.
 * @return {string} A test string.
 */
export function coolFunction( props ) {
	return 'test';
}
      `,
		},
	],
	invalid: [
		{
			code: `
/**
 * Wraps children components with a fresh test registry,
 * which can be configured by its callback prop.
 *
 * @since 1.7.1
 * @since 1.7.0
 * @private
 *
 * @param {?Object}   props          Component props.
 * @return {string} A test string.
 */
export function WithTestRegistry( props ) {
	return 'test';
}
      `,
			errors: [
				{
					message:
						'All @since tags after the first one require a description.',
				},
			],
		},
		{
			code: `
/**
 * Wraps children components with a fresh test registry,
 * which can be configured by its callback prop.
 *
 * @since 1.7.1 Add a feature.
 * @since 1.7.0
 * @private
 *
 * @param {?Object}   props          Component props.
 * @return {string} A test string.
 */
export function WithTestRegistry( props ) {
	return 'test';
}
      `,
			errors: [
				{
					message:
						'All @since tags after the first one require a description.',
				},
			],
		},
		{
			code: `
/**
 * Wraps children components with a fresh test registry,
 * which can be configured by its callback prop.
 *
 * @since 1.7.1 Add a feature.
 * @since 1.7.0
 * @since 1.6.0 The previous one is missing though.
 * @private
 *
 * @param {?Object}   props          Component props.
 * @return {string} A test string.
 */
export function WithTestRegistry( props ) {
	return 'test';
}
      `,
			errors: [
				{
					message:
						'All @since tags after the first one require a description.',
				},
			],
		},
		{
			code: `
/**
 * Wraps children components with a fresh test registry,
 * which can be configured by its callback prop.
 *
 * @since 1.7.1 Missing a full-stop
 * @private
 *
 * @param {?Object}   props          Component props.
 * @return {string} A test string.
 */
export function WithTestRegistry( props ) {
	return 'test';
}
      `,
			errors: [
				{
					message:
						'All @since tags should have a description that ends with a period/full-stop.',
				},
			],
		},
		{
			code: `
/**
 * Wraps children components with a fresh test registry,
 * which can be configured by its callback prop.
 *
 * @since 1.7.2
 * @since 1.7.1 Missing a full-stop
 * @private
 *
 * @param {?Object}   props          Component props.
 * @return {string} A test string.
 */
export function WithTestRegistry( props ) {
	return 'test';
}
      `,
			errors: [
				{
					message:
						'All @since tags should have a description that ends with a period/full-stop.',
				},
			],
		},
		{
			code: `
/**
 * Wraps children components with a fresh test registry,
 * which can be configured by its callback prop.
 *
 * @since 1.7.2
 * @since 1.7.1 lowercase description.
 * @private
 *
 * @param {?Object}   props          Component props.
 * @return {string} A test string.
 */
export function WithTestRegistry( props ) {
	return 'test';
}
      `,
			errors: [
				{
					message:
						'All @since tags should have a description starting with a capital letter.',
				},
			],
		},
		{
			code: `
/**
 * Wraps children components with a fresh test registry,
 * which can be configured by its callback prop.
 *
 * @since 1.7.2 lowercase description.
 * @since 1.7.1 Normal description.
 * @private
 *
 * @param {?Object}   props          Component props.
 * @return {string} A test string.
 */
export function WithTestRegistry( props ) {
	return 'test';
}
      `,
			errors: [
				{
					message:
						'All @since tags should have a description starting with a capital letter.',
				},
			],
		},
	],
} );
