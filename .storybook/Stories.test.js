import initStoryshots from '@storybook/addon-storyshots';
import { puppeteerTest } from '@storybook/addon-storyshots-puppeteer';
import path from 'path';

console.log( 'THIS DOES NOT LOG' ); // eslint-disable-line

initStoryshots( {
	suite: 'Puppeteer storyshots',
	test: puppeteerTest( {
		// eslint-disable-next-line sitekit/acronym-case
		storybookUrl: `file://${ path.resolve(
			__dirname,
			'../storybook-static'
		) }`,
		// docs don't say if s or ms
		setupTimeout: 5,
		testTimeout: 5,
	} ),
} );
