import gulp from 'gulp';
import del from 'del';

gulp.task( 'copy', () => {

	del.sync( [ './release/**/*' ] );

	gulp.src(
		[
			'readme.txt',
			'google-site-kit.php',
			'dist/*.js',
			'dist/assets/**/*',
			'bin/**/*',
			'includes/**/*',
			'vendor/google/apiclient/**/*',
			'vendor/google/auth/**/*',
			'vendor/google/apiclient-services/src/Google/Service/Analytics.php',
			'vendor/google/apiclient-services/src/Google/Service/Analytics/**/*',
			'vendor/google/apiclient-services/src/Google/Service/AnalyticsReporting.php',
			'vendor/google/apiclient-services/src/Google/Service/AnalyticsReporting/**/*',
			'vendor/google/apiclient-services/src/Google/Service/AdSense.php',
			'vendor/google/apiclient-services/src/Google/Service/AdSense/**/*',
			'vendor/google/apiclient-services/src/Google/Service/Pagespeedonline.php',
			'vendor/google/apiclient-services/src/Google/Service/Pagespeedonline/**/*',
			'vendor/google/apiclient-services/src/Google/Service/Webmasters.php',
			'vendor/google/apiclient-services/src/Google/Service/Webmasters/**/*',
			'vendor/google/apiclient-services/src/Google/Service/SiteVerification.php',
			'vendor/google/apiclient-services/src/Google/Service/SiteVerification/**/*',
			'vendor/google/apiclient-services/src/Google/Service/TagManager.php',
			'vendor/google/apiclient-services/src/Google/Service/TagManager/**/*',
			'vendor/google/apiclient-services/src/Google/Service/PeopleService.php',
			'vendor/google/apiclient-services/src/Google/Service/PeopleService/**/*',
			'vendor/firebase/**/*',
			'vendor/guzzlehttp/**/*',
			'vendor/psr/**/*',
			'vendor/monolog/**/*',
			'vendor/symfony/**/*',
			'vendor/react/**/*',
			'vendor/ralouphie/**/*',
			'vendor/composer/*',
			'vendor/autoload.php',
			'!vendor/**/**/{tests,Tests,doc?(s),examples}/**/*',
			'!vendor/**/**/{*.md,*.yml,phpunit.*}',
			'!**/*.map'
		],
		{ base: '.' }
	)
		.pipe( gulp.dest( 'release' ) );
} );
