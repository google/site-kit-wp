# Sign in with Google for Third-Party Plugins

This documentation provides technical details for plugin and theme developers who want to integrate Sign in with Google functionality from Site Kit into their own WordPress products.

## Overview

Site Kit provides a PHP action and a shortcode that allow third-party plugins and themes to render a Sign in with Google button anywhere on their site. These methods handle all the complexity of rendering a Google-compliant authentication button while maintaining compatibility with future versions of Site Kit.

**Important:** You should always use the provided PHP action or shortcode rather than attempting to replicate the HTML output, as the implementation may change in future versions of Site Kit.

## Use Cases

The Sign in with Google action and shortcode are ideal for:

- Adding Google authentication to custom login forms
- Integrating Google Sign-In into membership plugins
- Providing alternative authentication methods in custom user interfaces
- Enhancing WooCommerce or other e-commerce login experiences
- Embedding the button in page content, widgets, or page builders (using the shortcode)

## The PHP Action

### Action Hook

```php
do_action( 'googlesitekit_render_sign_in_with_google_button', $args );
```

**Parameters:**
- `$args` (array) (optional) - Configuration options for the button appearance and behavior

**Returns:** void (outputs HTML directly)

### Basic Usage

```php
// Render with default settings
do_action( 'googlesitekit_render_sign_in_with_google_button' );
```

This will output a Sign in with Google button with default styling and behavior configured in Site Kit settings.

### Shortcode Usage

In addition to the PHP action, Site Kit also provides a shortcode for rendering the Sign in with Google button:

```
[site_kit_sign_in_with_google]
```

The shortcode accepts the same customization attributes as the PHP action:

```
[site_kit_sign_in_with_google class="my-custom-class" text="continue_with" theme="filled_blue" shape="pill"]
```

**Shortcode Attributes:**
- `class` - Additional CSS class(es) to add to the button container
- `text` - Button text variation (see Arguments section below)
- `theme` - Button color theme (see Arguments section below)
- `shape` - Button shape (see Arguments section below)

The shortcode is useful for:
- Adding the button via the WordPress block editor (in text mode)
- Including the button in widgets that support shortcodes
- Embedding the button in page builders
- Any context where using PHP code directly is not convenient

**Example with multiple attributes:**
```
[site_kit_sign_in_with_google class="login-button-wrapper" text="signin" theme="outline" shape="rectangular"]
```

## Arguments

The action accepts an optional array of arguments to customize the button appearance:

| Argument | Type | Description | Values |
|----------|------|-------------|---------|
| `class` | string or array | Additional CSS classes to add to the button container | Any valid CSS class names |
| `text` | string | Button text variation | `continue_with`, `signin`, `signin_with`, `signup_with` |
| `theme` | string | Button color theme | `outline` (light), `filled_blue` (neutral), `filled_black` (dark) |
| `shape` | string | Button shape | `rectangular`, `pill` |

### Argument Details

#### `class`

Adds custom CSS classes to the button container. Can be provided as:
- A space-separated string: `'my-class another-class'`
- An array of strings: `array( 'my-class', 'another-class' )`

All classes are sanitized using `sanitize_html_class()` and duplicates are removed.

**Example:**
```php
do_action(
    'googlesitekit_render_sign_in_with_google_button',
    array(
        'class' => 'custom-button-wrapper',
    )
);
```

#### `text`

Controls the text displayed on the button:

- `continue_with` - "Continue with Google"
- `signin` - "Sign in"
- `signin_with` - "Sign in with Google" (default)
- `signup_with` - "Sign up with Google"

**Example:**
```php
do_action(
    'googlesitekit_render_sign_in_with_google_button',
    array(
        'text' => 'continue_with',
    )
);
```

#### `theme`

Controls the button color scheme:

- `outline` - Light theme with white background and blue border (default)
- `filled_blue` - Neutral theme with blue background
- `filled_black` - Dark theme with black background

**Example:**
```php
do_action(
    'googlesitekit_render_sign_in_with_google_button',
    array(
        'theme' => 'filled_blue',
    )
);
```

#### `shape`

Controls the button shape:

