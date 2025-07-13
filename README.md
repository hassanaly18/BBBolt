# BBBolt - Buy-Bye Mobile App

A comprehensive React Native mobile application built with Expo for the Buy-Bye grocery delivery platform. This app provides customers with a seamless shopping experience, location-based vendor discovery, real-time order tracking, and push notifications.

## 📱 Project Overview

BBBolt is the mobile counterpart to the Buy-Bye web platform, offering customers a native mobile experience for grocery shopping, vendor discovery, and order management. The app leverages location services, real-time notifications, and a robust state management system to deliver a smooth user experience.

## 🏗️ Project Structure

```
BBBolt/
├── app/                          # Main application directory (Expo Router)
│   ├── (tabs)/                   # Tab navigation screens
│   │   ├── index.jsx            # Home screen
│   │   ├── shop.jsx             # Shop/vendor discovery
│   │   ├── cart.jsx             # Shopping cart
│   │   ├── orders.jsx           # Order history & tracking
│   │   ├── account.jsx          # Account management
│   │   ├── profile.jsx          # User profile
│   │   ├── search.jsx           # Advanced search
│   │   ├── ration-packs.jsx     # Ration pack listings
│   │   ├── ration-pack-details.jsx # Ration pack details
│   │   ├── vendor-details.jsx   # Vendor details & products
│   │   └── _layout.jsx          # Tab navigation layout
│   ├── (modals)/                # Modal screens
│   │   ├── checkout/            # Checkout process
│   │   │   └── index.jsx        # Checkout screen
│   │   ├── cancel-order.jsx     # Order cancellation
│   │   └── _layout.jsx          # Modal layout
│   ├── auth/                    # Authentication screens
│   │   ├── login.jsx            # Login screen
│   │   ├── register.jsx         # Registration screen
│   │   ├── verify-email.jsx     # Email verification
│   │   ├── AuthContext.jsx      # Authentication context
│   │   └── _layout.jsx          # Auth layout
│   ├── context/                 # React Context providers
│   │   ├── AuthContext.jsx      # Authentication state
│   │   ├── LocationContext.jsx  # Location services
│   │   ├── CartContext.jsx      # Shopping cart state
│   │   ├── OrderContext.jsx     # Order management
│   │   ├── NotificationContext.jsx # Push notifications
│   │   └── test.html            # Testing utilities
│   ├── components/              # Reusable UI components
│   │   ├── Banner.jsx           # Promotional banners
│   │   ├── BottomTabs.jsx       # Custom tab navigation
│   │   ├── CategoryGrid.jsx     # Category display grid
│   │   ├── Header.jsx           # Screen headers
│   │   ├── Navbar.jsx           # Navigation bar
│   │   ├── PriceTag.jsx         # Price display component
│   │   ├── ProductCard.jsx      # Product display card
│   │   ├── ReviewsDisplay.jsx   # Review display
│   │   ├── ReviewsSection.jsx   # Review section
│   │   ├── ReviewButton.jsx     # Review action button
│   │   ├── ReviewModal.jsx      # Review modal
│   │   ├── SharedHeader.jsx     # Shared header component
│   │   ├── ShopHeader.jsx       # Shop-specific header
│   │   ├── SideMenu.jsx         # Side navigation menu
│   │   └── VendorCard.jsx       # Vendor display card
│   ├── services/                # API and external services
│   │   ├── api.js               # API client and endpoints
│   │   └── _apiConfig.js        # API configuration
│   ├── hooks/                   # Custom React hooks
│   │   ├── useShopData.js       # Shop data management
│   │   └── useShopFilters.js    # Shop filtering logic
│   ├── constants/               # App constants and theme
│   │   └── theme.js             # Design system and theme
│   ├── data/                    # Mock data and static content
│   │   └── mockData.js          # Mock data for development
│   ├── assets/                  # Static assets
│   │   ├── animations/          # Lottie animations
│   │   │   └── success-check.json
│   │   └── icons/               # App icons
│   │       └── groceries.png
│   ├── category/                # Category-specific screens
│   │   └── [id].jsx             # Dynamic category page
│   ├── product/                 # Product-specific screens
│   │   └── [id].jsx             # Dynamic product page
│   ├── orders/                  # Order-specific screens
│   │   └── [id].jsx             # Dynamic order details
│   ├── messages.jsx             # Messages screen
│   ├── settings.jsx             # Settings screen
│   ├── tracking.jsx             # Order tracking screen
│   ├── +not-found.jsx           # 404 error page
│   └── _layout.jsx              # Root layout
├── android/                     # Android-specific configuration
├── assets/                      # App assets (icons, images)
├── types/                       # TypeScript type definitions
│   └── products.ts              # Product type definitions
├── app.json                     # Expo configuration
├── package.json                 # Dependencies and scripts
├── babel.config.js              # Babel configuration
├── metro.config.js              # Metro bundler configuration
├── tsconfig.json                # TypeScript configuration
├── eas.json                     # EAS Build configuration
└── .prettierrc                  # Code formatting rules
```

