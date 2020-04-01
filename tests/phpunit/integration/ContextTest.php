<?php
/**
 * ContextTest class.
 *
 * @package   Google\Site_Kit
 * @copyright 2019 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 */

namespace Google\Site_Kit\Tests;

use Google\Site_Kit\Context;
use Google\Site_Kit\Core\Admin\Screens;

/**
 * @group Root
 */
class ContextTest extends TestCase {

	public function test_path() {
		$context    = new Context( GOOGLESITEKIT_PLUGIN_MAIN_FILE );
		$plugin_dir = dirname( GOOGLESITEKIT_PLUGIN_MAIN_FILE );

		$this->assertEquals( $plugin_dir . '/', $context->path() );
		$this->assertEquals( $plugin_dir . '/', $context->path( '' ) );
		$this->assertEquals( $plugin_dir . '/relative/path', $context->path( 'relative/path' ) );
		$this->assertEquals( $plugin_dir . '/relative/path', $context->path( '/relative/path' ) );
		$this->assertEquals( $plugin_dir . '/relative/path', $context->path( '///relative/path' ) );
		$this->assertEquals( $plugin_dir . '/relative/path/', $context->path( 'relative/path/' ) );
		$this->assertEquals( $plugin_dir . '/relative/path.php', $context->path( 'relative/path.php' ) );
	}

	public function test_url() {
		$context    = new Context( GOOGLESITEKIT_PLUGIN_MAIN_FILE );
		$plugin_url = plugins_url( '', GOOGLESITEKIT_PLUGIN_MAIN_FILE );

		$this->assertEquals( $plugin_url . '/', $context->url() );
		$this->assertEquals( $plugin_url . '/', $context->url( '' ) );
		$this->assertEquals( $plugin_url . '/relative/path', $context->url( 'relative/path' ) );
		$this->assertEquals( $plugin_url . '/relative/path', $context->url( '/relative/path' ) );
		$this->assertEquals( $plugin_url . '/relative/path', $context->url( '///relative/path' ) );
		$this->assertEquals( $plugin_url . '/relative/path/', $context->url( 'relative/path/' ) );
		$this->assertEquals( $plugin_url . '/relative/path.css', $context->url( 'relative/path.css' ) );
	}

	public function test_filter_input() {
		$this->assertArrayNotHasKey( 'foo', $_GET );
		$context = new Context( GOOGLESITEKIT_PLUGIN_MAIN_FILE );

		$_GET['foo'] = 'bar';
		// By default, everything will be null using the default Input since filter_input
		// ignores runtime changes.
		$this->assertNull( $context->input()->filter( INPUT_GET, 'foo' ) );

		// Use MutableInput to allow for runtime changes with the same API.
		$context = new Context( GOOGLESITEKIT_PLUGIN_MAIN_FILE, new MutableInput() );

		$this->assertEquals( 'bar', $context->input()->filter( INPUT_GET, 'foo' ) );
		$this->assertEquals( 'bar', $context->input()->filter( INPUT_GET, 'foo' ) );

		// All the same filter flags work.
		$this->assertFalse( $context->input()->filter( INPUT_GET, 'foo', FILTER_VALIDATE_BOOLEAN ) );

		$_GET['foo'] = true;

		$this->assertTrue( $context->input()->filter( INPUT_GET, 'foo', FILTER_VALIDATE_BOOLEAN ) );

		$_GET['dirty'] = '<script>dirt</script>';
		$this->assertEquals( 'dirt', $context->input()->filter( INPUT_GET, 'dirty', FILTER_SANITIZE_STRING ) );
	}

	public function test_admin_url() {
		$context = new Context( GOOGLESITEKIT_PLUGIN_MAIN_FILE );

		$admin_url = trailingslashit( admin_url() );

		$get_query_params = function ( $url ) {
			wp_parse_str( parse_url( $url, PHP_URL_QUERY ), $query_vars );

			return $query_vars;
		};

		$this->assertEquals(
			$admin_url . 'admin.php?page=' . Screens::PREFIX . 'dashboard',
			$context->admin_url()
		);
		$this->assertEquals(
			$admin_url . 'admin.php?page=' . Screens::PREFIX . 'slug',
			$context->admin_url( 'slug' )
		);

		// Order of query parameters does not matter, so we won't make assertions about that with multiple.
		$admin_url_with_params = $context->admin_url( 'slug', array( 'foo' => 'bar' ) );
		$this->assertStringStartsWith( $admin_url . 'admin.php?', $admin_url_with_params );
		$this->assertEqualSetsWithIndex(
			array(
				'page' => Screens::PREFIX . 'slug',
				'foo'  => 'bar',
			),
			$get_query_params( $admin_url_with_params )
		);

		// Make sure that the page parameter is not overridden by extra query params.
		$admin_url_with_page_param = $context->admin_url(
			'slug',
			array(
				'foo'  => 'bar',
				'page' => 'different',
			) 
		);
		$this->assertEqualSetsWithIndex(
			array(
				'page' => Screens::PREFIX . 'slug',
				'foo'  => 'bar',
			),
			$get_query_params( $admin_url_with_page_param )
		);
	}

