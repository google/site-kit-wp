<?php
/**
 * Class Google\Site_Kit\Tests\Core\Site_Health\Tag_PlacementTest
 *
 * @package   Google\Site_Kit\Tests\Core\Site_Health
 * @copyright 2024 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 */

namespace Google\Site_Kit\Tests\Core\Site_Health;

use Google\Site_Kit\Context;
use Google\Site_Kit\Core\Authentication\Authentication;
use Google\Site_Kit\Core\Modules\Module;
use Google\Site_Kit\Core\Modules\Modules;
use Google\Site_Kit\Core\Site_Health\Tag_Placement;
use Google\Site_Kit\Core\Storage\Options;
use Google\Site_Kit\Core\Storage\User_Options;
use Google\Site_Kit\Core\Tags\Google_Tag_Gateway\Google_Tag_Gateway_Settings;
use Google\Site_Kit\Core\Tags\GTag;
use Google\Site_Kit\Modules\Ads;
use Google\Site_Kit\Modules\AdSense;
use Google\Site_Kit\Modules\Analytics_4;
use Google\Site_Kit\Modules\Reader_Revenue_Manager;
use Google\Site_Kit\Modules\Sign_In_With_Google;
use Google\Site_Kit\Modules\Tag_Manager;
use Google\Site_Kit\Tests\TestCase;

/**
 * @group Util
 */
class Tag_PlacementTest extends TestCase {

	protected $original_wp_version;

	protected $context;

	protected $options;

	protected $user_options;

	protected $authentication;

	protected $tag_placement;

	protected $analytics_4;

	public function set_up() {
		parent::set_up();

		global $wp_version;

		$this->original_wp_version = $wp_version;

		$this->context        = new Context( GOOGLESITEKIT_PLUGIN_MAIN_FILE );
		$this->options        = new Options( $this->context );
		$this->user_options   = new User_Options( $this->context );
		$this->authentication = new Authentication( $this->context, $this->options, $this->user_options );
		$modules              = new Modules( $this->context, $this->options, $this->user_options, $this->authentication );

		$this->analytics_4   = $this->create_module( Analytics_4::class );
		$this->tag_placement = new Tag_Placement( $modules );
	}

	public function tear_down() {
		parent::tear_down();
		global $wp_version;

		$wp_version = $this->original_wp_version;
	}

	public function test_register() {
		remove_all_filters( 'site_status_tests' );
		$this->tag_placement->register();

		$this->assertTrue(
			has_filter( 'site_status_tests' ),
			'Tag placement check should be registered with WordPress Site Health.'
		);
	}

	public function test_site_status_tests__wp_version_5_5() {
		global $wp_version;

		// Mock a version less than 5.6.
		$wp_version = '5.5';

		remove_all_filters( 'site_status_tests' );
		$this->tag_placement->register();

		$modified_tests = apply_filters( 'site_status_tests', array() );

		$this->assertArrayHasKey( 'direct', $modified_tests, 'WordPress 5.5 should receive synchronous Site Health tests.' );
		$this->assertArrayHasKey( 'tag_placement', $modified_tests['direct'], 'Tag placement should be registered as a synchronous test on WordPress 5.5.' );
		$this->assertIsArray( $modified_tests['direct']['tag_placement'], 'Synchronous tag placement test should use a valid Site Health definition.' );
	}

	public function test_site_status_tests__wp_version_5_6_or_over() {
		global $wp_version;

		// Mock a version higher than 5.6.
		$wp_version = '6.0';

		remove_all_filters( 'site_status_tests' );
		$this->tag_placement->register();

		$modified_tests = apply_filters( 'site_status_tests', array() );

		$this->assertTrue(
			version_compare( $wp_version, '5.6', '>=' ),
			'Test should exercise a WordPress version that supports asynchronous Site Health tests.'
		);
		$this->assertArrayHasKey( 'async', $modified_tests, 'WordPress 5.6 or newer should receive asynchronous Site Health tests.' );
		$this->assertArrayHasKey( 'tag_placement', $modified_tests['async'], 'Tag placement should be registered as an asynchronous test on supported WordPress versions.' );
		$this->assertIsArray( $modified_tests['async']['tag_placement'], 'Asynchronous tag placement test should use a valid Site Health definition.' );
	}

