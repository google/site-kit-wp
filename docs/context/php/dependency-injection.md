# Dependency Injection Pattern

Site Kit uses constructor-based dependency injection throughout the PHP codebase to achieve loose coupling, testability, and maintainable code architecture.

## What is Dependency Injection?

Dependency Injection (DI) is a design pattern where a class receives its dependencies from external sources rather than creating them internally. In Site Kit, dependencies are injected through class constructors, making them explicit and allowing for easy testing with mock objects.

## Core Principles

### 1. Constructor Injection

All dependencies are passed through the constructor, making requirements explicit and immutable.

**Location**: `includes/Plugin.php` (the `init` action closure, around lines 155-279)

```php
add_action(
    'init',
    function () use ( $options, $activation_flag ) {
        $transients   = new Core\Storage\Transients( $this->context );
        $user_options = new Core\Storage\User_Options( $this->context, get_current_user_id() );
        $assets       = new Core\Assets\Assets( $this->context );

        $survey_queue = new Core\User_Surveys\Survey_Queue( $user_options );
        $survey_queue->register();

        $user_input = new Core\User_Input\User_Input( $this->context, $options, $user_options, $survey_queue );

        $authentication = new Core\Authentication\Authentication( $this->context, $options, $user_options, $transients, $user_input );
        $authentication->register();

        $modules = new Core\Modules\Modules( $this->context, $options, $user_options, $authentication, $assets );
        $modules->register();
    }
);
```

### 2. Optional Dependencies with Null Coalescing

Dependencies can be optional, with default instances created if not provided. This pattern is used extensively in modules.

**Location**: `includes/Core/Modules/Module.php:145-159`

```php
public function __construct(
    Context $context,
    ?Options $options = null,
    ?User_Options $user_options = null,
    ?Authentication $authentication = null,
    ?Assets $assets = null
) {
    $this->context        = $context;
    $this->options        = $options ?: new Options( $this->context );
    $this->user_options   = $user_options ?: new User_Options( $this->context );
    $this->authentication = $authentication ?: new Authentication( $this->context, $this->options, $this->user_options );
    $this->assets         = $assets ?: new Assets( $this->context );
    $this->transients     = new Transients( $this->context );
    $this->info           = $this->parse_info( (array) $this->setup_info() );
}
```

Note that `$transients` is **not** a constructor parameter: the base `Module` always
constructs its own `Transients` instance internally from the context. Only `$options`,
`$user_options`, `$authentication`, and `$assets` are injectable (optional with defaults).

**Why this pattern is used**:

-   **Testing**: Allows injection of mock dependencies for unit tests
-   **Flexibility**: Easy to swap implementations without modifying the class
-   **Default behavior**: Production code works without explicit dependency provision
-   **Type safety**: PHP 7.4+ nullable type hints ensure correct types

### 3. Type Hinting

All dependencies use strict type hinting to ensure type safety and provide IDE autocomplete support.

```php
public function __construct(
    Context $context,              // Required dependency
    ?Options $options = null,      // Optional with default
    ?User_Options $user_options = null
) {
    // Implementation
}
```

## Common Dependency Patterns

### Pattern 1: Context Dependency

Almost every class in Site Kit receives the `Context` object as its first dependency.

**Location**: `includes/Context.php`

```php
class SomeClass {
    private $context;

    public function __construct( Context $context ) {
        $this->context = $context;
    }

    public function some_method() {
        // Access context services
        $plugin_url = $this->context->url( 'assets/js/file.js' );
        $is_amp = $this->context->is_amp();
    }
}
```

**Why**: The Context object provides access to:

-   File paths and URLs
-   Site configuration
-   Multisite detection
-   AMP mode detection
-   Environment information
-   Request data

### Pattern 2: Storage Dependencies

Classes that need to read/write settings depend on `Options` and `User_Options`.

**Location**: `includes/Core/Authentication/Authentication.php`

```php
final class Authentication implements Provides_Feature_Metrics {
    private $context;
    private $options;
    private $user_options;

    public function __construct(
        Context $context,
        ?Options $options = null,
        ?User_Options $user_options = null,
        ?Transients $transients = null,
        ?User_Input $user_input = null
    ) {
        $this->context      = $context;
        $this->options      = $options ?: new Options( $this->context );
        $this->user_options = $user_options ?: new User_Options( $this->context );
        $this->transients   = $transients ?: new Transients( $this->context );
        $this->user_input   = $user_input ?: new User_Input( $context, $this->options, $this->user_options );
    }
}
```

