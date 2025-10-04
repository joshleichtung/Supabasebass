# JamSync Deployment Guide

## Prerequisites

1. **Supabase Project**
   - Create project at [supabase.com](https://supabase.com)
   - Note your project URL and anon key

2. **Hosting Platform** (choose one)
   - Vercel (recommended for Vite projects)
   - Netlify
   - Cloudflare Pages

## Deployment Steps

### Option 1: Vercel (Recommended)

#### 1. Install Vercel CLI
```bash
npm i -g vercel
```

#### 2. Configure Project
Create `vercel.json`:
```json
{
  "buildCommand": "npm run build",
  "outputDirectory": "dist",
  "devCommand": "npm run dev",
  "installCommand": "npm install"
}
```

#### 3. Set Environment Variables
In Vercel dashboard or via CLI:
```bash
vercel env add VITE_SUPABASE_URL
vercel env add VITE_SUPABASE_ANON_KEY
```

#### 4. Deploy
```bash
vercel --prod
```

### Option 2: Netlify

#### 1. Create `netlify.toml`
```toml
[build]
  command = "npm run build"
  publish = "dist"

[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200
```

#### 2. Configure Environment
In Netlify dashboard:
- Go to Site settings → Environment variables
- Add `VITE_SUPABASE_URL`
- Add `VITE_SUPABASE_ANON_KEY`

#### 3. Deploy
```bash
# Connect to git and deploy automatically
# Or use Netlify CLI:
npm i -g netlify-cli
netlify deploy --prod
```

### Option 3: Cloudflare Pages

#### 1. Configure Build
- Build command: `npm run build`
- Build output directory: `dist`
- Root directory: `/`

#### 2. Environment Variables
Add in Pages dashboard:
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`

#### 3. Deploy via Git
- Connect repository
- Cloudflare auto-deploys on push

## Supabase Production Setup

### 1. Enable Realtime
In your Supabase project dashboard:
- Go to Database → Replication
- Enable Realtime for any tables (if using database features)

### 2. Configure CORS (if needed)
Supabase Realtime should work by default, but if you encounter CORS issues:
- Go to Settings → API
- Add your deployment domain to allowed origins

### 3. Rate Limiting
For production, consider:
- Supabase plan limits on concurrent connections
- Implement rate limiting in your app if needed
- Monitor usage in Supabase dashboard

## Environment Configuration

### Development (.env.local)
```env
VITE_SUPABASE_URL=http://127.0.0.1:54321
VITE_SUPABASE_ANON_KEY=<local-dev-key>
```

### Production (.env.production)
```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=<production-anon-key>
```

**⚠️ Security Note:**
- Never commit `.env` files to git
- Anon key is safe to expose (it's public)
- Keep service role key private (don't use in frontend)

## Post-Deployment Checklist

- [ ] Test in multiple browsers (Chrome, Safari, Firefox)
- [ ] Test on mobile devices (iOS, Android)
- [ ] Verify real-time sync works across devices
- [ ] Check browser console for errors
- [ ] Monitor Supabase dashboard for connection issues
- [ ] Test with 3+ simultaneous users
- [ ] Verify audio playback on all devices

## Performance Monitoring (Optional)

### Add Datadog RUM (Stretch Goal)
```bash
npm install @datadog/browser-rum
```

In `src/main.tsx`:
```typescript
import { datadogRum } from '@datadog/browser-rum'

datadogRum.init({
  applicationId: '<your-app-id>',
  clientToken: '<your-client-token>',
  site: 'datadoghq.com',
  service: 'jamsync',
  env: 'production',
  version: '0.0.1',
  sessionSampleRate: 100,
  sessionReplaySampleRate: 20,
  trackUserInteractions: true,
  trackResources: true,
  trackLongTasks: true,
  defaultPrivacyLevel: 'mask-user-input'
})
```

## Troubleshooting

### WebSocket Connection Fails
- Check Supabase URL and anon key
- Verify CORS configuration
- Check browser console for specific errors
- Test Supabase connection: `https://your-project.supabase.co/rest/v1/`

### Audio Doesn't Play
- Ensure user interaction before audio starts (browser requirement)
- Check Web Audio API support
- Verify Tone.js loaded correctly
- Check browser console for Tone.js errors

### Build Fails
- Run `npm run typecheck` to find TypeScript errors
- Clear `node_modules` and reinstall: `rm -rf node_modules && npm install`
- Check Node.js version (requires 18+)

## Custom Domain Setup

### Vercel
```bash
vercel domains add yourdomain.com
```
Then add DNS records as instructed.

### Netlify
- Go to Domain settings
- Add custom domain
- Configure DNS (A record or CNAME)

### Cloudflare Pages
- Add custom domain in Pages settings
- DNS automatically configured if using Cloudflare

## Continuous Deployment

### Git-Based Deployment
Most platforms auto-deploy on git push to main branch:

1. Connect repository (GitHub, GitLab, Bitbucket)
2. Select branch (usually `main`)
3. Configure build settings
4. Push commits → auto-deploy

### Manual Deployment
```bash
npm run build        # Build locally
vercel --prod        # Or netlify deploy --prod
```

## Scaling Considerations

### Supabase Limits (Free Tier)
- Concurrent connections: varies by plan
- Bandwidth: 2GB/month
- Realtime messages: unlimited

### Upgrade Path
- Monitor usage in Supabase dashboard
- Upgrade plan if hitting limits
- Consider implementing connection pooling

## Backup & Rollback

### Vercel
- Each deployment gets unique URL
- Rollback via dashboard or CLI: `vercel rollback`

### Netlify
- Each deploy saved permanently
- Rollback via dashboard: Site → Deploys → Restore

## Support Resources

- [Supabase Docs](https://supabase.com/docs)
- [Vercel Docs](https://vercel.com/docs)
- [Netlify Docs](https://docs.netlify.com)
- [Tone.js Docs](https://tonejs.github.io)
