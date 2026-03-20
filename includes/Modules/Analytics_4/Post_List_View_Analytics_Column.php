<?php
/**
 * Class Google\Site_Kit\Modules\Analytics_4\Post_List_View_Analytics_Column
 *
 * @package   Google\Site_Kit
 * @copyright 2026 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 */

namespace Google\Site_Kit\Modules\Analytics_4;

use Google\Site_Kit\Context;
use Google\Site_Kit\Core\Permissions\Permissions;
use Google\Site_Kit\Core\Util\URL;
use Google\Site_Kit\Modules\Analytics_4 as Analytics_4_Module;
use WP_Screen;

/**
 * GA4 metrics column on wp-admin post list tables.
 *
 * @since n.e.x.t
 * @access private
 * @ignore
 */
final class Post_List_View_Analytics_Column {

	const COLUMN_ID = 'ga4_page_views';

	/**
	 * Plugin context.
	 *
	 * @var Context
	 */
	private $context;

	/**
	 * User preferences.
	 *
	 * @var Post_List_Column_Preferences
	 */
	private $preferences;

	/**
	 * Constructor.
	 *
	 * @since n.e.x.t
	 *
	 * @param Context                      $context     Context.
	 * @param Post_List_Column_Preferences $preferences Preferences.
	 */
	public function __construct( Context $context, Post_List_Column_Preferences $preferences ) {
		$this->context     = $context;
		$this->preferences = $preferences;
	}

	/**
	 * Registers WordPress hooks.
	 *
	 * List-table hooks use `admin_init` so `current_user_can( VIEW_POSTS_INSIGHTS )` runs after
	 * {@see \Google\Site_Kit\Core\Permissions\Permissions::register()} (registered later in the same
	 * core `init` pass as {@see \Google\Site_Kit\Core\Modules\Modules::register()}).
	 *
	 * Screen Options “Apply” is processed by core’s {@see set_screen_options()} before `admin_init`
	 * (then redirect + exit), so preference persistence must use `init` — not `load-edit.php`.
	 *
	 * Call only when Analytics is connected ({@see \Google\Site_Kit\Modules\Analytics_4::register()}).
	 *
	 * @since n.e.x.t
	 */
	public function register() {
		add_action( 'init', array( $this, 'maybe_save_post_list_screen_options' ), 20 );
		add_action( 'admin_init', array( $this, 'register_list_table_features' ) );
	}

	/**
	 * Registers column and screen options when the user may view posts insights.
	 *
	 * @since n.e.x.t
	 */
	public function register_list_table_features() {
		if ( ! current_user_can( Permissions::VIEW_POSTS_INSIGHTS ) ) {
			return;
		}

		$this->preferences->register();

		foreach ( $this->get_viewable_post_types() as $post_type ) {
			add_filter(
				"manage_{$post_type}_posts_columns",
				array( $this, 'add_column' )
			);
			add_action(
				"manage_{$post_type}_posts_custom_column",
				array( $this, 'render_column' ),
				10,
				2
			);
		}

		add_filter( 'screen_settings', array( $this, 'filter_screen_settings' ), 10, 2 );
	}

	/**
	 * Gets post types that should show the column.
	 *
	 * @since n.e.x.t
	 *
	 * @return string[]
	 */
	private function get_viewable_post_types() {
		return array_values(
			array_filter(
				get_post_types( array(), 'names' ),
				'is_post_type_viewable'
			)
		);
	}

	/**
	 * Adds the GA4 column to the list table (appended after existing columns).
	 *
	 * @since n.e.x.t
	 *
	 * @param array $columns Existing columns.
	 * @return array
	 */
	public function add_column( $columns ) {
		if ( ! is_array( $columns ) ) {
			return $columns;
		}

		$columns[ self::COLUMN_ID ] = $this->get_column_header_html();

		return $columns;
	}