	public function test_is_network_mode() {
		$context = new Context( GOOGLESITEKIT_PLUGIN_MAIN_FILE );
		$this->assertEquals( $context->is_network_active(), $context->is_network_mode() );
	}

	public function test_get_reference_site_url() {
		$context = new Context( GOOGLESITEKIT_PLUGIN_MAIN_FILE );

		$home_url = home_url();

		// By default, the reference site_url uses the home_url
		$this->assertEquals( $home_url, $context->get_reference_site_url() );

		$other_url_filter = function () {
			return 'https://test.com';
		};

		// If the filtered value returns a non-empty value, it takes precedence.
		add_filter( 'googlesitekit_site_url', $other_url_filter );
		$this->assertEquals( 'https://test.com', $context->get_reference_site_url() );
		remove_filter( 'googlesitekit_site_url', $other_url_filter );

		$trailing_slash_url = function () {
			return 'https://test.com/';
		};

		// It always returns a URL without a trailing slash.
		add_filter( 'googlesitekit_site_url', $trailing_slash_url );
		$this->assertEquals( 'https://test.com', $context->get_reference_site_url() );
		remove_filter( 'googlesitekit_site_url', $trailing_slash_url );

		// If the filtered value returns an empty value, it falls back to the home_url.
		add_filter( 'googlesitekit_site_url', '__return_empty_string' );
		$this->assertEquals( $home_url, $context->get_reference_site_url() );
	}

	public function test_get_reference_permalink() {
		remove_all_filters( 'googlesitekit_site_url' );
		$this->set_permalink_structure( '/%postname%/' );
		flush_rewrite_rules();

		$context = new Context( GOOGLESITEKIT_PLUGIN_MAIN_FILE );

		$post_id = self::factory()->post->create( array( 'post_title' => 'hello-world' ) );
		$page_id = self::factory()->post->create(
			array(
				'post_title' => 'homepage',
				'post_type'  => 'page',
			) 
		);
		self::factory()->category->create( array( 'slug' => 'postcategory' ) );

		$this->go_to( '/category/postcategory' );
		$this->assertFalse( $context->get_reference_permalink() );

		update_option( 'show_on_front', 'page' );
		update_option( 'page_on_front', $page_id );

		$this->go_to( '/hello-world' );
		$this->assertEquals( get_permalink(), $context->get_reference_permalink() );

		$other_url_filter = function () {
			return 'https://test.com/';
		};

		// If the filtered value returns a non-empty value, it takes precedence.
		add_filter( 'googlesitekit_site_url', $other_url_filter );

		$this->go_to( '/' );
		$this->assertEquals( 'https://test.com/', $context->get_reference_permalink() );
		$this->assertEquals( 'https://test.com/hello-world/', $context->get_reference_permalink( $post_id ) );
	}

	/**
	 * @group ms-excluded
	 */
	public function test_is_network_active() {
		if ( is_multisite() ) {
			$this->markTestSkipped( 'This test does not run on multisite.' );
		}

		$context = new Context( GOOGLESITEKIT_PLUGIN_MAIN_FILE );
		$this->assertFalse( $context->is_network_active() );
	}

	/**
	 * @group ms-required
	 */
	public function test_is_network_active_multisite() {
		if ( ! is_multisite() ) {
			$this->markTestSkipped( 'This test only runs on multisite.' );
		}

		$context = new Context( GOOGLESITEKIT_PLUGIN_MAIN_FILE );
		$this->assertFalse( $context->is_network_active() );

		// Fake plugin being network-active.
		add_filter(
			'pre_site_option_active_sitewide_plugins',
			function() {
				$plugin_basename = GOOGLESITEKIT_PLUGIN_BASENAME;
				return array( $plugin_basename => true );
			}
		);

		// Ensure the result is not re-calculated.
		$this->assertFalse( $context->is_network_active() );

		// Ensure re-checking evaluates as true.
		$context = new Context( GOOGLESITEKIT_PLUGIN_MAIN_FILE );
		$this->assertTrue( $context->is_network_active() );
	}
}
