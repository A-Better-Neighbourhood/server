<!-- @format -->

# Cross-Origin Authentication Fix

## Issues Fixed

### 1. CORS Configuration ✅

**Problem**: CORS origin had trailing slash and used `"*"` with credentials
**Solution**:

- Removed trailing slash from frontend URL
- Added proper methods and headers
- Used environment-based origin configuration

### 2. Cookie Settings ✅

**Problem**: Cross-origin cookies weren't working
**Solution**: Updated cookie settings for both signIn and signUp:

```javascript
res.cookie("token", token, {
  httpOnly: true,
  secure: true, // Always true for HTTPS
  sameSite: "none", // Required for cross-origin
  maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
  path: "/", // Available on all paths
});
```

### 3. Auth Middleware ✅

**Problem**: Middleware didn't properly handle Authorization headers as fallback
**Solution**: Added proper token extraction from both cookies and Bearer tokens

### 4. Environment Configuration ✅

**Problem**: Hard-coded frontend URLs
**Solution**: Added `FRONTEND_URL` environment variable

---

## Environment Variables to Set

Add these to your production environment (Render):

```bash
FRONTEND_URL=https://abn-phi.vercel.app
NODE_ENV=production
# ... your other existing env vars
```

---

## Frontend Changes Required

### Option 1: Use cookies (Recommended)

Your cookies should now work! Make sure your frontend makes requests with:

```javascript
// Axios example
axios.defaults.withCredentials = true;

// Or for individual requests
axios.post("https://abn-server.onrender.com/api/auth/signin", data, {
  withCredentials: true,
});

// Fetch example
fetch("https://abn-server.onrender.com/api/auth/signin", {
  method: "POST",
  credentials: "include", // This is crucial!
  headers: {
    "Content-Type": "application/json",
  },
  body: JSON.stringify(data),
});
```

### Option 2: Use Authorization Header (Fallback)

If cookies still don't work, extract token from response and use headers:

```javascript
// After signin/signup, extract token
const { data } = await axios.post("/auth/signin", loginData, {
  withCredentials: true,
});
const token = data.data.token; // If you return token in response

// Store token (localStorage, secure storage, etc.)
localStorage.setItem("token", token);

// Use in subsequent requests
axios.defaults.headers.common["Authorization"] = `Bearer ${token}`;
```

---

## Why This Was Happening

1. **Cross-Origin Cookies**: Browsers block cookies from different domains unless:

   - `sameSite: "none"`
   - `secure: true` (HTTPS only)
   - Server allows credentials in CORS
   - Frontend sends `credentials: 'include'`

2. **CORS Issues**:
   - Trailing slash difference (`abn-phi.vercel.app/` vs `abn-phi.vercel.app`)
   - Missing required headers and methods
   - Using `"*"` origin with credentials (not allowed)

---

## Testing Steps

1. **Deploy your backend** with the new changes
2. **Set environment variables** on Render:

   - `FRONTEND_URL=https://abn-phi.vercel.app`
   - `NODE_ENV=production`

3. **Update frontend** to use `credentials: 'include'` or `withCredentials: true`

4. **Test authentication flow**:
   - Sign up should set cookie and work
   - Sign in should set cookie and work
   - Protected routes should work with cookie
   - If cookies fail, fallback to Authorization header should work

---

## Quick Debug Tips

Check browser Network tab:

- Response should have `Set-Cookie` header
- Request should have `Cookie` header in subsequent calls
- No CORS errors in console

If cookies still don't work:

- Verify both domains are HTTPS in production
- Check if browser blocks third-party cookies
- Use Authorization header as fallback