	/**
	 * Renders column cell content.
	 *
	 * @since n.e.x.t
	 *
	 * @param string $column  Column key.
	 * @param int    $post_id Post ID.
	 */
	public function render_column( $column, $post_id ) {
		if ( self::COLUMN_ID !== $column ) {
			return;
		}

		$permalink = get_permalink( $post_id );
		if ( empty( $permalink ) || ! is_string( $permalink ) ) {
			echo esc_html( _x( '—', 'No public URL for post', 'google-site-kit' ) );
			return;
		}

		$path = $this->get_page_path_for_ga( $permalink );
		if ( '' === $path ) {
			echo esc_html( _x( '—', 'Could not resolve path for analytics', 'google-site-kit' ) );
			return;
		}

		printf(
			'<span class="googlesitekit-post-list-ga4-views" data-page-path="%s">%s</span>',
			esc_attr( $path ),
			esc_html( _x( '—', 'Placeholder before analytics load', 'google-site-kit' ) )
		);
	}

	/**
	 * Builds page path string for GA4 pagePathPlusQueryString matching.
	 *
	 * @since n.e.x.t
	 *
	 * @param string $permalink Full permalink.
	 * @return string Path plus optional query (leading slash).
	 */
	private function get_page_path_for_ga( $permalink ) {
		$parts = URL::parse( $permalink );
		if ( ! is_array( $parts ) ) {
			return '';
		}
		if ( empty( $parts['path'] ) && empty( $parts['query'] ) ) {
			return '';
		}
		$path = isset( $parts['path'] ) ? $parts['path'] : '/';
		if ( ! empty( $parts['query'] ) ) {
			$path .= '?' . $parts['query'];
		}
		return $path;
	}

	/**
	 * Column header markup: icon + metric label, with tooltip.
	 *
	 * @since n.e.x.t
	 *
	 * @return string
	 */
	private function get_column_header_html() {
		$metric      = $this->preferences->get_metric();
		$date_slug   = $this->preferences->get_date_range_slug();
		$labels      = Post_List_Column_Preferences::get_metric_labels();
		$date_labels = Post_List_Column_Preferences::get_date_range_labels();

		$metric_label = isset( $labels[ $metric ] ) ? $labels[ $metric ] : $metric;
		$date_label   = isset( $date_labels[ $date_slug ] ) ? $date_labels[ $date_slug ] : $date_slug;

		$tooltip = sprintf(
			/* translators: 1: Metric label. 2: Date range label. */
			__( '%1$s over %2$s via Site Kit by Google', 'google-site-kit' ),
			$metric_label,
			$date_label
		);

		$icon_url = $this->context->url( 'assets/svg/graphics/analytics.svg' );

		return sprintf(
			'<span class="googlesitekit-post-list-ga4-header" title="%1$s"><img src="%2$s" alt="" width="12" height="12" class="googlesitekit-post-list-ga4-icon" decoding="async" /> <span class="googlesitekit-post-list-ga4-metric-label">%3$s</span></span>',
			esc_attr( $tooltip ),
			esc_url( $icon_url ),
			esc_html( $metric_label )
		);
	}

	/**
	 * Appends Screen Options fields for metric and date range.
	 *
	 * @since n.e.x.t
	 *
	 * @param string    $settings Screen settings HTML.
	 * @param WP_Screen $screen   Current screen.
	 * @return string
	 */
	public function filter_screen_settings( $settings, $screen ) {
		if ( ! $screen instanceof WP_Screen || 'edit' !== $screen->base ) {
			return $settings;
		}

		if ( empty( $screen->post_type ) || ! is_post_type_viewable( $screen->post_type ) ) {
			return $settings;
		}

		if ( ! current_user_can( Permissions::VIEW_POSTS_INSIGHTS ) ) {
			return $settings;
		}

		$settings .= $this->get_screen_options_fieldset_markup(
			$this->preferences->get_metric(),
			$this->preferences->get_date_range_slug()
		);

		return $settings;
	}