## 🛠️ Technology Stack

### Core Framework

- **React Native**: 0.76.9 - Cross-platform mobile development
- **Expo**: ~52.0.0 - Development platform and tools
- **Expo Router**: ~4.0.0 - File-based routing system

### Navigation & UI

- **React Navigation**: ^7.0.14 - Navigation library
- **React Native Gesture Handler**: ~2.20.2 - Touch handling
- **React Native Reanimated**: ~3.16.1 - Animations
- **React Native Safe Area Context**: 4.12.0 - Safe area handling
- **React Native Screens**: ~4.4.0 - Screen management

### Styling & Design

- **Expo Linear Gradient**: ~14.0.2 - Gradient backgrounds
- **Expo Blur**: ~14.0.3 - Blur effects
- **React Native SVG**: 15.8.0 - SVG support
- **Lottie React Native**: 7.1.0 - Animation support
- **Moti**: ~0.30.0 - Animation library

### Maps & Location

- **React Native Maps**: 1.18.0 - Map integration
- **Expo Location**: ~18.0.10 - Location services

### Notifications

- **Expo Notifications**: ~0.29.14 - Push notifications
- **Expo Device**: ~7.0.3 - Device information

### State Management

- **React Context API**: Built-in state management
- **AsyncStorage**: 1.23.1 - Local storage

### Networking

- **Axios**: ^1.9.0 - HTTP client
- **React Native URL Polyfill**: ~2.0.0 - URL polyfill

### Development Tools

- **TypeScript**: ^5.3.3 - Type safety
- **Babel**: ^7.25.2 - JavaScript compiler
- **Metro**: ^0.81.0 - JavaScript bundler

## 🎨 Design System

### Color Palette

The app uses a consistent purple and yellow color scheme:

```javascript
// Primary Colors (Purple Theme)
primary: {
  main: '#4d216d',    // Main purple
  light: '#6a2c8f',   // Lighter purple
  dark: '#3a1a52',    // Darker purple
  contrastText: '#FFFFFF'
}

// Secondary Colors (Yellow Theme)
secondary: {
  main: '#ffd600',    // Yellow
  light: '#ffe033',   // Lighter yellow
  dark: '#e6c100',    // Darker yellow
  contrastText: '#000000'
}

// Background Colors
background: {
  main: '#f8f9fa',    // Light gray-blue
  white: '#FFFFFF',
  secondary: '#f1f3f4'
}
```

### Typography

Comprehensive typography system with consistent font sizes and weights:

```javascript
typography: {
  h1: { fontSize: 32, fontWeight: '700' },
  h2: { fontSize: 24, fontWeight: '700' },
  h3: { fontSize: 20, fontWeight: '600' },
  body1: { fontSize: 16, fontWeight: '400' },
  button: { fontSize: 14, fontWeight: '600' }
}
```

