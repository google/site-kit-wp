<?php
/**
 * ContextTest class.
 *
 * @package   Google\Site_Kit
 * @copyright 2021 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 */

namespace Google\Site_Kit\Tests;

use Google\Site_Kit\Context;
use Google\Site_Kit\Core\Admin\Screens;
use Google\Site_Kit\Core\Authentication\Authentication;
use Google\Site_Kit\Core\Permissions\Permissions;
use Google\Site_Kit\Core\Util\Entity;

/**
 * @group Root
 */
class ContextTest extends TestCase {
	use Fake_Site_Connection_Trait;

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

	public function test_get_cannonical_home_url() {
		$context = new Context( GOOGLESITEKIT_PLUGIN_MAIN_FILE );

		$home_url = home_url();

		// By default, the cannonical home URL should match `home_url()`.
		$this->assertEquals( $home_url, $context->get_canonical_home_url() );

		$url_filter = function () {
			return 'https://test.com';
		};

		// Make sure that the filter is applied.
		add_filter( 'googlesitekit_canonical_home_url', $url_filter );
		$this->assertEquals( 'https://test.com', $context->get_canonical_home_url() );
		remove_filter( 'googlesitekit_canonical_home_url', $url_filter );

		$trailing_slash_url_filter = function () {
			return 'https://test.com/';
		};

		// It returns a URL with a trailing slash, if the filter sets one.
		add_filter( 'googlesitekit_canonical_home_url', $trailing_slash_url_filter );
		$this->assertEquals( 'https://test.com/', $context->get_canonical_home_url() );
	}