### Pattern 3: Internally Constructed Dependencies

Not every collaborator is injected. Some dependencies that have no meaningful test
substitution, or that are always built from another already-available dependency, are
constructed inside the constructor. The base `Module` class does this with `Transients`:
it is always built from the context rather than passed in.

**Location**: `includes/Core/Modules/Module.php`

```php
abstract class Module {
    protected $context;
    protected $options;
    protected $user_options;
    protected $transients;

    public function __construct(
        Context $context,
        ?Options $options = null,
        ?User_Options $user_options = null,
        ?Authentication $authentication = null,
        ?Assets $assets = null
    ) {
        $this->context      = $context;
        $this->options      = $options ?: new Options( $this->context );
        $this->user_options = $user_options ?: new User_Options( $this->context );
        // Transients is built internally, not injected.
        $this->transients   = new Transients( $this->context );
        // ...
    }
}
```

Subclasses then read and write the cache through the internally-built `$this->transients`,
which exposes `get( $transient )` and `set( $transient, $value, $expiration )`:

```php
$cached = $this->transients->get( 'some_cache_key' );
if ( false === $cached ) {
    $cached = $this->fetch_fresh_data();
    $this->transients->set( 'some_cache_key', $cached, HOUR_IN_SECONDS );
}
```

**Note**: Because `Transients` is constructed internally in `Module`, subclasses cannot swap
it through the constructor. Prefer injecting dependencies you need to mock in tests; reserve
the internal-construction pattern for collaborators (like `Transients`) that are cheap to
build from the context and do not need substitution.

### Pattern 4: Service Dependencies

Complex services depend on other services to build hierarchies.

**Location**: `includes/Core/Modules/Modules.php`

```php
final class Modules implements Provides_Feature_Metrics {
    private $context;
    private $options;
    private $user_options;
    private $authentication;
    private $assets;

    public function __construct(
        Context $context,
        ?Options $options = null,
        ?User_Options $user_options = null,
        ?Authentication $authentication = null,
        ?Assets $assets = null
    ) {
        $this->context        = $context;
        $this->options        = $options ?: new Options( $this->context );
        $this->user_options   = $user_options ?: new User_Options( $this->context );
        $this->authentication = $authentication ?: new Authentication( $this->context, $this->options, $this->user_options );
        $this->assets         = $assets ?: new Assets( $this->context );
    }

    public function get_available_modules() {
        $module_classes = $this->get_registry()->get_all();
        foreach ( $module_classes as $module_class ) {
            // Pass dependencies to each module.
            $instance = new $module_class(
                $this->context,
                $this->options,
                $this->user_options,
                $this->authentication,
                $this->assets
            );

            $this->modules[ $instance->slug ] = $instance;
        }
    }
}
```

### Pattern 5: Lazy Initialization

Some dependencies are created lazily when first needed, but still injected through the constructor.

**Location**: `includes/Core/Modules/Module_With_Owner_Trait.php:25-80`

```php
trait Module_With_Owner_Trait {
    protected $owner_oauth_client;

    public function get_owner_oauth_client() {
        if ( $this->owner_oauth_client instanceof OAuth_Client ) {
            return $this->owner_oauth_client;
        }

        // Build using already-injected dependencies plus the owner's user options.
        $user_options = new User_Options( $this->context, $this->get_owner_id() );

        $this->owner_oauth_client = new OAuth_Client(
            $this->context,
            $this->options,
            $user_options,
            $this->authentication->credentials(),
            $this->authentication->get_google_proxy(),
            new Profile( $user_options ),
            new Token( $user_options )
        );

        return $this->owner_oauth_client;
    }
}
```

## Dependency Graphs

### Simple Dependency Chain

```
User_Options
    └── Context

Options
    └── Context

Transients
    └── Context
```

### Complex Dependency Chain

```
Modules (constructor-injected)
    ├── Context
    ├── Options
    │   └── Context
    ├── User_Options
    │   └── Context
    ├── Authentication
    │   ├── Context
    │   ├── Options
    │   ├── User_Options
    │   ├── Transients
    │   └── User_Input
    └── Assets
        └── Context

Module (base class)
    ├── Context              (injected)
    ├── Options              (injected, default if omitted)
    │   └── Context
    ├── User_Options         (injected, default if omitted)
    │   └── Context
    ├── Authentication       (injected, default if omitted)
    │   └── (see above)
    ├── Assets               (injected, default if omitted)
    │   └── Context
    └── Transients           (built internally from Context, not injected)
        └── Context
```

