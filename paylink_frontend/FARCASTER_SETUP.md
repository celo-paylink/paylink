# Farcaster Integration - Next Steps

## ✅ Completed

- ✅ Installed Farcaster SDK packages (`@farcaster/miniapp-sdk`, `@farcaster/miniapp-wagmi-connector`)
- ✅ Integrated Farcaster wallet connector with Wagmi/RainbowKit
- ✅ Added SDK initialization and splash screen handling
- ✅ Created Farcaster context hook (`useFarcaster`)
- ✅ Added meta tags for Farcaster embeds
- ✅ Created manifest template at `public/.well-known/farcaster.json`

## 🔲 Required: Sign the Manifest

The manifest needs to be signed with your Farcaster account. Follow these steps:

### 1. Deploy Your App

Deploy the app to get a public URL (e.g., Vercel):

```bash
# Build and deploy
yarn build
# Then deploy to Vercel or your hosting provider
```

### 2. Sign the Manifest

1. Go to: `https://farcaster.xyz/~/developers/mini-apps/manifest?domain=YOUR_DOMAIN`
   - Replace `YOUR_DOMAIN` with your deployed domain (e.g., `paylink.vercel.app`)
   - **Important**: Use the exact domain including subdomain
   
2. Sign the manifest with your Farcaster account

3. Copy the signed `accountAssociation` object

4. Update `public/.well-known/farcaster.json` with the signed data:
   ```json
   {
     "accountAssociation": {
       "header": "YOUR_SIGNED_HEADER",
       "payload": "YOUR_SIGNED_PAYLOAD", 
       "signature": "YOUR_SIGNED_SIGNATURE"
     },
     "frame": {
       "version": "1",
       "name": "Paylink",
       "iconUrl": "https://YOUR_DOMAIN/splash-icon.png",
       "splashImageUrl": "https://YOUR_DOMAIN/splash-icon.png",
       "splashBackgroundColor": "#1a0b2e",
       "homeUrl": "https://YOUR_DOMAIN/"
     }
   }
   ```

5. **Important**: Update URLs in the manifest to use absolute URLs with your domain

6. Redeploy the app with the updated manifest

### 3. Enable Developer Mode in Farcaster

1. Visit: `https://farcaster.xyz/~/settings/developer-tools`
2. Toggle on "Developer Mode"
3. Access developer tools from the left sidebar (desktop)

### 4. Test Your Mini App

#### In Farcaster Developer Tools:
1. Navigate to the developer section in Farcaster
2. Add your Mini App using your domain
3. Launch the app
4. Verify:
   - ✅ Splash screen appears and then hides
   - ✅ Wallet connects automatically (Farcaster wallet)
   - ✅ Can create payment links
   - ✅ Can claim payments

#### Share in Feed:
1. Create a cast with your app URL
2. Verify the rich embed appears
3. Click the "🔗 Open Paylink" button
4. App should launch with splash screen

#### Test Outside Farcaster:
1. Open the app URL in a regular browser
2. Verify wallet options (MetaMask, Coinbase, etc.) work
3. Ensure all features work normally

## 📝 Optional: Use Hosted Manifest

Instead of hosting your own manifest, you can use Farcaster's hosted manifest service:

1. Create a hosted manifest at `https://farcaster.xyz/~/developers/hosted-manifests`
2. Update `vercel.json` to redirect:
   ```json
   {
     "redirects": [
       {
         "source": "/.well-known/farcaster.json",
         "destination": "https://api.farcaster.xyz/miniapps/hosted-manifest/YOUR_MANIFEST_ID",
         "permanent": false
       }
     ]
   }
   ```

## 🎨 Customization

### Update Images

The following images are used in the integration:
- `/public/og-image.png` - Social sharing image (1200x800px, 3:2 ratio)
- `/public/splash-icon.png` - App splash screen icon (200x200px)
- `/public/favicon.png` - Browser favicon

Replace these with your branded images as needed.

### Update Meta Tags

Edit `index.html` to customize:
- App name and description
- OG image URLs
- Splash screen background color
- Button text in the embed

### Farcaster Actions

Use the `useFarcaster` hook in your components:

```typescript
import { useFarcaster, farcasterActions } from './context/use-farcaster'

function MyComponent() {
  const { isInFarcaster, user } = useFarcaster()
  
  if (isInFarcaster) {
    console.log('Running in Farcaster!', user)
    
    // Share a payment link in a cast
    farcasterActions.composeCast(
      'Check out my payment link!',
      ['https://your-domain.com/claim/ABC123']
    )
  }
  
  return (...)
}
```

## 🐛 Troubleshooting

### Splash Screen Won't Hide
- Check browser console for SDK errors
- Ensure `initializeFarcasterSDK()` is being called
- Verify no JavaScript errors on page load

### Wallet Not Connecting
- Verify Farcaster connector is in Wagmi config
- Check that you're testing inside Farcaster client
- Check browser console for connection errors

### Manifest Not Found (404)
- Verify `public/.well-known/farcaster.json` exists
- Check your build/deployment includes the `.well-known` directory
- Test: `curl https://YOUR_DOMAIN/.well-known/farcaster.json`

### Embed Not Showing
- Verify `fc:miniapp` meta tag is in `<head>`
- Check that imageUrl is a valid 3:2 ratio image
- Confirm JSON in meta tag is properly escaped

## 📚 Resources

- [Farcaster Mini Apps Documentation](https://miniapps.farcaster.xyz/)
- [SDK Reference](https://miniapps.farcaster.xyz/docs/sdk/context)
- [Manifest Specification](https://miniapps.farcaster.xyz/docs/specification#manifest)
- [Sign Manifest Tool](https://farcaster.xyz/~/developers/mini-apps/manifest)
- [Developer Mode](https://farcaster.xyz/~/settings/developer-tools)

## 💬 Support

For issues, reach out to the Farcaster team on Farcaster:
- @pirosb3
- @linda  
- @deodad
