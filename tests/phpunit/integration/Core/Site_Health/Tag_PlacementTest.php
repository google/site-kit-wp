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
use Google\Site_Kit\Core\Modules\Modules;
use Google\Site_Kit\Core\Site_Health\Tag_Placement;
use Google\Site_Kit\Core\Storage\Options;
use Google\Site_Kit\Core\Storage\User_Options;
use Google\Site_Kit\Modules\Analytics_4;
use Google\Site_Kit\Tests\TestCase;

/**
 * @group Util
 */
class Tag_PlacementTest extends TestCase {

	protected $original_wp_version;

	protected $tag_placement;

	protected $analytics_4;

	public function set_up() {
		parent::set_up();

		global $wp_version;

		$this->original_wp_version = $wp_version;

		$context        = new Context( GOOGLESITEKIT_PLUGIN_MAIN_FILE );
		$options        = new Options( $context );
		$user_options   = new User_Options( $context );
		$authentication = new Authentication( $context, $options, $user_options );
		$modules        = new Modules( $context, $options, $user_options, $authentication );

		$this->analytics_4   = new Analytics_4( $context, $options, $user_options, $authentication );
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

		$this->assertTrue( has_filter( 'site_status_tests' ) );
	}

	public function test_site_status_tests__wp_version_5_5() {
		global $wp_version;

		// Mock a version less than 5.6.
		$wp_version = '5.5';

		remove_all_filters( 'site_status_tests' );
		$this->tag_placement->register();

		$modified_tests = apply_filters( 'site_status_tests', array() );

		$this->assertArrayHasKey( 'direct', $modified_tests );
		$this->assertArrayHasKey( 'tag_placement', $modified_tests['direct'] );
		$this->assertIsArray( $modified_tests['direct']['tag_placement'] );
	}

	public function test_site_status_tests__wp_version_5_6_or_over() {
		global $wp_version;

		// Mock a version higher than 5.6.
		$wp_version = '6.0';

		remove_all_filters( 'site_status_tests' );
		$this->tag_placement->register();

		$modified_tests = apply_filters( 'site_status_tests', array() );

		$this->assertTrue( version_compare( $wp_version, '5.6', '>=' ) );
		$this->assertArrayHasKey( 'async', $modified_tests );
		$this->assertArrayHasKey( 'tag_placement', $modified_tests['async'] );
		$this->assertIsArray( $modified_tests['async']['tag_placement'] );
	}

	public function test_tag_placement_test__wp_version_bellow_5_6() {
		global $wp_version;

		// Mock a version less than 5.6.
		$wp_version = '5.5';

		$site_status = $this->tag_placement;
		$reflection  = new \ReflectionClass( get_class( $site_status ) );

		$check_if_tag_exists = $reflection->getMethod( 'tag_placement_test' );
		$check_if_tag_exists->setAccessible( true );

		$result = $check_if_tag_exists->invokeArgs( $site_status, array() );

		$this->assertEquals( '<p>This feature requires WordPress version 5.6 or higher</p>', $result['description'] );
	}

	public function test_get_active_modules() {
		$site_status = $this->tag_placement;
		$reflection  = new \ReflectionClass( get_class( $site_status ) );

		update_option(
			Modules::OPTION_ACTIVE_MODULES,
			array(
				'search-console',
				'pagespeed-insights',
				'adsense',
				'analytics-4',
			)
		);

		$get_active_modules = $reflection->getMethod( 'get_active_modules' );
		$get_active_modules->setAccessible( true );

		$result = $get_active_modules->invokeArgs( $site_status, array() );

		$this->assertEquals(
			array(
				'adsense',
				'analytics-4',
			),
			array_keys( $result )
		);

		update_option(
			Modules::OPTION_ACTIVE_MODULES,
			array(
				'search-console',
				'pagespeed-insights',
			)
		);

		$result = $get_active_modules->invokeArgs( $site_status, array() );

		$this->assertTrue( empty( $result ) );
	}

	public function test_check_if_tag_exists__no_tag() {
		$site_status = $this->tag_placement;
		$reflection  = new \ReflectionClass( get_class( $site_status ) );

		$check_if_tag_exists = $reflection->getMethod( 'check_if_tag_exists' );
		$check_if_tag_exists->setAccessible( true );

		$result = $check_if_tag_exists->invokeArgs( $site_status, array( $this->analytics_4, 'body content' ) );

		$this->assertEquals( '<li><strong>Analytics</strong>: No tag detected.</li>', $result );
	}

	public function test_check_if_tag_exists__has_tag_placed_by_sitekit() {
		$site_status = $this->tag_placement;
		$reflection  = new \ReflectionClass( get_class( $site_status ) );

		$check_if_tag_exists = $reflection->getMethod( 'check_if_tag_exists' );
		$check_if_tag_exists->setAccessible( true );

		// Silence the WordPress.WP.EnqueuedResources.NonEnqueuedScript lintern error.
		// phpcs:disable
		$response_body = "<html lang=\"en-US\"> \n
			<head> \n
			<meta charset=\"UTF-8\" /> \n
			<!-- Google Analytics snippet added by Site Kit -->
			<script src=\"https://www.googletagmanager.com/gtag/js?id=G-55555\" id=\"google_gtagjs-js\" async></script> \n
			<script id=\"google_gtagjs-js-after\"> \n
			window.dataLayer = window.dataLayer || [];function gtag(){dataLayer.push(arguments);} \n
			gtag(\"config\", \"G-NGXXXX\"); \n
			</script>; \n
			.....
		";
		// phpcs:enable

		$result = $check_if_tag_exists->invokeArgs( $site_status, array( $this->analytics_4, $response_body ) );

		$this->assertEquals( '<li><strong>Analytics</strong>: Tag detected and placed by Site Kit.</li>', $result );
	}

	public function test_check_if_tag_exists__has_tag_placed_no_sitekit_headers() {
		$site_status = $this->tag_placement;
		$reflection  = new \ReflectionClass( get_class( $site_status ) );

		$check_if_tag_exists = $reflection->getMethod( 'check_if_tag_exists' );
		$check_if_tag_exists->setAccessible( true );

		// Silence the WordPress.WP.EnqueuedResources.NonEnqueuedScript lintern error.
		// phpcs:disable
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
		// phpcs:enable

		$result = $check_if_tag_exists->invokeArgs( $site_status, array( $this->analytics_4, $response_body ) );

		$this->assertEquals( '<li><strong>Analytics</strong>: Tag detected but could not verify that Site Kit placed the tag.</li>', $result );
	}
}
