<?php
/**
 * Class Google\Site_Kit\Tests\Modules\Analytics_4\Post_List_View_Analytics_ColumnTest
 *
 * @package   Google\Site_Kit\Tests\Modules\Analytics_4
 * @copyright 2026 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 */

namespace Google\Site_Kit\Tests\Modules\Analytics_4;

use Google\Site_Kit\Context;
use Google\Site_Kit\Core\Permissions\Permissions;
use Google\Site_Kit\Core\Storage\User_Options;
use Google\Site_Kit\Modules\Analytics_4\Post_List_Column_Preferences;
use Google\Site_Kit\Modules\Analytics_4\Post_List_View_Analytics_Column;
use Google\Site_Kit\Tests\TestCase;
use ReflectionMethod;
use WP_Screen;

/**
 * @group Modules
 * @group Analytics
 */
class Post_List_View_Analytics_ColumnTest extends TestCase {

	/**
	 * @var Post_List_View_Analytics_Column
	 */
	private $column;

	/**
	 * @var Context
	 */
	private $context;

	/**
	 * @var Post_List_Column_Preferences
	 */
	private $preferences;

	/**
	 * @var callable
	 */
	private $map_meta_cap_view_posts_insights;

	public function set_up(): void {
		parent::set_up();

		$user_id = $this->factory()->user->create( array( 'role' => 'administrator' ) );
		wp_set_current_user( $user_id );

		$this->map_meta_cap_view_posts_insights = static function ( $caps, $cap ) {
			if ( Permissions::VIEW_POSTS_INSIGHTS === $cap ) {
				return array( 'read' );
			}
			return $caps;
		};
		add_filter( 'map_meta_cap', $this->map_meta_cap_view_posts_insights, 10, 4 );

		$this->context     = new Context( GOOGLESITEKIT_PLUGIN_MAIN_FILE );
		$user_opts         = new User_Options( $this->context, $user_id );
		$this->preferences = new Post_List_Column_Preferences( $user_opts );

		$this->create_column();
	}

	public function tear_down(): void {
		remove_filter( 'map_meta_cap', $this->map_meta_cap_view_posts_insights, 10 );
		parent::tear_down();
	}

	private function create_column() {
		$this->column = new Post_List_View_Analytics_Column(
			$this->context,
			$this->preferences
		);
	}

	public function test_register_schedules_init_and_admin_init() {
		$this->column->register();
		$this->assertNotFalse(
			has_action( 'init', array( $this->column, 'maybe_save_post_list_screen_options' ) ),
			'register() should persist Screen Options on init (before core set_screen_options redirect).'
		);
		$this->assertNotFalse(
			has_action( 'admin_init', array( $this->column, 'register_list_table_features' ) ),
			'register() should defer list-table hooks to admin_init (after Permissions::register).'
		);
	}

	public function test_register_list_table_features_adds_column_hooks() {
		$this->column->register_list_table_features();
		$this->assertNotFalse(
			has_filter( 'manage_post_posts_columns', array( $this->column, 'add_column' ) ),
			'List-table registration should add manage_*_posts_columns when the user may view insights.'
		);
	}

	public function test_add_column_appends_ga4_column() {
		$columns = array(
			'cb'     => '<input />',
			'title'  => 'Title',
			'author' => 'Author',
			'date'   => 'Date',
		);
		$out     = $this->column->add_column( $columns );
		$keys    = array_keys( $out );

		$this->assertArrayHasKey( Post_List_View_Analytics_Column::COLUMN_ID, $out, 'GA4 column should be registered.' );
		$this->assertStringContainsString(
			'googlesitekit-post-list-ga4-header',
			$out[ Post_List_View_Analytics_Column::COLUMN_ID ],
			'GA4 column header markup should be present.'
		);
		$this->assertSame(
			Post_List_View_Analytics_Column::COLUMN_ID,
			end( $keys ),
			'GA4 column should be appended after existing columns.'
		);
	}

	public function test_render_column_outputs_placeholder_with_page_path() {
		$post_id = $this->factory()->post->create(
			array(
				'post_title'  => 'Hello',
				'post_status' => 'publish',
			)
		);

		ob_start();
		$this->column->render_column( Post_List_View_Analytics_Column::COLUMN_ID, $post_id );
		$html = ob_get_clean();

		$this->assertStringContainsString(
			'googlesitekit-post-list-ga4-views',
			$html,
			'Cell should use the GA4 views wrapper class.'
		);
		$this->assertStringContainsString(
			'data-page-path=',
			$html,
			'Cell should expose data-page-path for the admin script.'
		);
		$permalink     = get_permalink( $post_id );
		$expected_path = wp_parse_url( $permalink, PHP_URL_PATH );
		$this->assertNotEmpty( $expected_path, 'Published post should have a URL path.' );
		$this->assertStringContainsString(
			esc_attr( $expected_path ),
			$html,
			'data-page-path should match the post permalink path.'
		);
	}