### Spacing & Shadows

Consistent spacing and shadow system for UI elements:

```javascript
spacing: {
  xs: 4, sm: 8, md: 16, lg: 24, xl: 32, xxl: 48
}

shadows: {
  sm: { shadowOpacity: 0.12, shadowRadius: 4, elevation: 3 },
  md: { shadowOpacity: 0.15, shadowRadius: 6, elevation: 6 },
  lg: { shadowOpacity: 0.18, shadowRadius: 8, elevation: 10 }
}
```

## 🔐 Authentication System

### Features

- **User Registration**: Email-based registration with validation
- **Email Verification**: Secure email verification system
- **Login/Logout**: Token-based authentication
- **Profile Management**: User profile updates
- **Protected Routes**: Automatic route protection

### Implementation

```javascript
// AuthContext provides:
-register(userData) - // User registration
  login(credentials) - // User login
  logout() - // User logout
  verifyEmail(token) - // Email verification
  updateProfile(profileData) - // Profile updates
  updateLocation(locationData); // Location updates
```

### Route Protection

- Automatic redirection to login for unauthenticated users
- Route-based access control
- Token persistence with AsyncStorage

## 📍 Location Services

### Features

- **GPS Location**: Real-time location tracking
- **Permission Handling**: Automatic permission requests
- **Address Geocoding**: Reverse geocoding for addresses
- **Manual Address Entry**: Support for manual address input
- **Server Synchronization**: Location updates to backend

### Implementation

```javascript
// LocationContext provides:
-location - // Current coordinates
  address - // Formatted address
  requestLocationPermission() - // Permission request
  getCurrentLocation() - // Get current location
  setManualAddress(address) - // Manual address entry
  getLocationParams(); // API location parameters
```

### Distance Calculation

Uses Haversine formula for accurate distance calculations between user and vendors.

## 🛒 Shopping Cart System

### Features

- **Add/Remove Items**: Dynamic cart management
- **Quantity Updates**: Real-time quantity changes
- **Price Calculations**: Discount and total calculations
- **Server Synchronization**: Cart persistence
- **Multi-vendor Support**: Vendor-specific cart items

### Implementation

```javascript
// CartContext provides:
-cartItems - // Cart items array
  addToCart(vendorProduct) - // Add item to cart
  removeFromCart(itemId) - // Remove item from cart
  updateQuantity(itemId, qty) - // Update item quantity
  clearCart() - // Clear entire cart
  getCartTotal() - // Calculate total
  getCartCount(); // Get item count
```

### Discount Handling

Supports both percentage and fixed amount discounts with automatic price calculations.

## 📦 Order Management

### Features

- **Order Creation**: Seamless order placement
- **Order Tracking**: Real-time order status
- **Order History**: Complete order history
- **Order Cancellation**: Order cancellation with reasons
- **Push Notifications**: Real-time order updates

### Implementation

```javascript
// OrderContext provides:
-orders - // Order history
  createOrder(orderData) - // Create new order
  createDirectOrder(orderData) - // Direct order creation
  cancelOrder(orderId, reason) - // Cancel order
  getOrderTracking(orderId) - // Get tracking info
  updateOrderStatus(orderId, status); // Update status
```

### Order Status Flow

1. **Pending** → Order placed, awaiting confirmation
2. **Processing** → Order confirmed, being prepared
3. **Out for Delivery** → Order en route
4. **Delivered** → Order completed
5. **Cancelled** → Order cancelled

## 🔔 Push Notifications

### Features

- **Order Updates**: Real-time order status notifications
- **Permission Handling**: Automatic permission requests
- **Foreground Notifications**: In-app notification display
- **Deep Linking**: Direct navigation to order details
- **Token Management**: Automatic token registration

### Implementation

