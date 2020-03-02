/**
 * Internal dependencies
 */
import { collect } from './utils';

describe( 'data utils', () => {
	describe( 'collect()', () => {
		it( 'should collect multiple objects and combine them into one', () => {
			const objectOne = {
				bar: () => {},
				foo: () => {},
			};
			const objectTwo = {
				cat: () => {},
				dog: () => {},
			};

			expect( collect( objectOne, objectTwo ) ).toEqual( {
				...objectOne,
				...objectTwo,
			} );
		} );

		it( 'should accept as many objects as supplied', () => {
			const objectOne = {
				bar: () => {},
				foo: () => {},
			};
			const objectTwo = {
				cat: () => {},
				dog: () => {},
			};
			const objectThree = {
				feline: () => {},
				wolf: () => {},
			};
			const objectFour = {
				mouse: () => {},
				rat: () => {},
			};
			const objectFive = {
				horse: () => {},
				unicorn: () => {},
			};

			expect( collect(
				objectOne,
				objectTwo,
				objectThree,
				objectFour,
				objectFive
			) ).toEqual( {
				...objectOne,
				...objectTwo,
				...objectThree,
				...objectFour,
				...objectFive,
			} );
		} );

		it( 'should error if objects have the same key', () => {
			// This can lead to subtle/hard-to-detect errors, so we check for it
			// whenever combining store actions, selectors, etc.
			// See: https://github.com/google/site-kit-wp/pull/1162/files#r385912255
			const objectOne = {
				cat: () => {},
				feline: () => {},
				mouse: () => {},
			};
			const objectTwo = {
				cat: () => {},
				feline: () => {},
				dog: () => {},
			};

			expect( () => {
				collect( objectOne, objectTwo );
			} ).toThrow( /Your call to collect\(\) contains the following duplicated functions: cat, feline./ );
		} );
	} );
} );