- `rectangular` - Standard rectangular button with square corners (default)
- `pill` - Rounded button with pill-shaped corners

**Example:**
```php
do_action(
    'googlesitekit_render_sign_in_with_google_button',
    array(
        'shape' => 'pill',
    )
);
```

### Combining Arguments

Multiple arguments can be combined to fully customize the button appearance:

```php
do_action(
    'googlesitekit_render_sign_in_with_google_button',
    array(
        'class' => array( 'my-login-form', 'google-button-wrapper' ),
        'text'  => 'continue_with',
        'theme' => 'filled_blue',
        'shape' => 'pill',
    )
);
```

## HTML Output

The action outputs a `<div>` element that serves as a placeholder for the Sign in with Google button. The actual Google button is rendered by JavaScript after page load.

### Output Structure

**Basic output (no arguments):**
```html
<div class="googlesitekit-sign-in-with-google__frontend-output-button"></div>
```

**With custom arguments:**
```html
<div class="googlesitekit-sign-in-with-google__frontend-output-button custom-class"
     data-googlesitekit-siwg-text="continue_with"
     data-googlesitekit-siwg-theme="filled_blue"
     data-googlesitekit-siwg-shape="pill"></div>
```

### Key Technical Details

- The class `googlesitekit-sign-in-with-google__frontend-output-button` is always present and must not be removed
- Configuration options are stored in `data-googlesitekit-siwg-*` attributes
- All attribute values are properly escaped using `esc_attr()`
- The div is converted to an actual Google Sign-In button via JavaScript after page load
- **Do not replicate this HTML manually** - always use the PHP action to ensure compatibility

## Behavior When Not Connected

The Sign in with Google button will **NOT** render in the following scenarios:

### 1. Module Not Connected

If the Sign in with Google module is not connected or the Client ID is not configured in Site Kit:
- The action will not output any HTML
- No error or warning will be displayed

### 2. Site Not Using HTTPS

Sign in with Google requires HTTPS for security. The button will not render if:
- The WordPress login URL does not use `https://`
- This is a Google requirement, not a Site Kit limitation

### 3. User Already Logged In

While the action will execute, the JavaScript that renders the button typically checks if a user is already authenticated and may not display the button to logged-in users, depending on the implementation context.

### Best Practices

1. **Always check for Site Kit:** Before calling the action, verify Site Kit is active:
   ```php
   if ( defined( 'GOOGLESITEKIT_VERSION' ) ) {
       do_action( 'googlesitekit_render_sign_in_with_google_button' );
   }
   ```

2. **Provide fallback options:** Always offer alternative authentication methods in case Sign in with Google is not available.

3. **Don't cache the output:** The button's availability depends on Site Kit's configuration state, which can change.

## Complete Examples

### Example 1: Custom Login Form

```php
function my_custom_login_form() {
    ?>
    <form id="my-login-form" method="post">
        <h2>Login to Your Account</h2>

        <!-- Traditional username/password fields -->
        <input type="text" name="username" placeholder="Username" required>
        <input type="password" name="password" placeholder="Password" required>
        <button type="submit">Log In</button>

        <!-- Sign in with Google option -->
        <?php if ( defined( 'GOOGLESITEKIT_VERSION' ) ) : ?>
            <div class="alternative-login">
                <p>Or sign in with:</p>
                <?php
                do_action(
                    'googlesitekit_render_sign_in_with_google_button',
                    array(
                        'class' => 'my-google-signin',
                        'text'  => 'signin_with',
                        'theme' => 'outline',
                    )
                );
                ?>
            </div>
        <?php endif; ?>
    </form>
    <?php
}
```

### Example 2: WooCommerce-Style Integration

```php
add_action( 'woocommerce_login_form_start', 'add_google_signin_to_woocommerce' );

function add_google_signin_to_woocommerce() {
    if ( defined( 'GOOGLESITEKIT_VERSION' ) && ! is_user_logged_in() ) {
        do_action(
            'googlesitekit_render_sign_in_with_google_button',
            array(
                'class' => 'woocommerce-form-row form-row',
                'text'  => 'continue_with',
                'theme' => 'filled_blue',
                'shape' => 'pill',
            )
        );
    }
}
```