```javascript
// NotificationContext provides:
- expoPushToken               // Push notification token
- sendLocalNotification()     // Send local notification
- Automatic order status handling
- Deep linking to order details
```

### Notification Types

- **Order Status Changes**: Real-time order updates
- **Delivery Updates**: Delivery progress notifications
- **Promotional**: Marketing and promotional content

## 🗺️ Maps Integration

### Features

- **Vendor Locations**: Display vendor locations on map
- **Distance Calculation**: Real-time distance calculations
- **Location-based Search**: Location-aware vendor discovery
- **Interactive Maps**: Touch and zoom functionality

### Implementation

- Uses React Native Maps for map display
- Integrates with Expo Location for user location
- Haversine formula for distance calculations
- Location-based vendor filtering

## 🔍 Search & Filtering

### Features

- **Vendor Search**: Search by vendor name and location
- **Product Search**: Search by product name and category
- **Category Filtering**: Filter by product categories
- **Distance Filtering**: Filter by distance radius
- **Sorting Options**: Multiple sorting criteria

### Implementation

```javascript
// Search features:
- Text-based search across vendors and products
- Category-based filtering
- Distance-based filtering (1km to 50km radius)
- Sorting by distance, name, and other criteria
- Real-time search results
```

### Filter Options

- **Radius**: 1km, 3km, 5km, 10km, 15km, 20km, 25km, 50km
- **Sorting**: Nearest, Farthest, Name A-Z, Name Z-A
- **Categories**: All product categories and subcategories

## 🛍️ Vendor Discovery

### Features

- **Nearby Vendors**: Location-based vendor discovery
- **Vendor Details**: Comprehensive vendor information
- **Product Catalogs**: Vendor-specific product listings
- **Reviews & Ratings**: Customer reviews and ratings
- **Distance Information**: Real-time distance calculations

### Implementation

```javascript
// Vendor discovery features:
- Location-based vendor search
- Vendor details with product catalogs
- Review and rating system
- Distance calculations
- Vendor filtering and sorting
```

## 📱 Screen Architecture

### Tab Navigation

1. **Home** (`index.jsx`): Featured products, categories, promotions
2. **Shop** (`shop.jsx`): Vendor discovery and browsing
3. **Cart** (`cart.jsx`): Shopping cart management
4. **Orders** (`orders.jsx`): Order history and tracking
5. **Account** (`account.jsx`): User account management

### Modal Screens

- **Checkout** (`checkout/index.jsx`): Order completion process
- **Cancel Order** (`cancel-order.jsx`): Order cancellation

### Authentication Screens

- **Login** (`auth/login.jsx`): User authentication
- **Register** (`auth/register.jsx`): User registration
- **Verify Email** (`auth/verify-email.jsx`): Email verification

## 🔧 API Integration

### Base Configuration

```javascript
// API Configuration
const API_URL = 'https://buy-bye-backend.vercel.app/api';

// Axios instance with interceptors
- Automatic token attachment
- Error handling for 401 responses
- Request/response logging
- Timeout configuration
```

### API Endpoints

```javascript
// Customer APIs
- /customers/register              // User registration
- /customers/login                 // User login
- /customers/verify-email/:token   // Email verification
- /customers/profile               // Profile management
- /customers/update-location       // Location updates
- /customers/nearby-vendors        // Nearby vendor search
- /customers/nearby-products       // Nearby product search
- /customers/search-nearby-vendors-products // Combined search

// Cart APIs
- /cart                            // Cart management
- /cart/:vendorProductId           // Cart item operations

// Order APIs
- /orders                          // Order creation
- /orders/direct                   // Direct order creation
- /customer/orders                 // Order history
- /customer/orders/:id             // Order details
- /customer/orders/:id/cancel      // Order cancellation
- /customer/orders/:id/tracking    // Order tracking
```

## 🚀 Performance Optimizations

### Code Splitting

- File-based routing with Expo Router
- Lazy loading of screens
- Component-level code splitting

