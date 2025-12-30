<?php
/**
 * ContextTest class.
 *
 * @package   Google\Site_Kit
 * @copyright 2021 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 * */

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

		$this->assertEquals( $plugin_dir . '/', $context->path(), 'Context path() should return plugin directory with trailing slash' );
		$this->assertEquals( $plugin_dir . '/', $context->path( '' ), 'Context path() with empty string should return plugin directory with trailing slash' );
		$this->assertEquals( $plugin_dir . '/relative/path', $context->path( 'relative/path' ), 'Context path() should correctly append relative path' );
		$this->assertEquals( $plugin_dir . '/relative/path', $context->path( '/relative/path' ), 'Context path() should handle paths with leading slash' );
		$this->assertEquals( $plugin_dir . '/relative/path', $context->path( '///relative/path' ), 'Context path() should handle paths with multiple leading slashes' );
		$this->assertEquals( $plugin_dir . '/relative/path/', $context->path( 'relative/path/' ), 'Context path() should preserve trailing slash in relative path' );
		$this->assertEquals( $plugin_dir . '/relative/path.php', $context->path( 'relative/path.php' ), 'Context path() should handle file paths correctly' );
	}

	public function test_url() {
		$context    = new Context( GOOGLESITEKIT_PLUGIN_MAIN_FILE );
		$plugin_url = plugins_url( '', GOOGLESITEKIT_PLUGIN_MAIN_FILE );

		$this->assertEquals( $plugin_url . '/', $context->url(), 'Context url() should return plugin URL with trailing slash' );
		$this->assertEquals( $plugin_url . '/', $context->url( '' ), 'Context url() with empty string should return plugin URL with trailing slash' );
		$this->assertEquals( $plugin_url . '/relative/path', $context->url( 'relative/path' ), 'Context url() should correctly append relative path' );
		$this->assertEquals( $plugin_url . '/relative/path', $context->url( '/relative/path' ), 'Context url() should handle paths with leading slash' );
		$this->assertEquals( $plugin_url . '/relative/path', $context->url( '///relative/path' ), 'Context url() should handle paths with multiple leading slashes' );
		$this->assertEquals( $plugin_url . '/relative/path/', $context->url( 'relative/path/' ), 'Context url() should preserve trailing slash in relative path' );
		$this->assertEquals( $plugin_url . '/relative/path.css', $context->url( 'relative/path.css' ), 'Context url() should handle file paths correctly' );
	}

	public function test_filter_input() {
		$this->assertArrayNotHasKey( 'foo', $_GET, 'Test should start with $_GET not containing "foo" key' );
		$context = new Context( GOOGLESITEKIT_PLUGIN_MAIN_FILE );

		$_GET['foo'] = 'bar';
		// By default, everything will be null using the default Input since filter_input
		// ignores runtime changes.
		$this->assertNull( $context->input()->filter( INPUT_GET, 'foo' ), 'Default Input should return null for runtime changes to $_GET' );

		// Use MutableInput to allow for runtime changes with the same API.
		$context = new Context( GOOGLESITEKIT_PLUGIN_MAIN_FILE, new MutableInput() );

		$this->assertEquals( 'bar', $context->input()->filter( INPUT_GET, 'foo' ), 'MutableInput should return the value for runtime changes to $_GET' );
		$this->assertEquals( 'bar', $context->input()->filter( INPUT_GET, 'foo' ), 'MutableInput should consistently return the same value' );

		// All the same filter flags work.
		$this->assertFalse( $context->input()->filter( INPUT_GET, 'foo', FILTER_VALIDATE_BOOLEAN ), 'String "bar" should not validate as boolean true' );

		$_GET['foo'] = true;

		$this->assertTrue( $context->input()->filter( INPUT_GET, 'foo', FILTER_VALIDATE_BOOLEAN ), 'Boolean true should validate as boolean true' );
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
			$context->admin_url(),
			'admin_url() without parameters should return URL to dashboard'
		);
		$this->assertEquals(
			$admin_url . 'admin.php?page=' . Screens::PREFIX . 'slug',
			$context->admin_url( 'slug' ),
			'admin_url() with slug parameter should return URL to that slug'
		);

		// Order of query parameters does not matter, so we won't make assertions about that with multiple.
		$admin_url_with_params = $context->admin_url( 'slug', array( 'foo' => 'bar' ) );
		$this->assertStringStartsWith( $admin_url . 'admin.php?', $admin_url_with_params, 'admin_url() with parameters should start with admin.php?' );
		$this->assertEqualSetsWithIndex(
			array(
				'page' => Screens::PREFIX . 'slug',
				'foo'  => 'bar',
			),
			$get_query_params( $admin_url_with_params ),
			'admin_url() with parameters should include both page and additional parameters'
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
			$get_query_params( $admin_url_with_page_param ),
			'admin_url() should not allow overriding the page parameter'
		);
	}

	public function test_is_network_mode() {
		$context = new Context( GOOGLESITEKIT_PLUGIN_MAIN_FILE );
		$this->assertEquals( $context->is_network_active(), $context->is_network_mode(), 'is_network_mode() should return the same value as is_network_active()' );
	}

	public function test_get_cannonical_home_url() {
		$context = new Context( GOOGLESITEKIT_PLUGIN_MAIN_FILE );

		$home_url = home_url();

		// By default, the cannonical home URL should match `home_url()`.
		$this->assertEquals( $home_url, $context->get_canonical_home_url(), 'get_canonical_home_url() should return home_url() by default' );

		$url_filter = function () {
			return 'https://test.com';
		};

		// Make sure that the filter is applied.
		add_filter( 'googlesitekit_canonical_home_url', $url_filter );
		$this->assertEquals( 'https://test.com', $context->get_canonical_home_url(), 'get_canonical_home_url() should respect the googlesitekit_canonical_home_url filter' );
		remove_filter( 'googlesitekit_canonical_home_url', $url_filter );

		$trailing_slash_url_filter = function () {
			return 'https://test.com/';
		};

		// It returns a URL with a trailing slash, if the filter sets one.
		add_filter( 'googlesitekit_canonical_home_url', $trailing_slash_url_filter );
		$this->assertEquals( 'https://test.com/', $context->get_canonical_home_url(), 'get_canonical_home_url() should preserve trailing slash from filter' );
	}

	public function test_get_reference_site_url() {
		$context = new Context( GOOGLESITEKIT_PLUGIN_MAIN_FILE );

		$home_url = $context->get_canonical_home_url();

		// By default, the reference site_url uses the home_url
		$this->assertEquals( $home_url, $context->get_reference_site_url(), 'get_reference_site_url() should return canonical home URL by default' );

		$other_url_filter = function () {
			return 'https://test.com';
		};

		// If the filtered value returns a non-empty value, it takes precedence.
		add_filter( 'googlesitekit_site_url', $other_url_filter );
		$this->assertEquals( 'https://test.com', $context->get_reference_site_url(), 'get_reference_site_url() should respect the googlesitekit_site_url filter' );
		remove_filter( 'googlesitekit_site_url', $other_url_filter );

		$trailing_slash_url = function () {
			return 'https://test.com/';
		};

		// It always returns a URL without a trailing slash.
		add_filter( 'googlesitekit_site_url', $trailing_slash_url );
		$this->assertEquals( 'https://test.com', $context->get_reference_site_url(), 'get_reference_site_url() should remove trailing slash from URL' );
		remove_filter( 'googlesitekit_site_url', $trailing_slash_url );

		// If the filtered value returns an empty value, it falls back to the home_url.
		add_filter( 'googlesitekit_site_url', '__return_empty_string' );
		$this->assertEquals( $home_url, $context->get_reference_site_url(), 'get_reference_site_url() should fall back to canonical home URL when filter returns empty string' );
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
		$this->assertTrue( current_user_can( Permissions::VIEW_DASHBOARD ), 'User should have permission to view dashboard' );

		// Set admin context.
		set_current_screen( 'dashboard' );
		$this->assertTrue( is_admin(), 'Test should be running in admin context' );

		// The reference entity is null by default.
		$this->assertNull( $context->get_reference_entity(), 'Reference entity should be null by default in admin context' );

		// Set up a global public post.
		$global_post_id = $this->factory()->post->create();
		( new \WP_Query( array( 'p' => $global_post_id ) ) )->the_post();
		$this->assertEquals( $global_post_id, get_post()->ID, 'Global post ID should match created post ID' );
		$this->assertNull( $context->get_reference_entity(), 'Reference entity should be null in admin context even with global post' );

		// The Site Kit dashboard only references the entity from the `permaLink` query parameter.
		$public_post_id = $this->factory()->post->create();
		set_current_screen( 'toplevel_page_googlesitekit-dashboard' );
		$_GET['page'] = 'googlesitekit-dashboard';
		$this->assertNull( $context->get_reference_entity(), 'Reference entity should be null without permaLink parameter' );
		// We can probably safely assume that 987654 is not a valid post ID in the test environment, but let's make sure.
		$this->assertFalse( \WP_Post::get_instance( 987654 ), 'Invalid post ID should not return a post instance' );
		$_GET['permaLink'] = add_query_arg( 'p', '987654', home_url( '/' ) );
		$this->assertNull( $context->get_reference_entity(), 'Reference entity should be null with invalid post ID in permaLink' );
		$_GET['permaLink'] = get_permalink( $public_post_id );
		$entity            = $context->get_reference_entity();
		$this->assertInstanceOf( Entity::class, $entity, 'Reference entity should be an Entity instance with valid permaLink' );
		$this->assertEquals( 'post', $entity->get_type(), 'Entity type should be "post"' );
		$this->assertEquals( $public_post_id, $entity->get_id(), 'Entity ID should match the public post ID' );
		$this->assertEquals( get_permalink( $public_post_id ), $entity->get_url(), 'Entity URL should match the public post permalink' );
		unset( $_GET['page'], $_GET['permaLink'] );

		// The post edit screen should reference the global post.
		set_current_screen( 'post.php' );
		$entity = $context->get_reference_entity();
		$this->assertInstanceOf( Entity::class, $entity, 'Reference entity should be an Entity instance on post edit screen' );
		$this->assertEquals( 'post', $entity->get_type(), 'Entity type should be "post" on post edit screen' );
		$this->assertEquals( $global_post_id, $entity->get_id(), 'Entity ID should match the global post ID on post edit screen' );
		$this->assertEquals( get_permalink( $global_post_id ), $entity->get_url(), 'Entity URL should match the global post permalink on post edit screen' );
	}

	public function test_get_reference_entity__in_frontend_context() {
		$context = new Context( GOOGLESITEKIT_PLUGIN_MAIN_FILE );

		// By default, is_admin should be false.
		$this->assertFalse( is_admin(), 'Test should be running in frontend context' );

		// Since we haven't gone anywhere, the entity should be null.
		$this->assertNull( $context->get_reference_entity(), 'Reference entity should be null before navigating to a page' );

		// Go to home page, which is the blog home by default.
		$this->go_to( '/' );
		$entity = $context->get_reference_entity();
		$this->assertInstanceOf( Entity::class, $entity, 'Reference entity should be an Entity instance on home page' );
		$this->assertEquals( 'blog', $entity->get_type(), 'Entity type should be "blog" on default home page' );
		$this->assertEquals( 0, $entity->get_id(), 'Entity ID should be 0 for default blog home' );
		$this->assertEquals( home_url(), $entity->get_url(), 'Entity URL should match home URL for default blog home' );

		// Use a dedicated page for the blog home.
		$blog_home_id = $this->factory()->post->create( array( 'post_type' => 'page' ) );
		update_option( 'show_on_front', 'page' );
		update_option( 'page_for_posts', $blog_home_id );
		$this->go_to( get_permalink( $blog_home_id ) );
		$entity = $context->get_reference_entity();
		$this->assertInstanceOf( Entity::class, $entity, 'Reference entity should be an Entity instance on blog home page' );
		$this->assertEquals( 'blog', $entity->get_type(), 'Entity type should be "blog" on dedicated blog home page' );
		$this->assertEquals( $blog_home_id, $entity->get_id(), 'Entity ID should match blog home page ID' );
		$this->assertEquals( get_permalink( $blog_home_id ), $entity->get_url(), 'Entity URL should match blog home page permalink' );

		// Use a dedicated page for the home/front page.
		$front_page_id = $this->factory()->post->create( array( 'post_type' => 'page' ) );
		update_option( 'show_on_front', 'page' );
		update_option( 'page_on_front', $front_page_id );
		$this->go_to( get_permalink( $front_page_id ) );
		$entity = $context->get_reference_entity();
		$this->assertInstanceOf( Entity::class, $entity, 'Reference entity should be an Entity instance on front page' );
		$this->assertEquals( 'post', $entity->get_type(), 'Entity type should be "post" for front page' );
		$this->assertEquals( $front_page_id, $entity->get_id(), 'Entity ID should match front page ID' );
		$this->assertEquals( get_permalink( $front_page_id ), $entity->get_url(), 'Entity URL should match front page permalink' );

		// Entities can only be retrieved for public posts.
		$non_public_post_id = $this->factory()->post->create( array( 'post_status' => 'private' ) );
		$this->go_to( get_permalink( $non_public_post_id ) );
		$this->assertNull( $context->get_reference_entity(), 'Reference entity should be null for non-public posts' );
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
		$this->assertFalse( $context->get_reference_permalink(), 'get_reference_permalink() should return false for category archives' );

		update_option( 'show_on_front', 'page' );
		update_option( 'page_on_front', $page_id );

		$this->go_to( '/hello-world' );
		$this->assertEquals( get_permalink(), $context->get_reference_permalink(), 'get_reference_permalink() should return current permalink for single posts' );

		$other_url_filter = function () {
			return 'https://test.com/';
		};

		// If the filtered value returns a non-empty value, it takes precedence.
		add_filter( 'googlesitekit_site_url', $other_url_filter );

		$this->go_to( '/' );
		$this->assertEquals( 'https://test.com/', $context->get_reference_permalink(), 'get_reference_permalink() should respect the googlesitekit_site_url filter' );
		$this->assertEquals( 'https://test.com/hello-world/', $context->get_reference_permalink( $post_id ), 'get_reference_permalink() with post ID should use filtered site URL as base' );
	}

	/**
	 * @group ms-excluded
	 */
	public function test_is_network_active() {
		if ( is_multisite() ) {
			$this->markTestSkipped( 'This test does not run on multisite.' );
		}

		$context = new Context( GOOGLESITEKIT_PLUGIN_MAIN_FILE );
		$this->assertFalse( $context->is_network_active(), 'is_network_active() should return false on single site' );
	}

	/**
	 * @group ms-required
	 */
	public function test_is_network_active_multisite() {
		if ( ! is_multisite() ) {
			$this->markTestSkipped( 'This test only runs on multisite.' );
		}

		$context = new Context( GOOGLESITEKIT_PLUGIN_MAIN_FILE );
		$this->assertFalse( $context->is_network_active(), 'is_network_active() should return false when plugin is not network active' );

		// Fake plugin being network-active.
		add_filter(
			'pre_site_option_active_sitewide_plugins',
			function () {
				$plugin_basename = GOOGLESITEKIT_PLUGIN_BASENAME;
				return array( $plugin_basename => true );
			}
		);

		// Ensure the result is not re-calculated.
		$this->assertFalse( $context->is_network_active(), 'is_network_active() should cache result and not recalculate' );

		// Ensure re-checking evaluates as true.
		$context = new Context( GOOGLESITEKIT_PLUGIN_MAIN_FILE );
		$this->assertTrue( $context->is_network_active(), 'is_network_active() should return true when plugin is network active' );
	}

	public function test_get_locale() {

		// Set locale site and user.
		$original_locale   = $GLOBALS['locale'];
		$GLOBALS['locale'] = 'pt_PT_ao90';
		$user              = wp_get_current_user();
		$user->locale      = 'nl_NL_formal';

		$context = new Context( GOOGLESITEKIT_PLUGIN_MAIN_FILE );
		$locale  = $context->get_locale();

		$this->assertEquals( 'pt_PT_ao90', $context->get_locale(), 'get_locale() should return site locale by default' );
		$this->assertEquals( 'pt_PT_ao90', $context->get_locale( 'site' ), 'get_locale() with "site" type should return site locale' );
		$this->assertEquals( 'pt', $context->get_locale( 'site', 'language-code' ), 'get_locale() with "site" type and "language-code" format should return language code only' );
		$this->assertEquals( 'pt_PT', $context->get_locale( 'site', 'language-variant' ), 'get_locale() with "site" type and "language-variant" format should return language and region' );
		$this->assertEquals( 'nl_NL_formal', $context->get_locale( 'user' ), 'get_locale() with "user" type should return user locale' );
		$this->assertEquals( 'nl', $context->get_locale( 'user', 'language-code' ), 'get_locale() with "user" type and "language-code" format should return language code only' );
		$this->assertEquals( 'nl_NL', $context->get_locale( 'user', 'language-variant' ), 'get_locale() with "user" type and "language-variant" format should return language and region' );

		// Change site locale
		$GLOBALS['locale'] = 'te';
		$this->assertEquals( 'te', $context->get_locale(), 'get_locale() should reflect changes to site locale' );
		$this->assertEquals( 'te', $context->get_locale( 'site' ), 'get_locale() with "site" type should reflect changes to site locale' );
		$this->assertEquals( 'te', $context->get_locale( 'site', 'language-code' ), 'get_locale() with "site" type and "language-code" format should return full locale when locale is just language code' );

		// Reset locale.
		$GLOBALS['locale'] = $original_locale;
		unset( $user->locale );
	}
}