	public function test_tag_placement_test__wp_version_bellow_5_6() {
		global $wp_version;

		// Mock a version less than 5.6.
		$wp_version = '5.5';

		$site_status = $this->tag_placement;

		$check_if_tag_exists = $this->get_accessible_method( $site_status, 'tag_placement_test' );

		$result = $check_if_tag_exists->invokeArgs( $site_status, array() );

		$this->assertEquals( '<p>This feature requires WordPress version 5.6 or higher</p>', $result['description'], 'Unsupported WordPress versions should receive the minimum-version message.' );
	}

	/**
	 * @dataProvider data_tag_placement_test__snippet_setting
	 *
	 * @param string $module_slug       Module slug.
	 * @param string $module_class      Module class name.
	 * @param array  $settings          Module settings.
	 * @param string $expected          Expected result line.
	 * @param int    $expected_requests Expected count of page requests.
	 */
	public function test_tag_placement_test__snippet_setting( $module_slug, $module_class, $settings, $expected, $expected_requests ) {
		global $wp_version;

		// Mock a version higher than 5.6.
		$wp_version = '6.0';

		update_option( Modules::OPTION_ACTIVE_MODULES, array( $module_slug ) );
		$this->create_module( $module_class )->get_settings()->merge( $settings );

		$requests = 0;
		add_filter(
			'pre_http_request',
			function () use ( &$requests ) {
				++$requests;

				return array(
					'body'     => self::get_google_tag_script( 'G-1234567' ) . self::get_google_tag_script( 'AW-123456789' ),
					'response' => array( 'code' => 200 ),
				);
			}
		);

		$tag_placement_test = $this->get_accessible_method( $this->tag_placement, 'tag_placement_test' );
		$result             = $tag_placement_test->invoke( $this->tag_placement );

		$this->assertEquals( "<ul>{$expected}</ul>", $result['description'], 'The Tag Placement test should report the expected result for the module.' );
		$this->assertSame( $expected_requests, $requests, 'The Tag Placement test should request the page only for a module whose tag placement is on.' );
	}

	public function data_tag_placement_test__snippet_setting() {
		return array(
			'Analytics with its snippet off'    => array(
				'analytics-4',
				Analytics_4::class,
				array(
					'measurementID' => 'G-1234567',
					'useSnippet'    => false,
				),
				'<li><strong>Analytics</strong>: Tag placement disabled in settings.</li>',
				0,
			),
			'Analytics with its snippet on'     => array(
				'analytics-4',
				Analytics_4::class,
				array(
					'measurementID' => 'G-1234567',
					'useSnippet'    => true,
				),
				'<li><strong>Analytics</strong>: Tag detected and placed by Site Kit.</li>',
				1,
			),
			'Ads, which has no snippet setting' => array(
				'ads',
				Ads::class,
				array( 'conversionID' => 'AW-123456789' ),
				'<li><strong>Ads</strong>: Tag detected and placed by Site Kit.</li>',
				1,
			),
		);
	}

	public function test_get_active_modules_with_tags() {
		$site_status = $this->tag_placement;

		update_option(
			Modules::OPTION_ACTIVE_MODULES,
			array(
				'search-console',
				'pagespeed-insights',
				'adsense',
				'analytics-4',
			)
		);

		$get_active_modules = $this->get_accessible_method( $site_status, 'get_active_modules_with_tags' );

		$result = $get_active_modules->invokeArgs( $site_status, array() );

		$this->assertEqualSets(
			array(
				'adsense',
				'analytics-4',
			),
			array_keys( $result ),
			'Only active modules that place tags should be checked.'
		);

		update_option(
			Modules::OPTION_ACTIVE_MODULES,
			array(
				'search-console',
				'pagespeed-insights',
			)
		);

		$result = $get_active_modules->invokeArgs( $site_status, array() );

		$this->assertTrue( empty( $result ), 'Active modules without tags should not be checked for tag placement.' );
	}

	public function test_check_if_tag_exists__no_tag() {
		$site_status = $this->tag_placement;

		$check_if_tag_exists = $this->get_accessible_method( $site_status, 'check_if_tag_exists' );

		$result = $check_if_tag_exists->invokeArgs( $site_status, array( $this->analytics_4, 'body content' ) );

		$this->assertEquals( '<li><strong>Analytics</strong>: No tag detected.</li>', $result, 'Missing Analytics tag should be reported as not detected.' );
	}