### Image Optimization

- Optimized image loading
- Caching strategies
- Progressive image loading

### State Management

- Efficient context usage
- Memoized calculations
- Optimized re-renders

### Network Optimization

- Request caching
- Optimistic updates
- Error handling and retries

## 🔒 Security Features

### Authentication Security

- JWT token-based authentication
- Secure token storage with AsyncStorage
- Automatic token refresh
- Route protection

### Data Security

- HTTPS API communication
- Input validation and sanitization
- Secure error handling
- No sensitive data logging

### Location Security

- Permission-based location access
- Secure location data transmission
- Privacy-conscious location handling

## 📱 Platform Support

### iOS Features

- iOS-specific UI components
- iOS navigation patterns
- iOS notification handling
- iOS-specific optimizations

### Android Features

- Android-specific UI components
- Android navigation patterns
- Android notification channels
- Android-specific optimizations

### Web Support

- Web-specific optimizations
- Responsive design
- Web-specific navigation
- Progressive Web App features

## 🧪 Testing Strategy

### Unit Testing

- Component testing with React Native Testing Library
- Hook testing
- Utility function testing

### Integration Testing

- API integration testing
- Navigation testing
- State management testing

### E2E Testing

- User flow testing
- Cross-platform testing
- Performance testing

## 📦 Build & Deployment

### Development

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Run on iOS simulator
npx expo run:ios

# Run on Android emulator
npx expo run:android
```

### Production Build

```bash
# Build for iOS
eas build --platform ios

# Build for Android
eas build --platform android

# Build for web
npm run build:web
```

### EAS Configuration

```json
{
  "build": {
    "development": {
      "developmentClient": true,
      "distribution": "internal"
    },
    "preview": {
      "distribution": "internal"
    },
    "production": {}
  }
}
```

## 🔄 State Management Architecture

### Context Providers Hierarchy

```javascript
<AuthProvider>
  <LocationProvider>
    <CartProvider>
      <NotificationProvider>
        <OrderProvider>{/* App Content */}</OrderProvider>
      </NotificationProvider>
    </CartProvider>
  </LocationProvider>
</AuthProvider>
```

### State Flow

1. **Authentication State**: User login/logout, profile data
2. **Location State**: GPS coordinates, address, permissions
3. **Cart State**: Shopping cart items, quantities, totals
4. **Notification State**: Push tokens, notification handling
5. **Order State**: Order history, tracking, status updates

## 🎯 Key Features

### Core Functionality

- ✅ User authentication and registration
- ✅ Location-based vendor discovery
- ✅ Shopping cart management
- ✅ Order placement and tracking
- ✅ Push notifications
- ✅ Real-time order updates
- ✅ Product search and filtering
- ✅ Vendor reviews and ratings
- ✅ Email verification system
- ✅ Profile management

### Advanced Features

- ✅ Distance-based vendor sorting
- ✅ Discount calculation system
- ✅ Multi-vendor cart support
- ✅ Order cancellation with reasons
- ✅ Deep linking for notifications
- ✅ Offline state persistence
- ✅ Responsive design
- ✅ Cross-platform compatibility

## 🚀 Future Enhancements

### Planned Features

- [ ] Offline mode support
- [ ] Advanced payment integration
- [ ] Voice search capabilities
- [ ] AR product visualization
- [ ] Social sharing features
- [ ] Loyalty program integration
- [ ] Advanced analytics
- [ ] Multi-language support

### Performance Improvements

- [ ] Image lazy loading optimization
- [ ] Advanced caching strategies
- [ ] Bundle size optimization
- [ ] Memory usage optimization

## 📄 License

This project is part of the Buy-Bye platform and is proprietary software.

## 👥 Contributing

For development and contribution guidelines, please refer to the project documentation and coding standards.

---

**BBBolt** - Empowering customers with seamless grocery shopping experience through innovative mobile technology.
