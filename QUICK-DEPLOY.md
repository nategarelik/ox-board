# 🚀 Quick Deploy Guide - Railway + Vercel

## ✅ What's Already Done

- Complete backend implementation (35 files)
- All code committed to branch `003-self-hosted-demucs`
- Code pushed to GitHub: https://github.com/nategarelik/ox-board/tree/003-self-hosted-demucs
- Ready for deployment!

---

## 📦 Deploy Backend to Railway (5 minutes)

### Step 1: Access Railway Dashboard

1. Go to **https://railway.com/new**
2. Click **"Deploy from GitHub repo"**
3. Search for `nategarelik/ox-board`
4. Select the repository

### Step 2: Configure Deployment

1. **Branch**: Select `003-self-hosted-demucs`
2. **Root Directory**: Set to `backend`
3. Click **"Add variables"** and set:
   ```
   REDIS_URL=redis://default:password@redis:6379
   LOG_LEVEL=INFO
   ENVIRONMENT=production
   PORT=8000
   ```
4. Click **"Deploy"**

### Step 3: Add Redis Service

1. In your Railway project dashboard, click **"+ New"**
2. Select **"Database" → "Redis"**
3. Wait for Redis to deploy
4. Copy the Redis connection string from Redis service
5. Update `REDIS_URL` variable in backend service with the actual Redis URL

### Step 4: Get Backend URL

1. Go to your backend service **"Settings"**
2. Click **"Generate Domain"** under **Networking**
3. Copy the generated URL (e.g., `https://ox-board-backend-production.up.railway.app`)
4. **Save this URL** - you'll need it for Vercel

---

## 🌐 Deploy Frontend to Vercel (3 minutes)

### Step 1: Import to Vercel

1. Go to **https://vercel.com/new**
2. Click **"Import Git Repository"**
3. Select `nategarelik/ox-board`
4. Branch: `003-self-hosted-demucs`
5. Click **"Import"**

### Step 2: Configure Environment

Before clicking Deploy, add this environment variable:

**Key**: `NEXT_PUBLIC_BACKEND_URL`
**Value**: `https://your-railway-backend-url-here.railway.app` (from Railway Step 4)

### Step 3: Deploy

1. Click **"Deploy"**
2. Wait for build to complete (~2-3 minutes)
3. Click on the deployed URL to test

---

## ✅ Verify Deployment

### Test Backend Health

```bash
curl https://your-railway-backend-url.railway.app/health
```

Expected response:

```json
{
  "status": "healthy",
  "version": "1.0.0",
  "redis": "connected"
}
```

### Test Frontend

1. Open your Vercel URL
2. Navigate to stem upload page
3. Upload a short audio file (< 1 minute for quick test)
4. Verify job is created and processing starts
5. Wait for stems to be generated

---

## 🔧 Troubleshooting

### Backend Issues

**Issue**: Backend crashes on startup

- **Check**: Railway logs for errors
- **Fix**: Verify all environment variables are set correctly
- **Fix**: Ensure Redis service is running and connected

**Issue**: "Module not found" errors

- **Fix**: Railway auto-installs from `backend/requirements.txt`
- **Fix**: Check that root directory is set to `backend`

### Frontend Issues

**Issue**: "Failed to connect to backend"

- **Check**: `NEXT_PUBLIC_BACKEND_URL` is set correctly in Vercel
- **Fix**: Make sure Railway backend is deployed and running
- **Fix**: Test backend URL directly in browser

**Issue**: CORS errors

- **Check**: Backend CORS middleware allows Vercel domain
- **Fix**: Add Vercel URL to allowed origins in backend config

---

## 📊 Monitoring

### Railway Metrics

- Go to your service → **Metrics** tab
- Monitor CPU, memory, and request volume
- Check logs for errors

### Vercel Analytics

- Go to your project → **Analytics** tab
- Monitor page views and performance
- Check for build errors

---

## 💰 Costs

### Railway (Backend + Redis)

- **Free tier**: $5/month credit (good for testing)
- **Production**: ~$20-30/month
  - Backend service: $10-15/month
  - Redis: $5/month
  - Bandwidth: $5-10/month

### Vercel (Frontend)

- **Free tier**: Generous limits for personal projects
- **Production**: Free for most use cases
- Only pay if you exceed hobby plan limits

---

## 🎯 Next Steps After Deployment

1. **Test with real audio files**
   - Upload various formats (mp3, wav, m4a)
   - Test YouTube URL processing
   - Verify stem separation quality

2. **Monitor performance**
   - Check processing times
   - Monitor memory usage
   - Review error logs

3. **Optimize if needed**
   - Enable GPU on Railway if available
   - Tune Celery worker count
   - Add caching layer

4. **Merge to main**
   ```bash
   git checkout main
   git merge 003-self-hosted-demucs
   git push origin main
   ```

---

## 📚 Additional Resources

- **Full Documentation**: See `DEPLOYMENT.md`
- **Implementation Details**: See `IMPLEMENTATION-COMPLETE.md`
- **Backend README**: See `backend/README.md`
- **API Docs**: `https://your-backend-url.railway.app/docs`

---

## 🆘 Need Help?

If you encounter issues:

1. Check Railway logs: `railway logs`
2. Check Vercel logs: Vercel dashboard → Deployments → Your deployment → Runtime Logs
3. Verify environment variables are set correctly
4. Test backend health endpoint
5. Review CORS configuration

---

**Status**: ✅ Ready to Deploy!
**Time Required**: ~8 minutes total
**Next Action**: Go to https://railway.com/new and follow Step 1 above