	public function test_check_if_tag_exists__has_tag_placed_by_sitekit() {
		$this->analytics_4->get_settings()->merge( array( 'measurementID' => 'G-NGXXXX' ) );

		$site_status = $this->tag_placement;

		$check_if_tag_exists = $this->get_accessible_method( $site_status, 'check_if_tag_exists' );

		$result = $check_if_tag_exists->invokeArgs( $site_status, array( $this->analytics_4, self::get_google_tag_script( 'G-NGXXXX' ) ) );

		$this->assertEquals( '<li><strong>Analytics</strong>: Tag detected and placed by Site Kit.</li>', $result, 'Analytics tag in Site Kit\'s Google tag should be attributed to Site Kit.' );
	}

	public function test_check_if_tag_exists__has_tag_placed_no_sitekit_headers() {
		$this->analytics_4->get_settings()->merge( array( 'measurementID' => 'G-NGXXXX' ) );

		$site_status = $this->tag_placement;

		$check_if_tag_exists = $this->get_accessible_method( $site_status, 'check_if_tag_exists' );

		// Silence the WordPress.WP.EnqueuedResources.NonEnqueuedScript linter error.
		// phpcs:disable WordPress.WP.EnqueuedResources.NonEnqueuedScript
		$response_body = "<html lang=\"en-US\"> \n
			<head> \n
			<meta charset=\"UTF-8\" /> \n
			<script src=\"https://www.googletagmanager.com/gtag/js?id=G-55555\" id=\"google_gtagjs-js\" async></script> \n
			<script id=\"google_gtagjs-js-after\"> \n
			window.dataLayer = window.dataLayer || [];function gtag(){dataLayer.push(arguments);} \n
			gtag(\"config\", \"G-NGXXXX\"); \n
			</script>; \n
			....
		";
		// phpcs:enable WordPress.WP.EnqueuedResources.NonEnqueuedScript

		$result = $check_if_tag_exists->invokeArgs( $site_status, array( $this->analytics_4, $response_body ) );

		$this->assertEquals( '<li><strong>Analytics</strong>: Tag detected but could not verify that Site Kit placed the tag.</li>', $result, 'Analytics tag in a script that sets no Site Kit developer ID should be reported as unattributed.' );
	}

	/**
	 * @dataProvider data_placed_by_site_kit
	 *
	 * @param string $module_class Module class name.
	 * @param array  $settings     Module settings.
	 * @param bool   $gateway      Whether Google tag gateway is active.
	 * @param string $content      Page content.
	 * @param string $expected     Expected result line.
	 */
	public function test_check_if_tag_exists__placed_by_site_kit( $module_class, $settings, $gateway, $content, $expected ) {
		$this->assert_tag_placement_result( $module_class, $settings, $gateway, $content, $expected );
	}

	public function data_placed_by_site_kit() {
		// phpcs:disable WordPress.WP.EnqueuedResources.NonEnqueuedScript -- Page HTML for the tag check to read.
		return array(
			'the attribute in double quotes'            => array(
				AdSense::class,
				array( 'clientID' => 'ca-pub-1234567890' ),
				false,
				'<script async src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-1234567890" crossorigin="anonymous" data-googlesitekit-tag="ca-pub-1234567890"></script>',
				'<li><strong>AdSense</strong>: Tag detected and placed by Site Kit.</li>',
			),
			'the attribute in single quotes'            => array(
				AdSense::class,
				array( 'clientID' => 'ca-pub-1234567890' ),
				false,
				"<script async src='https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-1234567890' crossorigin='anonymous' data-googlesitekit-tag='ca-pub-1234567890'></script>",
				'<li><strong>AdSense</strong>: Tag detected and placed by Site Kit.</li>',
			),
			'the attribute with no quotes'              => array(
				AdSense::class,
				array( 'clientID' => 'ca-pub-1234567890' ),
				false,
				'<script async src=https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-1234567890 crossorigin=anonymous data-googlesitekit-tag=ca-pub-1234567890></script>',
				'<li><strong>AdSense</strong>: Tag detected and placed by Site Kit.</li>',
			),
			'Sign in with Google by its attribute'      => array(
				Sign_In_With_Google::class,
				array( 'clientID' => '1234567890-abc.apps.googleusercontent.com' ),
				false,
				'<script src="https://accounts.google.com/gsi/client" data-googlesitekit-tag="1234567890-abc.apps.googleusercontent.com"></script>',
				'<li><strong>Sign in with Google</strong>: Tag detected and placed by Site Kit.</li>',
			),
			'Reader Revenue Manager by its attribute'   => array(
				Reader_Revenue_Manager::class,
				array( 'publicationID' => 'CAowABC123' ),
				false,
				'<script data-googlesitekit-tag="CAowABC123" src="https://news.google.com/swg/js/v1/swg-basic.js" id="google_swgjs-js" async data-wp-strategy="async"></script>',
				'<li><strong>Reader Revenue Manager</strong>: Tag detected and placed by Site Kit.</li>',
			),
			'Tag Manager by the attribute of its web container' => array(
				Tag_Manager::class,
				array(
					'containerID'    => 'GTM-WEB1234',
					'ampContainerID' => 'GTM-AMP1234',
				),
				false,
				"<script data-googlesitekit-tag=\"GTM-WEB1234\">( function( w, d, s, l, i ) { w[l] = w[l] || []; } )( window, document, 'script', 'dataLayer', 'GTM-WEB1234' );</script>",
				'<li><strong>Tag Manager</strong>: Tag detected and placed by Site Kit.</li>',
			),
			'Tag Manager by the attribute of its AMP container' => array(
				Tag_Manager::class,
				array(
					'containerID'    => 'GTM-WEB1234',
					'ampContainerID' => 'GTM-AMP1234',
				),
				false,
				'<amp-analytics config="https://www.googletagmanager.com/amp.json?id=GTM-AMP1234" data-credentials="include" data-googlesitekit-tag="GTM-AMP1234"><script type="application/json">{"optoutElementId":"__gaOptOutExtension"}</script></amp-analytics>',
				'<li><strong>Tag Manager</strong>: Tag detected and placed by Site Kit.</li>',
			),
			'Analytics by the attribute of its AMP tag' => array(
				Analytics_4::class,
				array( 'measurementID' => 'G-1234567' ),
				false,
				'<amp-analytics type="gtag" data-credentials="include" data-googlesitekit-tag="G-1234567"><script type="application/json">{"vars":{"gtag_id":"G-1234567"}}</script></amp-analytics>',
				'<li><strong>Analytics</strong>: Tag detected and placed by Site Kit.</li>',
			),
			'Analytics by its Google tag ID'            => array(
				Analytics_4::class,
				array(
					'measurementID' => 'G-1234567',
					'googleTagID'   => 'GT-ABC1234',
				),
				false,
				self::get_google_tag_script( 'GT-ABC1234' ),
				'<li><strong>Analytics</strong>: Tag detected and placed by Site Kit.</li>',
			),
			'Analytics in a Google tag that a plugin minified' => array(
				Analytics_4::class,
				array( 'measurementID' => 'G-1234567' ),
				false,
				"<script>window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments)}gtag('js',new Date);gtag('set','developer_id.dZTNiMT',!0);gtag('config','G-1234567',{'googlesitekit_post_type':'post'});</script>",
				'<li><strong>Analytics</strong>: Tag detected and placed by Site Kit.</li>',
			),
			'Ads with Google tag gateway off'           => array(
				Ads::class,
				array( 'conversionID' => 'AW-123456789' ),
				false,
				self::get_google_tag_script( 'AW-123456789' ),
				'<li><strong>Ads</strong>: Tag detected and placed by Site Kit.</li>',
			),
			'Ads with Google tag gateway on'            => array(
				Ads::class,
				array( 'conversionID' => 'AW-123456789' ),
				true,
				self::get_google_tag_script( 'AW-123456789', true ),
				'<li><strong>Ads</strong>: Tag detected and placed by Site Kit.</li>',
			),
			'Tag Manager with Google tag gateway on'    => array(
				Tag_Manager::class,
				array( 'containerID' => 'GTM-WEB1234' ),
				true,
				self::get_google_tag_script( 'GTM-WEB1234', true ),
				'<li><strong>Tag Manager</strong>: Tag detected and placed by Site Kit.</li>',
			),
		);
		// phpcs:enable WordPress.WP.EnqueuedResources.NonEnqueuedScript
	}

	/**
	 * @dataProvider data_not_placed_by_site_kit
	 *
	 * @param string $module_class Module class name.
	 * @param array  $settings     Module settings.
	 * @param bool   $gateway      Whether Google tag gateway is active.
	 * @param string $content      Page content.
	 * @param string $expected     Expected result line.
	 */
	public function test_check_if_tag_exists__not_placed_by_site_kit( $module_class, $settings, $gateway, $content, $expected ) {
		$this->assert_tag_placement_result( $module_class, $settings, $gateway, $content, $expected );
	}

	public function data_not_placed_by_site_kit() {
		// phpcs:disable WordPress.WP.EnqueuedResources.NonEnqueuedScript -- Page HTML for the tag check to read.
		return array(
			'another ID in the attribute'                 => array(
				AdSense::class,
				array( 'clientID' => 'ca-pub-1234567890' ),
				false,
				'<script async src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-9876543210" data-googlesitekit-tag="ca-pub-9876543210"></script>',
				'<li><strong>AdSense</strong>: Tag detected but could not verify that Site Kit placed the tag.</li>',
			),
			'a longer ID in the attribute'                => array(
				AdSense::class,
				array( 'clientID' => 'ca-pub-123' ),
				false,
				'<script async src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-1234" data-googlesitekit-tag="ca-pub-1234"></script>',
				'<li><strong>AdSense</strong>: Tag detected but could not verify that Site Kit placed the tag.</li>',
			),
			'a longer ID in the attribute with no quotes' => array(
				AdSense::class,
				array( 'clientID' => 'ca-pub-123' ),
				false,
				'<script async src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-1234" data-googlesitekit-tag=ca-pub-1234></script>',
				'<li><strong>AdSense</strong>: Tag detected but could not verify that Site Kit placed the tag.</li>',
			),
			'a longer ID in the Google tag'               => array(
				Analytics_4::class,
				array( 'measurementID' => 'G-123' ),
				false,
				self::get_google_tag_script( 'G-1234' ),
				'<li><strong>Analytics</strong>: Tag detected but could not verify that Site Kit placed the tag.</li>',
			),
			'Tag Manager in the Google tag with gateway off' => array(
				Tag_Manager::class,
				array( 'containerID' => 'GTM-WEB1234' ),
				false,
				self::get_google_tag_script( 'GTM-WEB1234' ),
				'<li><strong>Tag Manager</strong>: Tag detected but could not verify that Site Kit placed the tag.</li>',
			),
			'Sign in with Google with comments and no attribute' => array(
				Sign_In_With_Google::class,
				array( 'clientID' => '1234567890-abc.apps.googleusercontent.com' ),
				false,
				"<!-- Sign in with Google button added by Site Kit -->\n<script src=\"https://accounts.google.com/gsi/client\"></script>\n<!-- End Sign in with Google button added by Site Kit -->",
				'<li><strong>Sign in with Google</strong>: No tag detected.</li>',
			),
			'an empty attribute while the AMP container ID is empty' => array(
				Tag_Manager::class,
				array(
					'containerID'    => 'GTM-WEB1234',
					'ampContainerID' => '',
				),
				false,
				'<script data-googlesitekit-tag=""></script>',
				'<li><strong>Tag Manager</strong>: No tag detected.</li>',
			),
			'an empty config call while the Google tag ID is empty' => array(
				Analytics_4::class,
				array(),
				false,
				self::get_google_tag_script( '' ),
				'<li><strong>Analytics</strong>: No tag detected.</li>',
			),
			'an attribute ID with other characters in the place of its dots' => array(
				Sign_In_With_Google::class,
				array( 'clientID' => '1234567890-abc.apps.googleusercontent.com' ),
				false,
				'<script src="https://example.org/sign-in.js" data-googlesitekit-tag="1234567890-abcXappsXgoogleusercontentXcom"></script>',
				'<li><strong>Sign in with Google</strong>: No tag detected.</li>',
			),
			'a Google tag ID with another character in the place of its dot' => array(
				Tag_Manager::class,
				array( 'containerID' => 'GTM-AB.CD' ),
				true,
				self::get_google_tag_script( 'GTM-ABXCD', true ),
				'<li><strong>Tag Manager</strong>: Tag detected but could not verify that Site Kit placed the tag.</li>',
			),
			'the Ads ID in another command of the Google tag' => array(
				Ads::class,
				array( 'conversionID' => 'AW-123456789' ),
				false,
				"<script id=\"google_gtagjs-js-after\">\n"
					. "window.dataLayer = window.dataLayer || [];function gtag(){dataLayer.push(arguments);}\n"
					. "gtag(\"event\",\"conversion\",{\"send_to\":\"AW-123456789\"});\n"
					. "gtag(\"js\", new Date());\n"
					. "gtag(\"set\", \"developer_id.dZTNiMT\", true);\n"
					. "gtag(\"config\", \"G-1234567\");\n"
					. "</script>\n",
				'<li><strong>Ads</strong>: No tag detected.</li>',
			),
		);
		// phpcs:enable WordPress.WP.EnqueuedResources.NonEnqueuedScript
	}

	public function test_check_if_tag_exists__comments_in_another_language_than_the_admin() {
		$this->analytics_4->get_settings()->merge( array( 'measurementID' => 'G-1234567' ) );

		// The admin reads Site Kit in German, while the page has the comments in French.
		add_filter(
			'gettext',
			function ( $translation, $text, $domain ) {
				if ( 'google-site-kit' === $domain && 'Google %s snippet added by Site Kit' === $text ) {
					return 'Google %s-Snippet von Site Kit hinzugefügt';
				}

				return $translation;
			},
			10,
			3
		);

		$content = "<!-- Extrait Google Analytics ajouté par Site Kit -->\n" . self::get_google_tag_script( 'G-1234567' );

		$check_if_tag_exists = $this->get_accessible_method( $this->tag_placement, 'check_if_tag_exists' );

		$this->assertEquals(
			'<li><strong>Analytics</strong>: Tag detected and placed by Site Kit.</li>',
			$check_if_tag_exists->invoke( $this->tag_placement, $this->analytics_4, $content ),
			'A comment in another language than the admin\'s should not change the result.'
		);
	}

	public function test_check_if_tag_exists__site_kit_google_tag() {
		$ads = $this->create_module( Ads::class );
		$this->analytics_4->get_settings()->merge(
			array(
				'measurementID' => 'G-1234567',
				'useSnippet'    => true,
			)
		);
		$ads->get_settings()->merge( array( 'conversionID' => 'AW-123456789' ) );

		$head_html = $this->render_google_tag( array( $this->analytics_4, $ads ) );

		$check_if_tag_exists = $this->get_accessible_method( $this->tag_placement, 'check_if_tag_exists' );

		$this->assertEquals(
			'<li><strong>Analytics</strong>: Tag detected and placed by Site Kit.</li>',
			$check_if_tag_exists->invoke( $this->tag_placement, $this->analytics_4, $head_html ),
			'Analytics should be placed by Site Kit through Site Kit\'s Google tag.'
		);
		$this->assertEquals(
			'<li><strong>Ads</strong>: Tag detected and placed by Site Kit.</li>',
			$check_if_tag_exists->invoke( $this->tag_placement, $ads, $head_html ),
			'Ads should be placed by Site Kit through Site Kit\'s Google tag.'
		);
		$this->assertStringNotContainsString( 'data-googlesitekit-tag', $head_html, 'The Google tag scripts should have no tag ID attribute.' );
		$this->assertStringContainsString( '<!-- Google Analytics snippet added by Site Kit -->', $head_html, 'The Analytics script should keep its comment.' );
		$this->assertStringContainsString( '<!-- Google Ads snippet added by Site Kit -->', $head_html, 'The Ads script should keep its comment.' );
	}

	public function test_check_if_tag_exists__tag_ids_another_plugin_adds_to_the_google_tag() {
		$ads = $this->create_module( Ads::class );
		$this->analytics_4->get_settings()->merge(
			array(
				'measurementID' => 'G-1234567',
				'useSnippet'    => true,
			)
		);
		$ads->get_settings()->merge( array( 'conversionID' => 'AW-123456789' ) );

		// Site Kit places neither tag, and another plugin adds its own IDs to Site Kit's Google tag.
		add_filter( 'googlesitekit_analytics-4_tag_blocked', '__return_true' );
		add_filter( 'googlesitekit_ads_tag_blocked', '__return_true' );
		add_action(
			'googlesitekit_setup_gtag',
			function ( GTag $gtag ) {
				$gtag->add_tag( 'G-7654321' );
				$gtag->add_tag( 'AW-987654321' );
			}
		);

		$head_html = $this->render_google_tag( array( $this->analytics_4, $ads ) );

		$this->assertStringContainsString( 'gtag("config", "AW-987654321")', $head_html, 'Site Kit\'s Google tag should configure the ID the other plugin adds.' );

		$check_if_tag_exists = $this->get_accessible_method( $this->tag_placement, 'check_if_tag_exists' );

		$this->assertEquals(
			'<li><strong>Analytics</strong>: Tag detected but could not verify that Site Kit placed the tag.</li>',
			$check_if_tag_exists->invoke( $this->tag_placement, $this->analytics_4, $head_html ),
			'Another plugin\'s Analytics ID should not make Analytics placed by Site Kit.'
		);
		$this->assertEquals(
			'<li><strong>Ads</strong>: Tag detected but could not verify that Site Kit placed the tag.</li>',
			$check_if_tag_exists->invoke( $this->tag_placement, $ads, $head_html ),
			'Another plugin\'s Ads ID should not make Ads placed by Site Kit.'
		);
	}

	/**
	 * Asserts the result line of the Tag Placement test for a module.
	 *
	 * @since n.e.x.t
	 *
	 * @param string $module_class Module class name.
	 * @param array  $settings     Module settings.
	 * @param bool   $gateway      Whether Google tag gateway is active.
	 * @param string $content      Page content.
	 * @param string $expected     Expected result line.
	 */
	private function assert_tag_placement_result( $module_class, $settings, $gateway, $content, $expected ) {
		if ( $gateway ) {
			$this->enable_feature( 'googleTagGateway' );

			$google_tag_gateway_settings = new Google_Tag_Gateway_Settings( $this->options );
			$google_tag_gateway_settings->register();
			$google_tag_gateway_settings->set(
				array(
					'isEnabled'             => true,
					'isGTGHealthy'          => true,
					'isScriptAccessEnabled' => true,
				)
			);
		}

		$module = $this->create_module( $module_class );
		$module->get_settings()->merge( $settings );

		$check_if_tag_exists = $this->get_accessible_method( $this->tag_placement, 'check_if_tag_exists' );

		$this->assertEquals(
			$expected,
			$check_if_tag_exists->invoke( $this->tag_placement, $module, $content ),
			'The Tag Placement test should report the expected result for the module.'
		);
	}

	/**
	 * Creates a module with its settings registered.
	 *
	 * @since n.e.x.t
	 *
	 * @param string $module_class Module class name.
	 * @return Module Module instance.
	 */
	private function create_module( $module_class ) {
		$module = new $module_class( $this->context, $this->options, $this->user_options, $this->authentication );
		$module->get_settings()->register();

		return $module;
	}

	/**
	 * Renders the head of a page with Site Kit's Google tag and the given modules' tags.
	 *
	 * @since n.e.x.t
	 *
	 * @param array $modules Modules whose tags to register.
	 * @return string Head HTML.
	 */
	private function render_google_tag( $modules ) {
		remove_all_actions( 'wp_enqueue_scripts' );
		// Prevent test from failing in CI with deprecation notice.
		remove_action( 'wp_print_styles', 'print_emoji_styles' );

		( new GTag( $this->options ) )->register();

		foreach ( $modules as $module ) {
			$module->register_tag();
		}

		return $this->capture_action( 'wp_head' );
	}

	/**
	 * Gets Site Kit's Google tag for one tag ID, as WordPress prints it.
	 *
	 * @since n.e.x.t
	 *
	 * @param string $tag_id  Tag ID of the `config` call.
	 * @param bool   $gateway Whether Google tag gateway is active.
	 * @return string Script elements of the Google tag.
	 */
	private static function get_google_tag_script( $tag_id, $gateway = false ) {
		$src = $gateway
			? "https://example.org/wp-content/plugins/google-site-kit/gtg/measurement.php?id={$tag_id}"
			: "https://www.googletagmanager.com/gtag/js?id={$tag_id}";

		$developer_ids = 'gtag("set", "developer_id.dZTNiMT", true);';
		if ( $gateway ) {
			$developer_ids .= "\n" . 'gtag("set", "developer_id.dZmZmYj", true);';
		}

		// phpcs:disable WordPress.WP.EnqueuedResources.NonEnqueuedScript -- Page HTML for the tag check to read.
		return "<script src=\"{$src}\" id=\"google_gtagjs-js\" async></script>\n"
			. "<script id=\"google_gtagjs-js-after\">\n"
			. "window.dataLayer = window.dataLayer || [];function gtag(){dataLayer.push(arguments);}\n"
			. "gtag(\"js\", new Date());\n"
			. "{$developer_ids}\n"
			. "gtag(\"config\", \"{$tag_id}\");\n"
			. "</script>\n";
		// phpcs:enable WordPress.WP.EnqueuedResources.NonEnqueuedScript
	}
}