	public function test_get_reference_site_url() {
		$context = new Context( GOOGLESITEKIT_PLUGIN_MAIN_FILE );

		$home_url = $context->get_canonical_home_url();

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

	public function test_get_reference_entity__in_admin_context() {
		$user = $this->factory()->user->create_and_get( array( 'role' => 'administrator' ) );
		wp_set_current_user( $user->ID );
		// The only way to change the current user in bootstrapped Site Kit class instances (e.g. Permissions)
		do_action( 'wp_login', $user->user_login, $user );

		$context = new Context( GOOGLESITEKIT_PLUGIN_MAIN_FILE, new MutableInput() );
		// Fake setup and authentication for access to dashboard.
		$this->fake_proxy_site_connection();
		remove_all_filters( 'googlesitekit_setup_complete' );
		$authentication = new Authentication( $context );
		$authentication->verification()->set( true );
		$authentication->get_oauth_client()->set_token( array( 'access_token' => 'test-access-token' ) );
		$this->assertTrue( current_user_can( Permissions::VIEW_DASHBOARD ) );

		// Set admin context.
		set_current_screen( 'dashboard' );
		$this->assertTrue( is_admin() );

		// The reference entity is null by default.
		$this->assertNull( $context->get_reference_entity() );

		// Set up a global public post.
		$global_post_id = $this->factory()->post->create();
		( new \WP_Query( array( 'p' => $global_post_id ) ) )->the_post();
		$this->assertEquals( $global_post_id, get_post()->ID );
		$this->assertNull( $context->get_reference_entity() );

		// The Site Kit dashboard only references the entity from the `permaLink` query parameter.
		$public_post_id = $this->factory()->post->create();
		set_current_screen( 'toplevel_page_googlesitekit-dashboard' );
		$_GET['page'] = 'googlesitekit-dashboard';
		$this->assertNull( $context->get_reference_entity() );
		// We can probably safely assume that 987654 is not a valid post ID in the test environment, but let's make sure.
		$this->assertFalse( \WP_Post::get_instance( 987654 ) );
		$_GET['permaLink'] = add_query_arg( 'p', '987654', home_url( '/' ) );
		$this->assertNull( $context->get_reference_entity() );
		$_GET['permaLink'] = get_permalink( $public_post_id );
		$entity            = $context->get_reference_entity();
		$this->assertInstanceOf( Entity::class, $entity );
		$this->assertEquals( 'post', $entity->get_type() );
		$this->assertEquals( $public_post_id, $entity->get_id() );
		$this->assertEquals( get_permalink( $public_post_id ), $entity->get_url() );
		unset( $_GET['page'], $_GET['permaLink'] );

		// The post edit screen should reference the global post.
		set_current_screen( 'post.php' );
		$entity = $context->get_reference_entity();
		$this->assertInstanceOf( Entity::class, $entity );
		$this->assertEquals( 'post', $entity->get_type() );
		$this->assertEquals( $global_post_id, $entity->get_id() );
		$this->assertEquals( get_permalink( $global_post_id ), $entity->get_url() );
	}

	public function test_get_reference_entity__in_frontend_context() {
		$context = new Context( GOOGLESITEKIT_PLUGIN_MAIN_FILE );

		// By default, is_admin should be false.
		$this->assertFalse( is_admin() );

		// Since we haven't gone anywhere, the entity should be null.
		$this->assertNull( $context->get_reference_entity() );

		// Go to home page, which is the blog home by default.
		$this->go_to( '/' );
		$entity = $context->get_reference_entity();
		$this->assertInstanceOf( Entity::class, $entity );
		$this->assertEquals( 'blog', $entity->get_type() );
		$this->assertEquals( 0, $entity->get_id() );
		$this->assertEquals( home_url(), $entity->get_url() );

		// Use a dedicated page for the blog home.
		$blog_home_id = $this->factory()->post->create( array( 'post_type' => 'page' ) );
		update_option( 'show_on_front', 'page' );
		update_option( 'page_for_posts', $blog_home_id );
		$this->go_to( get_permalink( $blog_home_id ) );
		$entity = $context->get_reference_entity();
		$this->assertInstanceOf( Entity::class, $entity );
		$this->assertEquals( 'blog', $entity->get_type() );
		$this->assertEquals( $blog_home_id, $entity->get_id() );
		$this->assertEquals( get_permalink( $blog_home_id ), $entity->get_url() );

		// Use a dedicated page for the home/front page.
		$front_page_id = $this->factory()->post->create( array( 'post_type' => 'page' ) );
		update_option( 'show_on_front', 'page' );
		update_option( 'page_on_front', $front_page_id );
		$this->go_to( get_permalink( $front_page_id ) );
		$entity = $context->get_reference_entity();
		$this->assertInstanceOf( Entity::class, $entity );
		$this->assertEquals( 'post', $entity->get_type() );
		$this->assertEquals( $front_page_id, $entity->get_id() );
		$this->assertEquals( get_permalink( $front_page_id ), $entity->get_url() );

		// Entities can only be retrieved for public posts.
		$non_public_post_id = $this->factory()->post->create( array( 'post_status' => 'private' ) );
		$this->go_to( get_permalink( $non_public_post_id ) );
		$this->assertNull( $context->get_reference_entity() );
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
			function () {
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

	public function test_get_locale() {

		// Set locale site and user.
		$original_locale   = $GLOBALS['locale'];
		$GLOBALS['locale'] = 'pt_PT_ao90';
		$user              = wp_get_current_user();
		$user->locale      = 'nl_NL_formal';

		$context = new Context( GOOGLESITEKIT_PLUGIN_MAIN_FILE );
		$locale  = $context->get_locale();

		$this->assertEquals( 'pt_PT_ao90', $context->get_locale() );
		$this->assertEquals( 'pt_PT_ao90', $context->get_locale( 'site' ) );
		$this->assertEquals( 'pt', $context->get_locale( 'site', 'language-code' ) );
		$this->assertEquals( 'pt_PT', $context->get_locale( 'site', 'language-variant' ) );
		$this->assertEquals( 'nl_NL_formal', $context->get_locale( 'user' ) );
		$this->assertEquals( 'nl', $context->get_locale( 'user', 'language-code' ) );
		$this->assertEquals( 'nl_NL', $context->get_locale( 'user', 'language-variant' ) );

		// Change site locale
		$GLOBALS['locale'] = 'te';
		$this->assertEquals( 'te', $context->get_locale() );
		$this->assertEquals( 'te', $context->get_locale( 'site' ) );
		$this->assertEquals( 'te', $context->get_locale( 'site', 'language-code' ) );

		// Reset locale.
		$GLOBALS['locale'] = $original_locale;
		unset( $user->locale );
	}
}