### Example 3: Membership Plugin Integration

```php
function render_membership_login_options() {
    ?>
    <div class="membership-login">
        <h3>Member Login</h3>

        <!-- Existing login form -->
        <?php echo do_shortcode( '[membership_login_form]' ); ?>

        <!-- Google Sign-In with custom styling -->
        <?php if ( defined( 'GOOGLESITEKIT_VERSION' ) ) : ?>
            <div class="social-login-options">
                <hr>
                <p class="social-login-label">Quick Sign In</p>
                <?php
                do_action(
                    'googlesitekit_render_sign_in_with_google_button',
                    array(
                        'class' => array( 'membership-google-btn', 'social-auth' ),
                        'text'  => 'signin',
                        'theme' => 'filled_black',
                        'shape' => 'rectangular',
                    )
                );
                ?>
            </div>
        <?php endif; ?>
    </div>
    <?php
}
```

### Example 4: Using the Shortcode in Content

The shortcode can be used in WordPress content, widgets, or any place that supports shortcodes:

**In a Custom Page Template:**
```php
<div class="login-section">
    <h2>Member Access</h2>
    <p>Sign in to access exclusive member content:</p>
    <?php echo do_shortcode( '[site_kit_sign_in_with_google text="signin" theme="filled_blue"]' ); ?>
</div>
```

**Directly in WordPress Content (Block Editor in Text/HTML mode):**
```
<div class="custom-login-area">
    <h3>Quick Login</h3>
    [site_kit_sign_in_with_google class="center-button" shape="pill"]
</div>
```

**In a Widget that Supports Shortcodes:**
```
[site_kit_sign_in_with_google text="continue_with" theme="outline"]
```

**Note:** Site Kit also provides a native Gutenberg block for the WordPress block editor. Site administrators can insert the "Sign in with Google" block directly through the block inserter. The block uses the same underlying rendering mechanism as the PHP action and shortcode.

## Styling the Button

The button container can be styled using CSS. The default class is always present, and you can add your own:

```css
/* Target the default class */
.googlesitekit-sign-in-with-google__frontend-output-button {
    margin: 20px 0;
    text-align: center;
}

/* Target your custom class */
.my-custom-wrapper .googlesitekit-sign-in-with-google__frontend-output-button {
    max-width: 400px;
    margin: 0 auto;
}
```

**Note:** The Google Sign-In button itself is rendered by Google's JavaScript and follows Google's design guidelines. The styling you apply affects only the container div.

## Compatibility Notes

1. **Do not replicate the HTML output** - Always use the PHP action or shortcode. The implementation may change in future versions of Site Kit.

2. **Requires Site Kit 1.164.0 or later** - The Sign in with Google module was introduced in this version. The shortcode feature was added in a later version.

3. **Requires HTTPS** - This is a Google requirement for secure authentication.

4. **JavaScript Required** - The button requires JavaScript to render the actual Google Sign-In interface.

5. **Google Client ID Required** - The site owner must have configured a Google Client ID in Site Kit's Sign in with Google settings.

## Troubleshooting

### Button Not Appearing

If the button doesn't appear, check:

1. Is Site Kit installed and active?
2. Is the Sign in with Google module connected in Site Kit?
3. Has a Google Client ID been configured?
4. Is the site using HTTPS?
5. Is JavaScript enabled in the browser?
6. Are there JavaScript errors in the console?

### Button Appears But Doesn't Work

If the button renders but clicking it doesn't work:

1. Check the browser console for JavaScript errors
2. Verify the Google Client ID is correct in Site Kit settings
3. Ensure the domain is authorized in Google Cloud Console
4. Check that browser cookies are enabled

## Additional Resources

- [Site Kit Sign in with Google Documentation](https://sitekit.withgoogle.com/documentation/supported-services/sign-in-with-google) - User-facing documentation
- [Google Identity Services Documentation](https://developers.google.com/identity/gsi/web) - Google's official documentation
- [Site Kit Support](https://github.com/google/site-kit-wp/issues) - Report issues or ask questions