## Testing with Dependency Injection

Dependency injection makes testing straightforward by allowing mock objects.

### Example Test Setup

```php
class Module_Test extends TestCase {
    public function test_module_registration() {
        // Create mock dependencies
        $context        = $this->createMock( Context::class );
        $options        = $this->createMock( Options::class );
        $user_options   = $this->createMock( User_Options::class );
        $authentication = $this->createMock( Authentication::class );
        $assets         = $this->createMock( Assets::class );

        // Configure mock behavior
        $context->method( 'is_network_mode' )->willReturn( false );

        // Inject mocks into the class under test. Module subclasses such as
        // Analytics_4 accept five constructor arguments (Transients is built
        // internally, so it is not passed here).
        $module = new Analytics_4(
            $context,
            $options,
            $user_options,
            $authentication,
            $assets
        );

        // Test module behavior
        $this->assertTrue( $module->is_connected() );
    }
}
```

## Implementation Guidelines

### Creating New Classes

When creating new classes, follow these guidelines:

#### 1. When Context is required, always require it as the first parameter

```php
public function __construct( Context $context, /* other dependencies */ ) {
    $this->context = $context;
}
```

#### 2. Use type hints for all dependencies

```php
// Good
public function __construct( Context $context, Options $options ) { }

// Bad - no type hints
public function __construct( $context, $options ) { }
```

#### 3. Make dependencies optional only when reasonable defaults exist

```php
// Good - has sensible default
public function __construct( Context $context, ?Options $options = null ) {
    $this->options = $options ?: new Options( $context );
}

// Bad - no reasonable default, should be required
public function __construct( Context $context, ?Google_Client $client = null ) {
    $this->client = $client; // What if null?
}
```

#### 4. Store dependencies as private properties

```php
class MyClass {
    private $context;
    private $options;

    public function __construct( Context $context, Options $options ) {
        $this->context = $context;
        $this->options = $options;
    }
}
```

#### 5. Document constructor parameters

```php
/**
 * Constructor.
 *
 * \@since 1.0.0
 *
 * \@param Context        $context        Plugin context.
 * \@param Options        $options        Optional. Option API instance. Default is a new instance.
 * \@param User_Options   $user_options   Optional. User Option API instance. Default is a new instance.
 * \@param Authentication $authentication Optional. Authentication instance. Default is a new instance.
 */
public function __construct(
    Context $context,
    ?Options $options = null,
    ?User_Options $user_options = null,
    ?Authentication $authentication = null
) {
    // Implementation
}
```

## Best Practices

### DO

1. **Always inject dependencies through the constructor**

    ```php
    public function __construct( Context $context, Options $options ) {
        $this->context = $context;
        $this->options = $options;
    }
    ```

2. **Use type hints for all dependencies**

    ```php
    public function __construct( Context $context, ?Options $options = null ) { }
    ```

3. **Document all constructor parameters**

    ```php
    /**
     * \@param Context $context Plugin context.
     * \@param Options $options Settings storage.
     */
    ```

4. **Keep the dependency list reasonable (5-7 max)**

    - If you need more, consider creating a service that groups related functionality

5. **Use nullable types for optional dependencies**
    ```php
    public function __construct( Context $context, ?Options $options = null ) { }
    ```

### DON'T

1. **Don't create dependencies inside the class**

    ```php
    // Bad
    public function __construct( Context $context ) {
        $this->options = new Options( $context ); // Hard to test
    }

    // Good
    public function __construct( Context $context, Options $options ) {
        $this->options = $options; // Easy to test
    }
    ```

2. **Don't use global state or static methods for dependencies**

    ```php
    // Bad
    public function some_method() {
        $options = Options::get_instance(); // Static coupling
    }

    // Good
    public function some_method() {
        $value = $this->options->get( 'some_key' ); // Use injected dependency
    }
    ```

3. **Don't use service locators**

    ```php
    // Bad
    $service = ServiceContainer::get( 'some_service' );

    // Good - inject the service
    public function __construct( SomeService $service ) { }
    ```

4. **Don't make everything optional**
    - Only make dependencies optional when there's a sensible default