	/**
	 * Persists Screen Options for metric and date range (see {@see self::register()}).
	 *
	 * @since n.e.x.t
	 */
	public function maybe_save_post_list_screen_options() {
		if ( ! is_admin() || wp_doing_ajax() || ! $this->is_post_list_edit_request() ) {
			return;
		}

		if ( ! isset( $_POST['screen-options-apply'] ) ) {
			return;
		}

		$metric_key = Post_List_Column_Preferences::OPTION_METRIC;
		$date_key   = Post_List_Column_Preferences::OPTION_DATE_RANGE;
		if ( ! isset( $_POST[ $metric_key ], $_POST[ $date_key ] ) ) {
			return;
		}

		if ( ! current_user_can( Permissions::VIEW_POSTS_INSIGHTS ) ) {
			return;
		}

		check_admin_referer( 'screen-options-nonce', 'screenoptionnonce' );

		$post_type = isset( $_REQUEST['post_type'] )
			? sanitize_key( wp_unslash( $_REQUEST['post_type'] ) )
			: 'post';
		if ( ! post_type_exists( $post_type ) || ! is_post_type_viewable( $post_type ) ) {
			return;
		}

		$metric = sanitize_text_field( wp_unslash( $_POST[ $metric_key ] ) );
		$date   = sanitize_text_field( wp_unslash( $_POST[ $date_key ] ) );

		$this->preferences->set_metric( $metric );
		$this->preferences->set_date_range_slug( $date );
	}

	/**
	 * Whether the current request is a direct load/post of wp-admin/edit.php.
	 *
	 * @since n.e.x.t
	 *
	 * @return bool
	 */
	private function is_post_list_edit_request() {
		if ( empty( $_SERVER['PHP_SELF'] ) || ! is_string( $_SERVER['PHP_SELF'] ) ) {
			return false;
		}

		$php_self = sanitize_text_field( wp_unslash( $_SERVER['PHP_SELF'] ) );

		return 'edit.php' === wp_basename( $php_self );
	}

	/**
	 * Markup for Screen Options fieldset (shared option names with {@see Post_List_Column_Preferences}).
	 *
	 * @since n.e.x.t
	 *
	 * @param string $current_metric Saved metric key.
	 * @param string $current_date   Saved date range slug.
	 * @return string
	 */
	private function get_screen_options_fieldset_markup( $current_metric, $current_date ) {
		$metric_key = Post_List_Column_Preferences::OPTION_METRIC;
		$date_key   = Post_List_Column_Preferences::OPTION_DATE_RANGE;

		ob_start();
		?>
		<fieldset class="metabox-prefs googlesitekit-post-list-ga4-screen-options">
			<legend><?php esc_html_e( 'Site Kit Analytics column', 'google-site-kit' ); ?></legend>
			<label for="<?php echo esc_attr( $metric_key ); ?>" class="screen-reader-text"><?php esc_html_e( 'Metric', 'google-site-kit' ); ?></label>
			<select name="<?php echo esc_attr( $metric_key ); ?>" id="<?php echo esc_attr( $metric_key ); ?>">
				<?php
				$metric_labels = Post_List_Column_Preferences::get_metric_labels();
				foreach ( Post_List_Column_Preferences::ALLOWED_METRICS as $metric ) {
					$label = isset( $metric_labels[ $metric ] ) ? $metric_labels[ $metric ] : $metric;
					printf(
						'<option value="%s"%s>%s</option>',
						esc_attr( $metric ),
						selected( $current_metric, $metric, false ),
						esc_html( $label )
					);
				}
				?>
			</select>
			<label for="<?php echo esc_attr( $date_key ); ?>" class="screen-reader-text"><?php esc_html_e( 'Date range', 'google-site-kit' ); ?></label>
			<select name="<?php echo esc_attr( $date_key ); ?>" id="<?php echo esc_attr( $date_key ); ?>">
				<?php
				$range_labels = Post_List_Column_Preferences::get_date_range_labels();
				foreach ( Post_List_Column_Preferences::ALLOWED_DATE_RANGES as $slug ) {
					$label = isset( $range_labels[ $slug ] ) ? $range_labels[ $slug ] : $slug;
					printf(
						'<option value="%s"%s>%s</option>',
						esc_attr( $slug ),
						selected( $current_date, $slug, false ),
						esc_html( $label )
					);
				}
				?>
			</select>
		</fieldset>
		<?php
		return ob_get_clean();
	}

	/**
	 * Localized configuration for the list-table script.
	 *
	 * @since n.e.x.t
	 *
	 * @return array<string, mixed>
	 */
	public function get_inline_script_data() {
		return array(
			'metric'        => $this->preferences->get_metric(),
			'dateRangeSlug' => $this->preferences->get_date_range_slug(),
			'moduleSlug'    => Analytics_4_Module::MODULE_SLUG,
		);
	}
}