	public function test_get_column_header_has_icon_and_title_tooltip() {
		$method = new ReflectionMethod( Post_List_View_Analytics_Column::class, 'get_column_header_html' );
		$method->setAccessible( true );
		$html = $method->invoke( $this->column );

		$this->assertStringContainsString(
			'googlesitekit-post-list-ga4-header',
			$html,
			'Header should use the expected wrapper class.'
		);
		$this->assertStringContainsString(
			'googlesitekit-post-list-ga4-icon',
			$html,
			'Header should include the icon element.'
		);
		$this->assertStringContainsString(
			'analytics.svg',
			$html,
			'Header should reference the analytics icon asset.'
		);
		$this->assertMatchesRegularExpression(
			'/title="[^"]*via Site Kit by Google"/',
			$html,
			'Header title tooltip should mention Site Kit.'
		);
	}

	public function test_filter_screen_settings_appends_fieldset_on_edit_screen() {
		require_once ABSPATH . 'wp-admin/includes/class-wp-screen.php';
		$screen = WP_Screen::get( 'edit-post' );
		$this->assertInstanceOf(
			WP_Screen::class,
			$screen,
			'edit-post screen should resolve to WP_Screen.'
		);
		$this->assertSame( 'post', $screen->post_type, 'Posts list screen should have post_type post.' );

		$out = $this->column->filter_screen_settings( '<p>Core</p>', $screen );
		$this->assertStringContainsString(
			'googlesitekit-post-list-ga4-screen-options',
			$out,
			'Screen options should include the Site Kit fieldset.'
		);
		$this->assertStringContainsString(
			'name="googlesitekit_ga4_post_list_metric"',
			$out,
			'Screen options should include metric select name.'
		);
		$this->assertStringContainsString(
			'name="googlesitekit_ga4_post_list_date_range"',
			$out,
			'Screen options should include date range select name.'
		);
	}

	public function test_maybe_save_post_list_screen_options_persists_preferences() {
		$preferences = $this->get_column_preferences_from_column();
		$this->assertInstanceOf(
			Post_List_Column_Preferences::class,
			$preferences,
			'Column should hold Post_List_Column_Preferences.'
		);

		$prev_php_self = isset( $_SERVER['PHP_SELF'] ) ? $_SERVER['PHP_SELF'] : null;
		$had_wp_admin  = defined( 'WP_ADMIN' );
		if ( ! $had_wp_admin ) {
			define( 'WP_ADMIN', true );
		}
		$_SERVER['PHP_SELF']                                      = '/wp-admin/edit.php';
		$_POST[ Post_List_Column_Preferences::OPTION_METRIC ]     = 'sessions';
		$_POST[ Post_List_Column_Preferences::OPTION_DATE_RANGE ] = 'last-7-days';
		$_POST['screenoptionnonce']                               = wp_create_nonce( 'screen-options-nonce' );
		$_POST['screen-options-apply']                            = '1';
		$_REQUEST['screenoptionnonce']                            = $_POST['screenoptionnonce'];

		$this->column->maybe_save_post_list_screen_options();

		$this->assertSame(
			'sessions',
			$preferences->get_metric(),
			'Screen options save should persist metric preference.'
		);
		$this->assertSame(
			'last-7-days',
			$preferences->get_date_range_slug(),
			'Screen options save should persist date range preference.'
		);

		unset(
			$_POST[ Post_List_Column_Preferences::OPTION_METRIC ],
			$_POST[ Post_List_Column_Preferences::OPTION_DATE_RANGE ],
			$_POST['screenoptionnonce'],
			$_POST['screen-options-apply'],
			$_REQUEST['screenoptionnonce']
		);
		if ( null === $prev_php_self ) {
			unset( $_SERVER['PHP_SELF'] );
		} else {
			$_SERVER['PHP_SELF'] = $prev_php_self;
		}
		// Cannot undefine WP_ADMIN; leave defined if we set it (safe for admin integration tests).
	}

	/**
	 * @return Post_List_Column_Preferences
	 */
	private function get_column_preferences_from_column() {
		$prop = ( new \ReflectionClass( Post_List_View_Analytics_Column::class ) )->getProperty( 'preferences' );
		$prop->setAccessible( true );
		return $prop->getValue( $this->column );
	}
}
