<?php
/**
 * Template Name: Site Kit Public Dashboard
 */

// Load necessary WordPress core files and functions.
define( 'WP_USE_THEMES', false );
require_once( ABSPATH . 'wp-load.php' );
require_once( ABSPATH . WPINC . '/template-loader.php' );

// Output the necessary parts of the header.
?>
<!DOCTYPE html>
<html <?php language_attributes(); ?>>
<head>
    <meta charset="<?php bloginfo( 'charset' ); ?>">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <?php wp_head(); ?>
</head>
<body <?php body_class(); ?>>
<div id="content">

<div class="googlesitekit-plugin">
    <div id="js-googlesitekit-public-dashboard" data-view-only="true"></div>
</div>

<?php
// Output the necessary parts of the footer.
?>
</div> <!-- End of #content -->
<?php wp_footer(); ?>
</body>
</html>
